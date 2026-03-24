// POST /api/conseiller/auth/logout
// Révoque la session et supprime le cookie

import { getCurrentConseiller, revokeSession, clearAuthCookie, logAudit } from '@/lib/auth'

export async function POST() {
  try {
    const user = await getCurrentConseiller()

    if (user) {
      await revokeSession(user.jti)
      await logAudit(user.sub, 'logout')
    }

    await clearAuthCookie()

    return Response.json({ success: true })
  } catch (error) {
    console.error('[Auth Logout]', error)
    await clearAuthCookie()
    return Response.json({ success: true })
  }
}
