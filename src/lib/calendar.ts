// Helper — Génération de liens calendrier (Google Calendar + Outlook .ics)
// (permet d'ajouter un RDV en un clic depuis le chat)

/**
 * Génère un lien Google Calendar avec les paramètres pré-remplis
 */
export function generateGoogleCalendarUrl(params: {
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', params.title)
  url.searchParams.set('dates', `${fmt(params.start)}/${fmt(params.end)}`)
  if (params.description) url.searchParams.set('details', params.description)
  if (params.location) url.searchParams.set('location', params.location)
  return url.toString()
}

/**
 * Génère un fichier .ics (iCalendar) compatible Outlook, Apple Calendar, etc.
 */
export function generateICS(params: {
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  uid?: string
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const uid = params.uid || `catchup-${Date.now()}@wesh.chat`
  const now = fmt(new Date())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Catch\'Up//Fondation JAE//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmt(params.start)}`,
    `DTEND:${fmt(params.end)}`,
    `SUMMARY:${escapeICS(params.title)}`,
  ]

  if (params.description) {
    lines.push(`DESCRIPTION:${escapeICS(params.description)}`)
  }
  if (params.location) {
    lines.push(`LOCATION:${escapeICS(params.location)}`)
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.join('\r\n')
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}
