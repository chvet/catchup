// GET /api/conseiller/structures/[structureId]/logo/serve — Servir le logo de la structure
// Accessible sans auth (affiché dans la sidebar, pages publiques)

import { NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOADS_DIR = '/app/data/uploads/structures'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

type Params = { params: Promise<{ structureId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { structureId } = await params
    const structureDir = join(UPLOADS_DIR, structureId)

    if (!existsSync(structureDir)) {
      return new NextResponse(null, { status: 404 })
    }

    // Find the logo file
    const files = await readdir(structureDir)
    const logoFile = files.find(f => f.startsWith('logo.'))

    if (!logoFile) {
      return new NextResponse(null, { status: 404 })
    }

    const filepath = join(structureDir, logoFile)
    const data = await readFile(filepath)
    const ext = '.' + logoFile.split('.').pop()
    const mimeType = MIME_TYPES[ext] || 'image/png'

    return new NextResponse(data, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
