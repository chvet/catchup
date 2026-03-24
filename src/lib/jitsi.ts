// Helper — Génération de liens Jitsi Meet pour la visio
// (pas de compte requis, le salon est créé automatiquement à l'ouverture de l'URL)

const JITSI_BASE_URL = process.env.JITSI_BASE_URL || 'https://meet.jit.si'

/**
 * Génère une URL de salon Jitsi unique liée à une prise en charge
 */
export function generateJitsiRoomUrl(priseEnChargeId: string): string {
  const suffix = Math.random().toString(36).substring(2, 8)
  const roomName = `catchup-${priseEnChargeId.substring(0, 8)}-${suffix}`
  return `${JITSI_BASE_URL}/${roomName}`
}
