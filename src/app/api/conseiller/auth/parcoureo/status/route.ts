// GET /api/conseiller/auth/parcoureo/status
// Retourne si l'intégration Parcoureo est configurée (pour affichage conditionnel du bouton SSO)

import { isParcoureoConfigured, getParcoureoBaseUrl } from '@/lib/parcoureo'

export async function GET() {
  const configured = isParcoureoConfigured()

  return Response.json({
    configured,
    provider: configured ? 'parcoureo' : null,
    baseUrl: configured ? getParcoureoBaseUrl() : null,
  })
}
