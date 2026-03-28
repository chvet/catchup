// GET /api/qrcode?data=xxx&size=300&format=svg|png
// QR code avec logo Wesh au centre

import QRCode from 'qrcode'
import { readFile } from 'fs/promises'
import { join } from 'path'

let logoBase64Cache: string | null = null

async function getLogoBase64(): Promise<string> {
  if (logoBase64Cache) return logoBase64Cache

  // Try multiple paths (dev vs prod)
  const paths = [
    join(process.cwd(), 'public', 'logo-wesh.png'),
    join('/app', 'public', 'logo-wesh.png'),
  ]

  for (const p of paths) {
    try {
      const buf = await readFile(p)
      logoBase64Cache = buf.toString('base64')
      return logoBase64Cache
    } catch { /* try next */ }
  }

  return ''
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = searchParams.get('data')
  const size = parseInt(searchParams.get('size') || '300', 10)
  const format = searchParams.get('format') || 'svg'

  if (!data) {
    return new Response('Missing data param', { status: 400 })
  }

  try {
    // Generate QR SVG with high error correction (logo covers ~15% center)
    const qrSvg = await QRCode.toString(data, {
      type: 'svg',
      width: size,
      margin: 1,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })

    const logoB64 = await getLogoBase64()

    if (logoB64) {
      // Embed logo PNG in center of QR SVG
      const logoSize = Math.round(size * 0.28)
      const logoOffset = Math.round((size - logoSize) / 2)
      const padding = Math.round(logoSize * 0.08)

      const logoInsert = `
        <circle cx="${logoOffset + logoSize / 2}" cy="${logoOffset + logoSize / 2}" r="${logoSize / 2 + padding}" fill="white"/>
        <image
          x="${logoOffset}"
          y="${logoOffset}"
          width="${logoSize}"
          height="${logoSize}"
          href="data:image/png;base64,${logoB64}"
          preserveAspectRatio="xMidYMid meet"
        />
      `

      const finalSvg = qrSvg.replace('</svg>', `${logoInsert}</svg>`)

      if (format === 'png') {
        // Return SVG as-is for now (browser renders it fine as image)
        return new Response(finalSvg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400',
          },
        })
      }

      return new Response(finalSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    // No logo available — return plain QR
    return new Response(qrSvg, {
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
