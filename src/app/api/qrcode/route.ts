// GET /api/qrcode?data=xxx&size=300&format=svg
// QR code avec logo Wesh au centre

import QRCode from 'qrcode'
import { readFile } from 'fs/promises'
import { join } from 'path'

let logoBase64Cache: string | null = null

async function getLogoBase64(): Promise<string> {
  if (logoBase64Cache) return logoBase64Cache

  const paths = [
    join(process.cwd(), 'public', 'favicon.png'),
    join('/app', 'public', 'favicon.png'),
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

  if (!data) {
    return new Response('Missing data param', { status: 400 })
  }

  try {
    const qrSvg = await QRCode.toString(data, {
      type: 'svg',
      width: size,
      margin: 1,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })

    const logoB64 = await getLogoBase64()

    if (logoB64) {
      // Parse the viewBox to get the coordinate system
      const viewBoxMatch = qrSvg.match(/viewBox="0 0 (\d+) (\d+)"/)
      const vbSize = viewBoxMatch ? parseInt(viewBoxMatch[1]) : size

      // Logo takes ~25% of the QR in viewBox coordinates
      const logoSize = Math.round(vbSize * 0.25)
      const logoOffset = Math.round((vbSize - logoSize) / 2)
      const padding = Math.round(logoSize * 0.12)

      const logoInsert = `
        <rect x="${logoOffset - padding}" y="${logoOffset - padding}" width="${logoSize + padding * 2}" height="${logoSize + padding * 2}" rx="${padding}" fill="white"/>
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

      return new Response(finalSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

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
