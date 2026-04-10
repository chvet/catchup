import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/data/db'
import { campagne, conversation, message, utilisateur } from '@/data/schema'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getFragilityLevel } from '@/core/fragility-detector'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message: msg } = body
    let { conversationId, utilisateurId } = body
    const { campagneId } = body

    if (!msg?.role || !msg?.contenu) {
      return NextResponse.json(
        { error: 'Message role and contenu are required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // 1. Create anonymous user if needed
    if (!utilisateurId) {
      utilisateurId = uuidv4()
      await db.insert(utilisateur).values({
        id: utilisateurId,
        prenom: null,
        creeLe: now,
        misAJourLe: now,
      })
    }

    // 2. Create conversation if needed
    if (!conversationId) {
      conversationId = uuidv4()
      await db.insert(conversation).values({
        id: conversationId,
        utilisateurId,
        titre: "Conversation Catch'Up",
        statut: 'active',
        origine: 'direct',
        phase: 'accroche',
        nbMessages: 0,
        creeLe: now,
        misAJourLe: now,
      })
    }

    // 2b. Track campaign conversation (first message only)
    if (campagneId && msg.role === 'user') {
      // Check if this is the first message of this conversation
      const convData = await db.select({ nbMessages: conversation.nbMessages }).from(conversation).where(eq(conversation.id, conversationId))
      if (convData.length > 0 && (convData[0].nbMessages ?? 0) === 0) {
        db.update(campagne)
          .set({ nbConversations: sql`COALESCE(${campagne.nbConversations}, 0) + 1` })
          .where(eq(campagne.id, campagneId))
          .catch(() => {})
      }
    }

    // 3. Detect fragility on user messages
    let fragilityResult = { level: 'none' as string, score: 0, categories: [] as string[] }
    if (msg.role === 'user') {
      const level = getFragilityLevel(msg.contenu)
      // Build score and categories from the level
      const scoreMap: Record<string, number> = { none: 0, low: 1, medium: 3, high: 5 }
      const categoryMap: Record<string, string[]> = {
        none: [],
        low: ['decouragement'],
        medium: ['isolement', 'decouragement'],
        high: ['detresse', 'isolement'],
      }
      fragilityResult = {
        level,
        score: scoreMap[level] ?? 0,
        categories: categoryMap[level] ?? [],
      }
    }

    // 4. Insert message
    const messageId = uuidv4()
    await db.insert(message).values({
      id: messageId,
      conversationId,
      role: msg.role,
      contenu: msg.contenu,
      contenuBrut: msg.contenuBrut ?? null,
      fragiliteDetectee: fragilityResult.level !== 'none' ? 1 : 0,
      niveauFragilite: fragilityResult.level,
      confidentiel: msg.confidentiel ? 1 : 0,
      horodatage: now,
    })

    // 5. Update conversation message count
    await db
      .update(conversation)
      .set({
        nbMessages: sql`${conversation.nbMessages} + 1`,
        misAJourLe: now,
      })
      .where(eq(conversation.id, conversationId))

    // 6. Return response
    return NextResponse.json({
      conversationId,
      utilisateurId,
      messageId,
      fragility: {
        level: fragilityResult.level,
        score: fragilityResult.score,
        categories: fragilityResult.categories,
      },
    })
  } catch (error) {
    console.error('[messages/save] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
