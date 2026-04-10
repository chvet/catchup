import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/data/db'
import { campagne, conversation, message, utilisateur, referral, profilRiasec, structure, priseEnCharge, messageDirect, evenementAudit, tarification } from '@/data/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { matcherStructures, type MatchingCriteria, type StructureData, type TarifInfo } from '@/core/matching'
import { generateText } from 'ai'
import { getLLMModel } from '@/lib/llm'
import { recordUsage } from '@/lib/token-guard'
import { logJournal } from '@/lib/journal'
import { notifyConseillerNewCase } from '@/lib/push-triggers'
import { syncBeneficiaireToParcoureo, isParcoureoConfigured } from '@/lib/parcoureo'
import { PRIORITY_MAP, DETECTION_LEVEL_MAP, safeJsonParse } from '@/core/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      conversationId,
      utilisateurId,
      prenom,
      moyenContact,
      typeContact,
      departement,
      age,
      genre,
      fragilityLevel,
      structureSlug,
      campagneId,
      preferenceStructure,
    } = body

    if (!conversationId || !utilisateurId) {
      return NextResponse.json(
        { error: 'conversationId and utilisateurId are required' },
        { status: 400 }
      )
    }

    console.log('[Referral] POST reçu:', { prenom, typeContact, departement, age, structureSlug, campagneId })

    const now = new Date().toISOString()
    let resolvedUserId = utilisateurId

    // 1. Déduplication : chercher si un utilisateur existe déjà avec le même email ou téléphone
    if (moyenContact) {
      const contactFilter = typeContact === 'email'
        ? eq(utilisateur.email, moyenContact.toLowerCase().trim())
        : eq(utilisateur.telephone, moyenContact.trim())

      const duplicateUser = await db.select().from(utilisateur)
        .where(and(contactFilter, sql`${utilisateur.id} != ${utilisateurId}`))
        .limit(1)

      if (duplicateUser.length > 0) {
        const existingUserId = duplicateUser[0].id
        console.log(`[Dedup] Bénéficiaire reconnu: ${moyenContact} → fusionné avec ${existingUserId}`)

        // Transférer la conversation courante vers le compte existant
        if (conversationId) {
          await db.update(conversation)
            .set({ utilisateurId: existingUserId, misAJourLe: now })
            .where(eq(conversation.id, conversationId))
        }

        // Mettre à jour le profil existant avec les nouvelles infos
        const updateData: Record<string, unknown> = { misAJourLe: now }
        if (prenom) updateData.prenom = prenom
        if (age) updateData.age = age
        if (departement) { updateData.situation = departement; updateData.source = departement }
        if (typeContact === 'telephone' && moyenContact) updateData.telephone = moyenContact
        if (typeContact === 'email' && moyenContact) updateData.email = moyenContact.toLowerCase().trim()
        updateData.derniereVisite = now
        await db.update(utilisateur).set(updateData).where(eq(utilisateur.id, existingUserId))

        // Supprimer le compte anonyme dupliqué (s'il n'a pas d'autres conversations)
        const otherConvs = await db.select({ id: conversation.id }).from(conversation)
          .where(eq(conversation.utilisateurId, utilisateurId))
          .limit(1)
        if (otherConvs.length === 0) {
          await db.delete(utilisateur).where(eq(utilisateur.id, utilisateurId)).catch(() => {})
        }

        resolvedUserId = existingUserId
      }
    }

    // 2. S'assurer que l'utilisateur existe (upsert)
    const existingUser = await db.select({ id: utilisateur.id }).from(utilisateur).where(eq(utilisateur.id, resolvedUserId))
    if (existingUser.length === 0) {
      await db.insert(utilisateur).values({
        id: resolvedUserId,
        prenom: prenom || null,
        age: age || null,
        email: typeContact === 'email' ? moyenContact : null,
        telephone: typeContact === 'telephone' ? moyenContact : null,
        situation: departement || null,
        source: departement || null,
        creeLe: now,
        misAJourLe: now,
      })
    } else {
      // Update user info (sans écraser l'email si conflit UNIQUE)
      const updateData: Record<string, unknown> = { misAJourLe: now }
      if (prenom) updateData.prenom = prenom
      if (age) updateData.age = age
      if (departement) updateData.situation = departement
      if (departement) updateData.source = departement
      if (typeContact === 'telephone' && moyenContact) updateData.telephone = moyenContact
      if (typeContact === 'email' && moyenContact) {
        const existingEmail = await db.select({ id: utilisateur.id }).from(utilisateur)
          .where(and(eq(utilisateur.email, moyenContact), sql`${utilisateur.id} != ${resolvedUserId}`))
        if (existingEmail.length === 0) {
          updateData.email = moyenContact
        }
      }
      await db.update(utilisateur).set(updateData).where(eq(utilisateur.id, resolvedUserId))
    }

    // 1b. S'assurer que la conversation existe
    const existingConv = await db.select({ id: conversation.id }).from(conversation).where(eq(conversation.id, conversationId))
    if (existingConv.length === 0) {
      await db.insert(conversation).values({
        id: conversationId,
        utilisateurId: resolvedUserId,
        titre: 'Conversation ' + (prenom || 'Bénéficiaire'),
        statut: 'active',
        nbMessages: 0,
        phase: 'accroche',
        dureeSecondes: 0,
        creeLe: now,
        misAJourLe: now,
      })
    }

    // 2. Calculate priority
    const priorite = PRIORITY_MAP[fragilityLevel] ?? 'normale'

    // 3. Calculate detection level
    const niveauDetection = DETECTION_LEVEL_MAP[fragilityLevel] ?? 0

    // 4. Get last 20 messages for summary
    const messages = await db
      .select()
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(desc(message.horodatage))
      .limit(20)

    const messagesOrdered = messages.reverse()

    // 5. Generate conversation summary
    let resumeConversation = ''
    if (messagesOrdered.length > 0) {
      const transcript = messagesOrdered
        .map((m) => `${m.role === 'user' ? 'Bénéficiaire' : 'Assistant'}: ${m.contenu}`)
        .join('\n')

      try {
        const summaryModel = await getLLMModel('summary')
        const { text, usage } = await generateText({
          model: summaryModel,
          maxTokens: 200, // Résumé court = pas besoin de plus
          system:
            'Tu es un assistant qui résume des conversations. Produis un résumé en 3 à 5 phrases en français. ' +
            'Le résumé doit capturer la situation du bénéficiaire, ses besoins et son état émotionnel.',
          prompt: `Résume cette conversation entre un jeune bénéficiaire et un chatbot d'orientation :\n\n${transcript}`,
        })
        resumeConversation = text

        // Enregistrer la consommation dans le token guard
        if (usage) {
          recordUsage(
            conversationId,
            'system-referral',
            usage.promptTokens,
            usage.completionTokens,
            'gpt-4o-mini'
          )
        }
      } catch (err) {
        console.error('[referrals] Summary generation failed:', err)
        resumeConversation = `Conversation de ${messagesOrdered.length} messages.`
      }
    }

    // 5b. If structureSlug provided, resolve to structure ID for prioritized matching
    let structureSuggereIdFromSlug: string | null = null
    if (structureSlug && typeof structureSlug === 'string') {
      const slugMatch = await db
        .select({ id: structure.id })
        .from(structure)
        .where(and(eq(structure.slug, structureSlug), eq(structure.actif, 1)))
      if (slugMatch.length > 0) {
        structureSuggereIdFromSlug = slugMatch[0].id
      }
    }

    // 5c. Si campagneId fourni, résoudre la structure de la campagne
    //     (garantit le routage même si structureSlug est absent)
    if (!structureSuggereIdFromSlug && campagneId) {
      const campagneMatch = await db
        .select({ structureId: campagne.structureId })
        .from(campagne)
        .where(eq(campagne.id, campagneId))
      if (campagneMatch.length > 0 && campagneMatch[0].structureId) {
        structureSuggereIdFromSlug = campagneMatch[0].structureId
      }
    }

    // 6. Matching: get active structures
    const activeStructures = await db
      .select()
      .from(structure)
      .where(eq(structure.actif, 1))

    // Count active cases per structure
    const structureDataList: StructureData[] = await Promise.all(
      activeStructures.map(async (s) => {
        const casActifsResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(priseEnCharge)
          .where(
            and(
              eq(priseEnCharge.structureId, s.id),
              sql`${priseEnCharge.statut} NOT IN ('terminee', 'annulee')`
            )
          )

        return {
          id: s.id,
          nom: s.nom,
          departements: safeJsonParse<string[]>(s.departements, []),
          regions: safeJsonParse<string[]>(s.regions, []),
          ageMin: s.ageMin ?? 16,
          ageMax: s.ageMax ?? 25,
          specialites: safeJsonParse<string[]>(s.specialites, []),
          genrePreference: s.genrePreference,
          capaciteMax: s.capaciteMax ?? 50,
          casActifs: casActifsResult[0]?.count ?? 0,
          actif: true,
          statut: (s.statut as 'public' | 'prive_non_lucratif' | 'lucratif') || 'public',
        }
      })
    )

    // Build matching criteria
    const profil = await db
      .select()
      .from(profilRiasec)
      .where(eq(profilRiasec.utilisateurId, resolvedUserId))
      .limit(1)

    const riasecDominant: string[] = profil[0]?.dimensionsDominantes
      ? JSON.parse(profil[0].dimensionsDominantes)
      : []

    const matchingCriteria: MatchingCriteria = {
      age: age ?? null,
      genre: genre ?? null,
      departement: departement ?? null,
      situation: null,
      riasecDominant,
      urgence: priorite === 'critique' ? 'critique' : priorite === 'haute' ? 'haute' : 'normale',
      fragilite: fragilityLevel ?? 'none',
      preferenceStructure: preferenceStructure || null,
    }

    const matchResults = matcherStructures(matchingCriteria, structureDataList)
    const bestMatch = matchResults[0] ?? null

    // 7. Get RIASEC profile (already fetched above)
    const riasecProfile = profil[0] ?? null

    // 7b. Auto-rupture : si le bénéficiaire a déjà un accompagnement actif, le clôturer
    const activeReferrals = await db
      .select({
        referralId: referral.id,
        pecId: priseEnCharge.id,
      })
      .from(referral)
      .innerJoin(priseEnCharge, eq(priseEnCharge.referralId, referral.id))
      .where(
        and(
          eq(referral.utilisateurId, resolvedUserId),
          eq(priseEnCharge.statut, 'prise_en_charge')
        )
      )

    for (const active of activeReferrals) {
      // Clôturer la prise en charge
      await db.update(priseEnCharge).set({
        statut: 'rupture',
        termineeLe: now,
        misAJourLe: now,
      }).where(eq(priseEnCharge.id, active.pecId))

      // Clôturer le referral
      await db.update(referral).set({
        statut: 'rupture',
        misAJourLe: now,
      }).where(eq(referral.id, active.referralId))

      // Envoyer un message système dans l'ancien chat
      await db.insert(messageDirect).values({
        id: uuidv4(),
        priseEnChargeId: active.pecId,
        expediteurType: 'conseiller',
        expediteurId: 'systeme',
        contenu: JSON.stringify({
          type: 'rupture',
          motif: 'Le bénéficiaire a initié une nouvelle demande.',
          comportementInaproprie: false,
          parBeneficiaire: true,
        }),
        conversationType: 'direct',
        lu: 0,
        horodatage: now,
      })

      // Log journal
      await logJournal(active.pecId, 'rupture_beneficiaire', 'systeme', resolvedUserId,
        'Le bénéficiaire a initié une nouvelle demande. L\'accompagnement précédent est clôturé.',
        { details: { nouvelleConversationId: conversationId } }
      )
    }

    // 8. Create referral
    const referralId = uuidv4()
    const referralSource = structureSuggereIdFromSlug ? 'sourcee' : 'generique'
    await db.insert(referral).values({
      id: referralId,
      utilisateurId: resolvedUserId,
      conversationId,
      priorite,
      niveauDetection,
      motif: fragilityLevel === 'high'
        ? 'Détresse détectée — orientation urgente'
        : fragilityLevel === 'medium'
          ? 'Fragilité modérée — accompagnement recommandé'
          : 'Profil stabilisé — mise en relation',
      resumeConversation,
      moyenContact: moyenContact ?? null,
      typeContact: typeContact ?? null,
      statut: 'en_attente',
      source: referralSource,
      campagneId: campagneId || null,
      structureSuggereId: structureSuggereIdFromSlug ?? bestMatch?.structureId ?? null,
      localisation: departement ?? null,
      genre: genre ?? null,
      ageBeneficiaire: age ?? null,
      preferenceStructure: preferenceStructure || null,
      creeLe: now,
      misAJourLe: now,
    })

    // 8b. Notification push aux conseillers de la structure suggérée
    const targetStructureId = structureSuggereIdFromSlug ?? bestMatch?.structureId
    if (targetStructureId) {
      notifyConseillerNewCase(targetStructureId, { prenom: prenom || undefined, priorite }).catch(() => {})
    }

    // 8c. Sync vers Parcoureo si configuré (asynchrone, non bloquant)
    if (isParcoureoConfigured()) {
      const syncProfile = {
        prenom: prenom || 'Anonyme',
        email: (typeContact === 'email' && moyenContact) ? moyenContact : undefined,
        age: age ?? undefined,
        riasec: riasecProfile ? {
          r: riasecProfile.r ?? 0,
          i: riasecProfile.i ?? 0,
          a: riasecProfile.a ?? 0,
          s: riasecProfile.s ?? 0,
          e: riasecProfile.e ?? 0,
          c: riasecProfile.c ?? 0,
        } : undefined,
        interets: riasecProfile?.interets ? JSON.parse(riasecProfile.interets) : undefined,
        traits: riasecProfile?.traits ? JSON.parse(riasecProfile.traits) : undefined,
      }
      syncBeneficiaireToParcoureo(syncProfile).catch(() => {})
    }

    // 9. Load tarifs for private structures in results
    const matchResultsWithTarifs = await Promise.all(
      matchResults.slice(0, 3).map(async (m) => {
        let tarifs: TarifInfo[] = []
        if (m.statut === 'lucratif') {
          const tarifRows = await db.select({
            id: tarification.id,
            libelle: tarification.libelle,
            montantCentimes: tarification.montantCentimes,
          }).from(tarification)
            .where(and(eq(tarification.structureId, m.structureId), eq(tarification.actif, 1)))
          tarifs = tarifRows
        }
        return {
          structureId: m.structureId,
          nom: m.structureNom,
          score: m.score,
          raisons: m.raisons || [],
          statut: m.statut,
          tarifs,
        }
      })
    )

    return NextResponse.json({
      referralId,
      priorite,
      structureSuggeree: bestMatch
        ? { nom: bestMatch.structureNom, score: bestMatch.score, statut: bestMatch.statut }
        : null,
      structuresSuggerees: matchResultsWithTarifs,
    })
  } catch (error) {
    console.error('[referrals] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
