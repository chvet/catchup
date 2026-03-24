// Helpers pour l'upload et la gestion de documents
// Constantes, validation, et logique partagée entre les routes conseiller/bénéficiaire/tiers

import { mkdir, writeFile } from 'fs/promises'
import { join, extname } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/data/db'
import { messageDirect } from '@/data/schema'
import { eq, asc } from 'drizzle-orm'

// === CONSTANTES ===

export const UPLOADS_BASE_DIR = '/app/data/uploads'

export const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// === TYPES ===

export interface DocumentMetadata {
  type: 'document'
  filename: string
  originalName: string
  size: number
  mimeType: string
  url: string
}

// === VALIDATION ===

/**
 * Vérifie que le type MIME est dans la liste autorisée
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return mimeType in ALLOWED_TYPES
}

/**
 * Vérifie que l'extension du fichier correspond au type MIME déclaré
 */
export function isExtensionValid(originalName: string, mimeType: string): boolean {
  const ext = extname(originalName).toLowerCase()
  const allowedExts = ALLOWED_TYPES[mimeType]
  if (!allowedExts) return false
  return allowedExts.includes(ext)
}

// === UPLOAD ===

/**
 * Traite l'upload d'un fichier depuis un FormData
 * Retourne les métadonnées du document ou une erreur
 */
export async function processFileUpload(
  formData: FormData,
  priseEnChargeId: string
): Promise<{ success: true; document: DocumentMetadata } | { success: false; error: string; status: number }> {
  const file = formData.get('file') as File | null

  if (!file) {
    return { success: false, error: 'Aucun fichier fourni', status: 400 }
  }

  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: `Le fichier dépasse la taille maximale de ${MAX_FILE_SIZE / 1024 / 1024} Mo`, status: 400 }
  }

  if (file.size === 0) {
    return { success: false, error: 'Le fichier est vide', status: 400 }
  }

  // Vérifier le type MIME
  if (!isAllowedMimeType(file.type)) {
    return { success: false, error: `Type de fichier non autorisé : ${file.type}`, status: 400 }
  }

  // Vérifier l'extension
  if (!isExtensionValid(file.name, file.type)) {
    return { success: false, error: `L'extension du fichier ne correspond pas au type MIME déclaré`, status: 400 }
  }

  // Générer un nom unique
  const ext = extname(file.name).toLowerCase()
  const filename = `${uuidv4()}${ext}`

  // Créer le répertoire cible
  const uploadDir = join(UPLOADS_BASE_DIR, priseEnChargeId)
  await mkdir(uploadDir, { recursive: true })

  // Lire le contenu du fichier et l'écrire sur disque
  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = join(uploadDir, filename)
  await writeFile(filePath, buffer)

  // Construire l'URL de téléchargement
  const url = `/api/documents/${priseEnChargeId}/${filename}`

  const document: DocumentMetadata = {
    type: 'document',
    filename,
    originalName: file.name,
    size: file.size,
    mimeType: file.type,
    url,
  }

  return { success: true, document }
}

// === MESSAGE CREATION ===

/**
 * Crée un messageDirect de type document
 */
export async function createDocumentMessage(
  priseEnChargeId: string,
  expediteurType: 'conseiller' | 'beneficiaire' | 'tiers',
  expediteurId: string,
  document: DocumentMetadata,
  conversationType: string = 'direct'
): Promise<string> {
  const messageId = uuidv4()
  const now = new Date().toISOString()

  await db.insert(messageDirect).values({
    id: messageId,
    priseEnChargeId,
    expediteurType,
    expediteurId,
    contenu: JSON.stringify(document),
    conversationType,
    lu: 0,
    horodatage: now,
  })

  return messageId
}

// === QUERY ===

/**
 * Récupère tous les messages de type document pour une prise en charge
 */
export async function getDocumentsForPriseEnCharge(priseEnChargeId: string) {
  const messages = await db
    .select()
    .from(messageDirect)
    .where(eq(messageDirect.priseEnChargeId, priseEnChargeId))
    .orderBy(asc(messageDirect.horodatage))

  // Filtrer les messages de type document
  return messages.filter((m) => {
    try {
      const parsed = JSON.parse(m.contenu)
      return parsed.type === 'document'
    } catch {
      return false
    }
  }).map((m) => ({
    id: m.id,
    expediteurType: m.expediteurType,
    expediteurId: m.expediteurId,
    document: JSON.parse(m.contenu) as DocumentMetadata,
    horodatage: m.horodatage,
    lu: m.lu,
  }))
}
