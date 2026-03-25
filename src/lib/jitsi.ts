// Helper — Daily.co video calling integration
// Creates and manages Daily.co rooms for video calls

const DAILY_API_URL = 'https://api.daily.co/v1'

function getDailyApiKey(): string | null {
  return process.env.DAILY_API_KEY || null
}

interface DailyRoomResponse {
  id: string
  name: string
  url: string
  created_at: string
  config: Record<string, unknown>
}

/**
 * Crée une room Daily.co liée à une prise en charge.
 * Retourne l'URL publique de la room (https://fondationjae.daily.co/roomname).
 * Durée : 24h.
 */
export async function createDailyRoom(priseEnChargeId: string): Promise<string> {
  const apiKey = getDailyApiKey()
  if (!apiKey) {
    // Fallback sans Daily.co : URL Jitsi Meet publique
    const suffix = Math.random().toString(36).substring(2, 8)
    return `https://meet.jit.si/catchup-${priseEnChargeId.substring(0, 8)}-${suffix}`
  }

  const suffix = Math.random().toString(36).substring(2, 8)
  const roomName = `catchup-${priseEnChargeId.substring(0, 8)}-${suffix}`

  const res = await fetch(`${DAILY_API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'public',
      properties: {
        exp: Math.floor(Date.now() / 1000) + 24 * 3600, // 24 heures
        enable_chat: true,
        lang: 'fr',
        enable_prejoin_ui: true,
        enable_knocking: false,
        max_participants: 4,
        enable_screenshare: true,
        enable_recording: false,
      },
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('[Daily.co] Room creation failed:', res.status, errorBody)
    // Fallback Jitsi Meet public
    return `https://meet.jit.si/catchup-${priseEnChargeId.substring(0, 8)}-${suffix}`
  }

  const room: DailyRoomResponse = await res.json()
  return room.url
}

/** @deprecated Use createDailyRoom instead */
export const generateJitsiRoomUrl = createDailyRoom
