// POST /api/beneficiaire/auth
// Signup & Login for beneficiaire users
// action: 'signup' | 'login' | 'restore'

import { db } from '@/data/db'
import { utilisateur, conversation, message, referral, profilRiasec } from '@/data/schema'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'signup') {
      return handleSignup(body)
    } else if (action === 'login') {
      return handleLogin(body)
    } else if (action === 'restore') {
      return handleRestore(body)
    }

    return Response.json({ error: 'Action invalide' }, { status: 400 })
  } catch (e) {
    console.error('[beneficiaire/auth]', e)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function handleSignup(body: {
  prenom: string
  email: string
  password: string
  utilisateurId?: string
  conversationId?: string
}) {
  const { prenom, email, password, utilisateurId, conversationId } = body

  if (!prenom || !email || !password) {
    return Response.json({ error: 'Tous les champs sont requis' }, { status: 400 })
  }

  const emailLower = email.toLowerCase().trim()

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return Response.json({ error: 'Email invalide' }, { status: 400 })
  }

  if (password.length < 6) {
    return Response.json({ error: 'Le mot de passe doit faire au moins 6 caracteres' }, { status: 400 })
  }

  // Check if email already exists with a password set (already signed up)
  const existing = await db
    .select()
    .from(utilisateur)
    .where(eq(utilisateur.email, emailLower))
    .limit(1)

  if (existing.length > 0 && existing[0].motDePasse) {
    return Response.json({ error: 'Un compte existe deja avec cet email. Connecte-toi !' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const sessionToken = uuidv4()
  const now = new Date().toISOString()

  if (existing.length > 0) {
    // User exists (from conversation) but hasn't signed up yet - update with credentials
    await db.update(utilisateur)
      .set({
        prenom,
        email: emailLower,
        motDePasse: hashedPassword,
        sessionToken,
        misAJourLe: now,
      })
      .where(eq(utilisateur.id, existing[0].id))

    return Response.json({
      ok: true,
      token: sessionToken,
      utilisateurId: existing[0].id,
      prenom,
      email: emailLower,
    })
  }

  // Check if we have an existing utilisateur from the current session
  // Sécurité : vérifier que le utilisateurId correspond bien à un user sans mot de passe
  // ET qu'il a une conversation (preuve qu'il s'agit du vrai utilisateur de cette session)
  if (utilisateurId) {
    const sessionUser = await db
      .select()
      .from(utilisateur)
      .where(eq(utilisateur.id, utilisateurId))
      .limit(1)

    if (sessionUser.length > 0 && !sessionUser[0].motDePasse) {
      // Vérifier qu'une conversation existe pour cet utilisateur (preuve de session légitime)
      const hasConversation = conversationId
        ? await db.select({ id: conversation.id }).from(conversation)
            .where(and(eq(conversation.id, conversationId), eq(conversation.utilisateurId, utilisateurId)))
            .limit(1)
        : []

      if (!conversationId || hasConversation.length > 0) {
        await db.update(utilisateur)
          .set({
            prenom,
            email: emailLower,
            motDePasse: hashedPassword,
            sessionToken,
            misAJourLe: now,
          })
          .where(eq(utilisateur.id, utilisateurId))

        return Response.json({
          ok: true,
          token: sessionToken,
          utilisateurId,
          prenom,
          email: emailLower,
        })
      }
    }
  }

  // Create new user
  const newId = uuidv4()
  await db.insert(utilisateur).values({
    id: newId,
    prenom,
    email: emailLower,
    motDePasse: hashedPassword,
    sessionToken,
    creeLe: now,
    misAJourLe: now,
  })

  // If we have a conversationId, link it to this new user
  if (conversationId) {
    await db.update(conversation)
      .set({ utilisateurId: newId })
      .where(eq(conversation.id, conversationId))
  }

  return Response.json({
    ok: true,
    token: sessionToken,
    utilisateurId: newId,
    prenom,
    email: emailLower,
  })
}

async function handleLogin(body: { email: string; password: string }) {
  const { email, password } = body

  if (!email || !password) {
    return Response.json({ error: 'Email et mot de passe requis' }, { status: 400 })
  }

  const emailLower = email.toLowerCase().trim()

  const users = await db
    .select()
    .from(utilisateur)
    .where(eq(utilisateur.email, emailLower))
    .limit(1)

  if (users.length === 0 || !users[0].motDePasse) {
    return Response.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
  }

  const user = users[0]
  const valid = await bcrypt.compare(password, user.motDePasse!)

  if (!valid) {
    return Response.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
  }

  // Generate new session token
  const sessionToken = uuidv4()
  const now = new Date().toISOString()

  await db.update(utilisateur)
    .set({ sessionToken, derniereVisite: now, misAJourLe: now })
    .where(eq(utilisateur.id, user.id))

  // Fetch user's latest conversation + messages
  const conversations = await db
    .select()
    .from(conversation)
    .where(eq(conversation.utilisateurId, user.id))
    .orderBy(desc(conversation.misAJourLe))
    .limit(1)

  let restoredMessages: { role: string; content: string; id: string }[] = []
  let latestConversationId = ''

  if (conversations.length > 0) {
    latestConversationId = conversations[0].id
    const msgs = await db
      .select()
      .from(message)
      .where(eq(message.conversationId, latestConversationId))
      .orderBy(message.horodatage)

    restoredMessages = msgs.map(m => ({
      id: m.id,
      role: m.role,
      content: m.contenu,
    }))
  }

  // Fetch referral status
  const referrals = await db
    .select()
    .from(referral)
    .where(eq(referral.utilisateurId, user.id))
    .orderBy(desc(referral.creeLe))
    .limit(1)

  // Fetch RIASEC profile
  const profiles = await db
    .select()
    .from(profilRiasec)
    .where(eq(profilRiasec.utilisateurId, user.id))
    .limit(1)

  return Response.json({
    ok: true,
    token: sessionToken,
    utilisateurId: user.id,
    prenom: user.prenom || '',
    email: user.email || '',
    conversationId: latestConversationId,
    messages: restoredMessages,
    referral: referrals.length > 0 ? {
      id: referrals[0].id,
      statut: referrals[0].statut,
    } : null,
    profile: profiles.length > 0 ? {
      R: profiles[0].r,
      I: profiles[0].i,
      A: profiles[0].a,
      S: profiles[0].s,
      E: profiles[0].e,
      C: profiles[0].c,
    } : null,
  })
}

async function handleRestore(body: { token: string }) {
  const { token } = body

  if (!token) {
    return Response.json({ error: 'Token requis' }, { status: 400 })
  }

  const users = await db
    .select()
    .from(utilisateur)
    .where(eq(utilisateur.sessionToken, token))
    .limit(1)

  if (users.length === 0) {
    return Response.json({ error: 'Session expir\u00e9e' }, { status: 401 })
  }

  const user = users[0]
  const now = new Date().toISOString()

  await db.update(utilisateur)
    .set({ derniereVisite: now })
    .where(eq(utilisateur.id, user.id))

  // Same restore logic as login
  const conversations = await db
    .select()
    .from(conversation)
    .where(eq(conversation.utilisateurId, user.id))
    .orderBy(desc(conversation.misAJourLe))
    .limit(1)

  let restoredMessages: { role: string; content: string; id: string }[] = []
  let latestConversationId = ''

  if (conversations.length > 0) {
    latestConversationId = conversations[0].id
    const msgs = await db
      .select()
      .from(message)
      .where(eq(message.conversationId, latestConversationId))
      .orderBy(message.horodatage)

    restoredMessages = msgs.map(m => ({
      id: m.id,
      role: m.role,
      content: m.contenu,
    }))
  }

  const referrals = await db
    .select()
    .from(referral)
    .where(eq(referral.utilisateurId, user.id))
    .orderBy(desc(referral.creeLe))
    .limit(1)

  const profiles = await db
    .select()
    .from(profilRiasec)
    .where(eq(profilRiasec.utilisateurId, user.id))
    .limit(1)

  return Response.json({
    ok: true,
    utilisateurId: user.id,
    prenom: user.prenom || '',
    email: user.email || '',
    conversationId: latestConversationId,
    messages: restoredMessages,
    referral: referrals.length > 0 ? {
      id: referrals[0].id,
      statut: referrals[0].statut,
    } : null,
    profile: profiles.length > 0 ? {
      R: profiles[0].r,
      I: profiles[0].i,
      A: profiles[0].a,
      S: profiles[0].s,
      E: profiles[0].e,
      C: profiles[0].c,
    } : null,
  })
}
