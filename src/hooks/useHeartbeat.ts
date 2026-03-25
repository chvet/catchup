'use client'

import { useEffect, useRef } from 'react'

/**
 * Sends a heartbeat every 30 seconds while the tab is visible.
 * Pauses when the tab is hidden.
 */
export function useHeartbeat(type: 'conseiller' | 'beneficiaire', userId: string | null | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!userId) return

    const sendHeartbeat = () => {
      if (document.visibilityState === 'hidden') return
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, userId }),
      }).catch(() => {})
    }

    // Send immediately
    sendHeartbeat()

    // Send every 30 seconds
    intervalRef.current = setInterval(sendHeartbeat, 30_000)

    // Pause/resume on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [type, userId])
}
