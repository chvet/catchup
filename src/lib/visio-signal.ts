// Signaling store en mémoire pour WebRTC visio
// Les sessions sont éphémères (max 10 min) — signaling uniquement

import { v4 as uuidv4 } from 'uuid'

export interface VisioSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'accept' | 'decline' | 'hangup'
  data: unknown
  from: 'conseiller' | 'beneficiaire'
  timestamp: number
}

export interface VisioSession {
  id: string
  priseEnChargeId: string
  conseillerId: string
  status: 'ringing' | 'active' | 'ended' | 'declined'
  signals: VisioSignal[]
  listeners: Set<(signal: VisioSignal) => void>
  createdAt: number
}

const sessions = new Map<string, VisioSession>()

// Nettoyage auto des sessions > 10 min
setInterval(() => {
  const now = Date.now()
  sessions.forEach((session, id) => {
    if (now - session.createdAt > 10 * 60 * 1000) {
      session.listeners.clear()
      sessions.delete(id)
    }
  })
}, 60_000)

export function createSession(priseEnChargeId: string, conseillerId: string): VisioSession {
  const session: VisioSession = {
    id: uuidv4(),
    priseEnChargeId,
    conseillerId,
    status: 'ringing',
    signals: [],
    listeners: new Set(),
    createdAt: Date.now(),
  }
  sessions.set(session.id, session)
  return session
}

export function getSession(sessionId: string): VisioSession | undefined {
  return sessions.get(sessionId)
}

export function addSignal(sessionId: string, signal: VisioSignal): boolean {
  const session = sessions.get(sessionId)
  if (!session) return false
  session.signals.push(signal)
  session.listeners.forEach(listener => {
    try { listener(signal) } catch { /* listener dead */ }
  })
  return true
}

export function subscribe(sessionId: string, listener: (signal: VisioSignal) => void): () => void {
  const session = sessions.get(sessionId)
  if (!session) return () => {}
  session.listeners.add(listener)
  return () => { session.listeners.delete(listener) }
}

export function updateStatus(sessionId: string, status: VisioSession['status']): boolean {
  const session = sessions.get(sessionId)
  if (!session) return false
  session.status = status
  return true
}
