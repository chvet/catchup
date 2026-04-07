// GET /api/v1/docs — Documentation OpenAPI de l'API Catch'Up
import { corsHeaders } from '@/lib/api-core'

const openApiSpec = {
  openapi: '3.1.0',
  info: { title: "Catch'Up API", version: '1.0.0', description: "API d'orientation professionnelle Catch'Up" },
  servers: [
    { url: 'https://catchup.jaeprive.fr/api/v1', description: 'Production' },
    { url: 'http://localhost:3000/api/v1', description: 'Dev' },
  ],
  security: [{ apiKey: [] }, { bearerAuth: [] }],
  components: {
    securitySchemes: {
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/chat': { post: { tags: ['Chat IA'], summary: 'Envoyer un message au chatbot IA (streaming SSE)' } },
    '/referrals': { get: { tags: ['Referrals'], summary: 'Lister les referrals' }, post: { tags: ['Referrals'], summary: 'Creer un referral' } },
    '/conseiller/auth/login': { post: { tags: ['Auth'], summary: 'Connexion conseiller' } },
    '/conseiller/auth/me': { get: { tags: ['Auth'], summary: 'Profil du conseiller connecte' } },
    '/conseiller/file-active': { get: { tags: ['Accompagnement'], summary: 'Lister les prises en charge' } },
    '/conseiller/file-active/{id}/direct-messages': { get: { tags: ['Messagerie'], summary: 'Messages directs' } },
    '/conseiller/file-active/{id}/rdv': { get: { tags: ['RDV'], summary: 'Lister les rendez-vous' } },
    '/conseiller/admin/stats': { get: { tags: ['Admin'], summary: 'Statistiques globales' } },
    '/v1/keys': { get: { tags: ['Cles API'], summary: 'Lister les cles API' }, post: { tags: ['Cles API'], summary: 'Creer une cle API' } },
    '/heartbeat': { get: { tags: ['Sante'], summary: 'Health check' } },
  },
}

export async function GET(req: Request) {
  return new Response(JSON.stringify(openApiSpec, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req.headers.get('origin')) },
  })
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}
