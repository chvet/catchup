'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface OnlineStatuses {
  [userId: string]: { online: boolean; lastSeen: string | null }
}

/**
 * Polls the heartbeat status API every 15 seconds for a list of user IDs.
 * Returns a map of userId -> { online, lastSeen }.
 */
export function useOnlineStatus(userIds: string[]) {
  const [statuses, setStatuses] = useState<OnlineStatuses>({})
  const userIdsRef = useRef<string[]>([])

  // Stabilize the userIds array to avoid unnecessary re-renders
  const userIdsKey = userIds.filter(Boolean).sort().join(',')

  const fetchStatuses = useCallback(async () => {
    const ids = userIdsRef.current.filter(Boolean)
    if (ids.length === 0) return

    try {
      const res = await fetch(`/api/heartbeat/status?userIds=${ids.join(',')}`)
      if (res.ok) {
        const data = await res.json()
        setStatuses(data.statuses || {})
      }
    } catch {
      // Silently ignore network errors
    }
  }, [])

  useEffect(() => {
    userIdsRef.current = userIds.filter(Boolean)
    if (userIdsRef.current.length === 0) {
      setStatuses({})
      return
    }

    fetchStatuses()
    const interval = setInterval(fetchStatuses, 15_000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdsKey, fetchStatuses])

  return statuses
}

/**
 * Convenience hook for checking a single user's online status.
 */
export function useIsOnline(userId: string | null | undefined): boolean {
  const statuses = useOnlineStatus(userId ? [userId] : [])
  return userId ? statuses[userId]?.online ?? false : false
}
