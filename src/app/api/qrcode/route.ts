// GET /api/qrcode?data=xxx&size=200&format=svg|png
// QR code avec logo Wesh au centre

import QRCode from 'qrcode'

const LOGO_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F97316"/>
      <stop offset="50%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="white" stroke="white" stroke-width="4"/>
  <path d="
    M 20 30
    Q 22 28, 24 30
    L 38 70
    Q 39 74, 41 70
    L 48 42
    Q 50 36, 52 42
    L 59 70
    Q 61 74, 63 70
    L 78 30
    Q 80 26, 82 30
    Q 83 33, 81 36
    L 65 78
    Q 63 82, 60 78
    L 52 50
    Q 50 44, 48 50
    L 40 78
    Q 37 82, 35 78
    L 17 36
    Q 15 32, 17 29
    Z
  " fill="url(#wg)"/>
  <path d="M 28 80 Q 55 88, 78 76" stroke="url(#wg)" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>
`.trim()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = searchParams.get('data')
  const size = parseInt(searchParams.get('size') || '300', 10)
  const format = searchParams.get('format') || 'svg'

  if (!data) {
    return new Response('Missing data param', { status: 400 })
  }

  try {
    if (format === 'png') {
      // PNG via external API (no logo overlay in PNG mode for simplicity)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=png&data=${encodeURIComponent(data)}`
      const res = await fetch(qrUrl)
      if (!res.ok) return new Response('QR generation failed', { status: 502 })
      return new Response(await res.arrayBuffer(), {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
      })
    }

    // SVG mode with embedded logo
    const qrSvg = await QRCode.toString(data, {
      type: 'svg',
      width: size,
      margin: 1,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H', // High error correction to survive logo overlay
    })

    // Insert logo in the center of the QR SVG
    const logoSize = Math.round(size * 0.22)
    const logoOffset = Math.round((size - logoSize) / 2)

    // Add a white circle background + logo in the center
    const logoInsert = `
      <g transform="translate(${logoOffset}, ${logoOffset})">
        <svg width="${logoSize}" height="${logoSize}" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="white"/>
          <defs>
            <linearGradient id="wgl" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F97316"/>
              <stop offset="50%" stop-color="#EF4444"/>
              <stop offset="100%" stop-color="#EC4899"/>
            </linearGradient>
          </defs>
          <path d="M 20 30 Q 22 28, 24 30 L 38 70 Q 39 74, 41 70 L 48 42 Q 50 36, 52 42 L 59 70 Q 61 74, 63 70 L 78 30 Q 80 26, 82 30 Q 83 33, 81 36 L 65 78 Q 63 82, 60 78 L 52 50 Q 50 44, 48 50 L 40 78 Q 37 82, 35 78 L 17 36 Q 15 32, 17 29 Z" fill="url(#wgl)"/>
          <path d="M 28 80 Q 55 88, 78 76" stroke="url(#wgl)" stroke-width="3" stroke-linecap="round" fill="none"/>
        </svg>
      </g>
    `

    // Insert before closing </svg>
    const finalSvg = qrSvg.replace('</svg>', `${logoInsert}</svg>`)

    return new Response(finalSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    console.error('[QRCode]', err)
    return new Response('QR generation error', { status: 500 })
  }
}
