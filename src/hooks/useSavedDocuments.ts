'use client'

import { useState, useCallback } from 'react'

export interface SavedDocument {
  id: string
  type: 'fiche_metier'
  codeRome: string
  nom: string
  savedAt: string
  pdfUrl: string
}

const LS_KEY = 'catchup_saved_documents'

function loadDocs(): SavedDocument[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistDocs(docs: SavedDocument[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(docs))
  } catch { /* quota exceeded */ }
}

export function useSavedDocuments() {
  const [documents, setDocuments] = useState<SavedDocument[]>(loadDocs)

  const saveDocument = useCallback((doc: Omit<SavedDocument, 'id' | 'savedAt'>) => {
    setDocuments(prev => {
      // Don't save duplicates
      if (prev.some(d => d.type === doc.type && d.codeRome === doc.codeRome)) return prev
      const newDoc: SavedDocument = {
        ...doc,
        id: crypto.randomUUID?.() || Date.now().toString(36),
        savedAt: new Date().toISOString(),
      }
      const next = [newDoc, ...prev]
      persistDocs(next)
      return next
    })
  }, [])

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => {
      const next = prev.filter(d => d.id !== id)
      persistDocs(next)
      return next
    })
  }, [])

  const isDocumentSaved = useCallback((codeRome: string) => {
    return documents.some(d => d.type === 'fiche_metier' && d.codeRome === codeRome)
  }, [documents])

  return { documents, saveDocument, removeDocument, isDocumentSaved }
}
