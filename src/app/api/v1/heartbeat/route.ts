// GET /api/v1/heartbeat — Health check de l'API
import { corsHeaders } from '@/lib/api-core'

export async function GET(req: Request) {
  const origin = req.headers.get('origin')
  return new Response(
    JSON.stringify({
      ok: true,
      service: 'catchup-api',
      version: 'v1',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    },
  )
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}
