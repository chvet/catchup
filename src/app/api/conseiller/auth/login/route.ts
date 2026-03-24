// POST /api/conseiller/auth/login
// Authentification email/mot de passe → JWT cookie

import { login, logAudit } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return Response.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const result = await login(email, password)

    if (!result.success) {
      return Response.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Log de connexion
    await logAudit(null, 'login', 'conseiller', undefined, { email })

    return Response.json({ success: true })
  } catch (error) {
    console.error('[Auth Login]', error)
    return Response.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
