// In-memory heartbeat store (MVP — no DB needed)
// Map<userId, { type: string, lastSeen: number, typingAt?: number }>

const heartbeats = new Map<string, { type: string; lastSeen: number; typingAt?: number }>()

export function setHeartbeat(userId: string, type: string, typing?: boolean) {
  const existing = heartbeats.get(userId)
  heartbeats.set(userId, {
    type,
    lastSeen: Date.now(),
    typingAt: typing ? Date.now() : existing?.typingAt,
  })
}

export function getHeartbeat(userId: string): { type: string; lastSeen: number; typingAt?: number } | undefined {
  return heartbeats.get(userId)
}

/** Returns true if user sent a typing signal within the last 4 seconds */
export function isTyping(userId: string): boolean {
  const hb = heartbeats.get(userId)
  if (!hb?.typingAt) return false
  return Date.now() - hb.typingAt < 4000
}

export function getHeartbeats() {
  return heartbeats
}
