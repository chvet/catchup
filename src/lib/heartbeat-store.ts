// In-memory heartbeat store (MVP — no DB needed)
// Map<userId, { type: string, lastSeen: number }>

const heartbeats = new Map<string, { type: string; lastSeen: number }>()

export function setHeartbeat(userId: string, type: string) {
  heartbeats.set(userId, { type, lastSeen: Date.now() })
}

export function getHeartbeat(userId: string): { type: string; lastSeen: number } | undefined {
  return heartbeats.get(userId)
}

export function getHeartbeats() {
  return heartbeats
}
