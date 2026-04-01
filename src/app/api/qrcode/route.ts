// GET /api/qrcode?data=xxx&size=300
// QR code SVG avec logo Catch'Up au centre

import QRCode from 'qrcode'
import { LOGO_BASE64 } from './logo-b64'

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

    // Parse viewBox to get coordinate system
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
        href="${LOGO_BASE64}"
        preserveAspectRatio="xMidYMid meet"
      />
    `

    const finalSvg = qrSvg.replace('</svg>', `${logoInsert}</svg>`)

    return new Response(finalSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('[QRCode]', err)
    return new Response('QR generation error', { status: 500 })
  }
}
