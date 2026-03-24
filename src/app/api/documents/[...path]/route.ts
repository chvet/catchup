// GET /api/documents/[...path]
// Sert les fichiers uploadés depuis /app/data/uploads/
// Pas d'auth requise : les URLs contiennent des UUID non devinables

import { readFile, stat } from 'fs/promises'
import { join, extname } from 'path'
import { UPLOADS_BASE_DIR } from '@/lib/documents'

// Map extension -> Content-Type pour les types courants
const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return new Response('Chemin invalide', { status: 400 })
    }

    // Protection contre le path traversal
    const fullPath = pathSegments.join('/')
    if (fullPath.includes('..') || fullPath.includes('~') || fullPath.startsWith('/')) {
      return new Response('Chemin interdit', { status: 403 })
    }

    // Vérifier que chaque segment ne contient pas de caractères dangereux
    for (const segment of pathSegments) {
      if (segment.includes('..') || segment.includes('/') || segment.includes('\\')) {
        return new Response('Chemin interdit', { status: 403 })
      }
    }

    const filePath = join(UPLOADS_BASE_DIR, ...pathSegments)

    // Vérifier que le fichier existe
    try {
      const fileStat = await stat(filePath)
      if (!fileStat.isFile()) {
        return new Response('Fichier non trouvé', { status: 404 })
      }
    } catch {
      return new Response('Fichier non trouvé', { status: 404 })
    }

    // Lire le fichier
    const fileBuffer = await readFile(filePath)

    // Déterminer le Content-Type
    const ext = extname(filePath).toLowerCase()
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'

    // Déterminer Content-Disposition (inline pour les images/PDF, attachment pour le reste)
    const inlineTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    const disposition = inlineTypes.includes(contentType) ? 'inline' : 'attachment'

    // Extraire le nom du fichier (dernier segment)
    const filename = pathSegments[pathSegments.length - 1]

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, max-age=86400', // Cache 24h côté client
      },
    })
  } catch (error) {
    console.error('[Documents Serve]', error)
    return new Response('Erreur serveur', { status: 500 })
  }
}
