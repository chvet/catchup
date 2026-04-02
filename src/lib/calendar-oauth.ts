// Calendar OAuth2 Integration — Google Calendar + Microsoft Outlook
// Handles OAuth2 flows, token refresh, and CRUD operations on calendar events

// ── Types ──

export interface CalendarEvent {
  title: string
  description?: string
  startTime: string // ISO 8601
  endTime: string   // ISO 8601
  location?: string
  attendees?: string[] // email addresses
}

export interface TokenResult {
  accessToken: string
  refreshToken?: string
  expiresAt: string // ISO 8601
  email?: string
}

// ── Env vars ──

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || ''
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'https://catchup.jaeprive.fr/api/calendar/google/callback'

const O365_TENANT_ID = process.env.O365_TENANT_ID || ''
const O365_CLIENT_ID = process.env.O365_CLIENT_ID || ''
const O365_CLIENT_SECRET = process.env.O365_CLIENT_SECRET || ''
const O365_REDIRECT_URI = process.env.O365_CALENDAR_REDIRECT_URI || 'https://catchup.jaeprive.fr/api/calendar/outlook/callback'

// ══════════════════════════════════════════
// GOOGLE CALENDAR
// ══════════════════════════════════════════

/**
 * Build the Google OAuth2 consent URL
 */
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Exchange Google auth code for tokens
 */
export async function exchangeGoogleCode(code: string): Promise<TokenResult> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google token exchange failed: ${err}`)
  }

  const data = await res.json()
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()

  // Get user email
  let email: string | undefined
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (userRes.ok) {
      const user = await userRes.json()
      email = user.email
    }
  } catch { /* ignore */ }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    email,
  }
}

/**
 * Refresh an expired Google token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<TokenResult> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google token refresh failed: ${err}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Google may not return a new refresh token
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }
}

/**
 * Create an event on Google Calendar — returns the event ID
 */
export async function createGoogleCalendarEvent(accessToken: string, event: CalendarEvent): Promise<string> {
  const body: Record<string, unknown> = {
    summary: event.title,
    start: { dateTime: event.startTime, timeZone: 'Europe/Paris' },
    end: { dateTime: event.endTime, timeZone: 'Europe/Paris' },
  }

  if (event.description) body.description = event.description
  if (event.location) body.location = event.location
  if (event.attendees?.length) {
    body.attendees = event.attendees.map(email => ({ email }))
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Calendar create event failed: ${err}`)
  }

  const data = await res.json()
  return data.id
}

/**
 * Delete a Google Calendar event
 */
export async function deleteGoogleCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!res.ok && res.status !== 404) {
    const err = await res.text()
    throw new Error(`Google Calendar delete event failed: ${err}`)
  }
}

// ══════════════════════════════════════════
// MICROSOFT OUTLOOK (Graph API)
// ══════════════════════════════════════════

/**
 * Build the Microsoft OAuth2 consent URL
 */
export function getOutlookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: O365_CLIENT_ID,
    redirect_uri: O365_REDIRECT_URI,
    response_type: 'code',
    scope: 'Calendars.ReadWrite User.Read offline_access',
    response_mode: 'query',
    state,
  })
  return `https://login.microsoftonline.com/${O365_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`
}

/**
 * Exchange Microsoft auth code for tokens
 */
export async function exchangeOutlookCode(code: string): Promise<TokenResult> {
  const res = await fetch(`https://login.microsoftonline.com/${O365_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: O365_CLIENT_ID,
      client_secret: O365_CLIENT_SECRET,
      redirect_uri: O365_REDIRECT_URI,
      grant_type: 'authorization_code',
      scope: 'Calendars.ReadWrite User.Read offline_access',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Outlook token exchange failed: ${err}`)
  }

  const data = await res.json()
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()

  // Get user email via Graph
  let email: string | undefined
  try {
    const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (userRes.ok) {
      const user = await userRes.json()
      email = user.mail || user.userPrincipalName
    }
  } catch { /* ignore */ }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    email,
  }
}

/**
 * Refresh an expired Outlook token
 */
export async function refreshOutlookToken(refreshToken: string): Promise<TokenResult> {
  const res = await fetch(`https://login.microsoftonline.com/${O365_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: O365_CLIENT_ID,
      client_secret: O365_CLIENT_SECRET,
      grant_type: 'refresh_token',
      scope: 'Calendars.ReadWrite User.Read offline_access',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Outlook token refresh failed: ${err}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }
}

/**
 * Create an event on Outlook Calendar via Graph API — returns the event ID
 */
export async function createOutlookCalendarEvent(accessToken: string, event: CalendarEvent): Promise<string> {
  const body: Record<string, unknown> = {
    subject: event.title,
    start: { dateTime: event.startTime, timeZone: 'Europe/Paris' },
    end: { dateTime: event.endTime, timeZone: 'Europe/Paris' },
    isOnlineMeeting: false,
  }

  const bodyContent = event.description || ''
  if (bodyContent.trim()) {
    body.body = { contentType: 'Text', content: bodyContent.trim() }
  }

  if (event.location) {
    body.location = { displayName: event.location }
  }

  if (event.attendees?.length) {
    body.attendees = event.attendees.map(email => ({
      emailAddress: { address: email },
      type: 'required',
    }))
  }

  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Outlook Calendar create event failed: ${err}`)
  }

  const data = await res.json()
  return data.id
}

/**
 * Delete an Outlook Calendar event
 */
export async function deleteOutlookCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok && res.status !== 404) {
    const err = await res.text()
    throw new Error(`Outlook Calendar delete event failed: ${err}`)
  }
}

// ══════════════════════════════════════════
// HELPERS — Token management
// ══════════════════════════════════════════

/**
 * Ensure a valid access token — refresh if expired.
 * Returns the (possibly refreshed) access token and new expiry.
 */
export async function ensureValidToken(
  provider: 'google' | 'outlook',
  accessToken: string,
  refreshToken: string | null,
  expiresAt: string | null,
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: string } | null> {
  // If token is still valid (with 5-minute buffer), return as-is
  if (expiresAt && new Date(expiresAt).getTime() > Date.now() + 5 * 60 * 1000) {
    return { accessToken, expiresAt }
  }

  // Need to refresh
  if (!refreshToken) return null

  try {
    const result = provider === 'google'
      ? await refreshGoogleToken(refreshToken)
      : await refreshOutlookToken(refreshToken)

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
    }
  } catch (err) {
    console.error(`[Calendar] Failed to refresh ${provider} token:`, err)
    return null
  }
}
