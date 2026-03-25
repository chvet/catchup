// GET /api/qrcode?data=xxx&size=200
// Proxy QR code — évite les problèmes CSP avec les APIs externes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = searchParams.get('data')
  const size = searchParams.get('size') || '200'

  if (!data) {
    return new Response('Missing data param', { status: 400 })
  }

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=png&data=${encodeURIComponent(data)}`
    const res = await fetch(qrUrl)

    if (!res.ok) {
      return new Response('QR generation failed', { status: 502 })
    }

    const imageBuffer = await res.arrayBuffer()

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // cache 24h
      },
    })
  } catch {
    return new Response('QR generation error', { status: 500 })
  }
}
