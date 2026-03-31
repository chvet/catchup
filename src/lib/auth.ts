// Utilitaires d'authentification conseiller
// JWT (jose) + bcrypt (bcryptjs) + cookies

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@/data/db'
import { sessionConseiller, conseiller, evenementAudit } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// === TYPES ===

export interface ConseillerJWT extends JWTPayload {
  sub: string          // conseiller.id
  email: string
  role: 'conseiller' | 'admin_structure' | 'super_admin'
  structureId: string | null
  jti: string          // session ID pour révocation
}

// === CONSTANTES ===

if (!process.env.JWT_SECRET) {
  console.error('[SECURITY] JWT_SECRET is not set. Authentication will fail.')
}
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ''
)
const JWT_DURATION = '8h'
const COOKIE_NAME = 'catchup_conseiller_session'
const BCRYPT_ROUNDS = 12

// === MOT DE PASSE ===

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// === JWT ===

export async function createJWT(payload: Omit<ConseillerJWT, 'iat' | 'exp' | 'jti'>): Promise<{ token: string; sessionId: string }> {
  const sessionId = uuidv4()

  const token = await new SignJWT({ ...payload, jti: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_DURATION)
    .sign(JWT_SECRET)

  // Persister la session en base (pour révocation)
  const now = new Date().toISOString()
  const expireDate = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()

  await db.insert(sessionConseiller).values({
    id: sessionId,
    conseillerId: payload.sub as string,
    jeton: sessionId,
    expireLe: expireDate,
    creeLe: now,
  })

  return { token, sessionId }
}

export async function verifyJWT(token: string): Promise<ConseillerJWT | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const data = payload as ConseillerJWT

    // Vérifier que la session n'est pas révoquée
    const sessions = await db
      .select()
      .from(sessionConseiller)
      .where(
        and(
          eq(sessionConseiller.jeton, data.jti),
          eq(sessionConseiller.revoque, 0)
        )
      )

    if (sessions.length === 0) return null

    return data
  } catch {
    return null
  }
}

// === COOKIES ===

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 heures
    path: '/',
  })
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// === SESSION ===

export async function getCurrentConseiller(): Promise<ConseillerJWT | null> {
  const token = await getAuthCookie()
  if (!token) return null
  return verifyJWT(token)
}

export async function revokeSession(sessionId: string): Promise<void> {
  await db
    .update(sessionConseiller)
    .set({ revoque: 1 })
    .where(eq(sessionConseiller.jeton, sessionId))
}

// === LOGIN ===

export async function login(email: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  // Chercher le conseiller
  const conseillers = await db
    .select()
    .from(conseiller)
    .where(eq(conseiller.email, email.toLowerCase().trim()))

  if (conseillers.length === 0) {
    return { success: false, error: 'Email ou mot de passe incorrect' }
  }

  const c = conseillers[0]

  if (!c.actif) {
    return { success: false, error: 'Compte désactivé' }
  }

  if (!c.motDePasse) {
    return { success: false, error: 'Compte SSO uniquement' }
  }

  const valid = await verifyPassword(password, c.motDePasse)
  if (!valid) {
    return { success: false, error: 'Email ou mot de passe incorrect' }
  }

  // Créer le JWT
  const { token } = await createJWT({
    sub: c.id,
    email: c.email,
    role: c.role as ConseillerJWT['role'],
    structureId: c.structureId,
  })

  // Mettre à jour la dernière connexion
  await db
    .update(conseiller)
    .set({ derniereConnexion: new Date().toISOString() })
    .where(eq(conseiller.id, c.id))

  // Cookie
  await setAuthCookie(token)

  return { success: true, token }
}

// === AUDIT ===

export async function logAudit(
  conseillerId: string | null,
  action: string,
  cibleType?: string,
  cibleId?: string,
  details?: Record<string, unknown>,
  ip?: string
): Promise<void> {
  await db.insert(evenementAudit).values({
    id: uuidv4(),
    conseillerId,
    action,
    cibleType: cibleType ?? null,
    cibleId: cibleId ?? null,
    details: details ? JSON.stringify(details) : null,
    ip: ip ?? null,
    horodatage: new Date().toISOString(),
  })
}
