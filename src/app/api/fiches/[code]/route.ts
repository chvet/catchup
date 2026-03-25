import { NextRequest, NextResponse } from 'next/server'

const JAE_API_BASE = 'https://agents.jaeprive.fr'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    if (!code) {
      return NextResponse.json(
        { error: 'Le code ROME est requis' },
        { status: 400 }
      )
    }

    const url = `${JAE_API_BASE}/api/fiches/${encodeURIComponent(code)}`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }, // Cache 24h
    })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: 'Fiche métier non trouvée' },
          { status: 404 }
        )
      }
      console.error(`[fiches/${code}] JAE API error: ${res.status}`)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de la fiche métier' },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    })
  } catch (error) {
    console.error('[fiches] Error:', error)
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
