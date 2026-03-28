// Helper — Visio custom WebSocket (WebCodecs VP8)
// Génère les URLs pour la visio intégrée à l'app

/**
 * Génère l'URL WebSocket du serveur visio
 */
function getVisioWsUrl(): string {
  return process.env.VISIO_WS_URL || 'wss://visio.wesh.chat'
}

/**
 * Génère l'URL de la page visio pour rejoindre un appel
 * Le roomId est basé sur la prise en charge pour que les 2 participants
 * se retrouvent dans la même room
 */
export function getVisioJoinUrl(priseEnChargeId: string, name?: string, role?: string): string {
  const publicHost = process.env.PUBLIC_HOST || 'wesh.chat'
  const roomId = `room-${priseEnChargeId.substring(0, 12)}`
  let url = `https://${publicHost}/visio?room=${roomId}`
  if (name) url += `&name=${encodeURIComponent(name)}`
  if (role) url += `&role=${role}`
  return url
}

/**
 * Crée une room visio liée à une prise en charge.
 * Retourne l'URL de la page visio.
 * Compatible avec l'ancien nom createDailyRoom pour ne pas casser les imports.
 */
export async function createDailyRoom(priseEnChargeId: string): Promise<string> {
  return getVisioJoinUrl(priseEnChargeId)
}

/** @deprecated Use createDailyRoom instead */
export const generateJitsiRoomUrl = createDailyRoom
