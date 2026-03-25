import { NextRequest, NextResponse } from 'next/server'

const JAE_API_BASE = 'https://agents.jaeprive.fr'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    if (!search || search.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le paramètre "search" est requis' },
        { status: 400 }
      )
    }

    const url = `${JAE_API_BASE}/api/fiches?search=${encodeURIComponent(search.trim())}&limit=5`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }, // Cache 1h
    })

    if (!res.ok) {
      console.error(`[fiches] JAE API error: ${res.status}`)
      return NextResponse.json(
        { error: 'Erreur lors de la recherche de fiches métiers' },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (error) {
    console.error('[fiches] Error:', error)
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
