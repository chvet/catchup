// POST /api/visio/signal — Signaling WebRTC (create session, send signal, accept/decline/hangup)

import { NextResponse } from 'next/server'
import { createSession, getSession, addSignal, updateStatus } from '@/lib/visio-signal'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const { priseEnChargeId, conseillerId } = body
        if (!priseEnChargeId || !conseillerId) {
          return NextResponse.json({ error: 'priseEnChargeId et conseillerId requis' }, { status: 400 })
        }
        const session = createSession(priseEnChargeId, conseillerId)
        return NextResponse.json({ sessionId: session.id })
      }

      case 'signal': {
        const { sessionId, type, data, from } = body
        if (!sessionId || !type || !from) {
          return NextResponse.json({ error: 'sessionId, type et from requis' }, { status: 400 })
        }
        const ok = addSignal(sessionId, { type, data, from, timestamp: Date.now() })
        if (!ok) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
        return NextResponse.json({ ok: true })
      }

      case 'accept': {
        const { sessionId } = body
        if (!sessionId) return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })
        const session = getSession(sessionId)
        if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
        updateStatus(sessionId, 'active')
        addSignal(sessionId, { type: 'accept', data: null, from: 'beneficiaire', timestamp: Date.now() })
        return NextResponse.json({ ok: true })
      }

      case 'decline': {
        const { sessionId, from } = body
        if (!sessionId) return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })
        updateStatus(sessionId, 'declined')
        addSignal(sessionId, { type: 'decline', data: null, from: from || 'beneficiaire', timestamp: Date.now() })
        return NextResponse.json({ ok: true })
      }

      case 'hangup': {
        const { sessionId, from } = body
        if (!sessionId) return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })
        updateStatus(sessionId, 'ended')
        addSignal(sessionId, { type: 'hangup', data: null, from, timestamp: Date.now() })
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
    }
  } catch (err) {
    console.error('[Visio Signal]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
