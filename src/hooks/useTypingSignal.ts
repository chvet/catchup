'use client'

import { useCallback, useRef } from 'react'

/**
 * Sends a typing signal via heartbeat.
 * Throttled to max once every 2 seconds to avoid flooding.
 */
export function useTypingSignal(type: 'conseiller' | 'beneficiaire', userId: string | null | undefined) {
  const lastSentRef = useRef(0)

  const sendTyping = useCallback(() => {
    if (!userId) return
    const now = Date.now()
    if (now - lastSentRef.current < 2000) return
    lastSentRef.current = now

    fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, userId, typing: true }),
    }).catch(() => {})
  }, [type, userId])

  return sendTyping
}
