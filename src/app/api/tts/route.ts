// GET /api/tts?text=Bonjour — Proxy TTS via Google Translate
// Contourne les restrictions CORS sur mobile

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get('text')

  if (!text || text.length > 200) {
    return new Response('Text required (max 200 chars)', { status: 400 })
  }

  try {
    const encoded = encodeURIComponent(text)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encoded}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      },
    })

    if (!res.ok) {
      return new Response('TTS unavailable', { status: 502 })
    }

    const audioBuffer = await res.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new Response('TTS error', { status: 500 })
  }
}
