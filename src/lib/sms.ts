// Module de notification : envoi du code PIN au bénéficiaire ou tiers
// Supporte : Office 365 SMTP, Graph API, OVH SMS, Brevo, et console.log en dev
//
// Configuration via variables d'environnement :
//   NOTIFICATION_MODE=sms|email|both|console (défaut: console en dev, email en prod)
//
//   --- Email Office 365 SMTP (prioritaire) ---
//   SMTP_HOST=smtp.office365.com / SMTP_PORT=587 / SMTP_USER=xxx@fondation-jae.org / SMTP_PASS=xxx
//   SMTP_FROM=noreply@fondation-jae.org
//
//   --- Email Office 365 Graph API (alternative) ---
//   O365_TENANT_ID / O365_CLIENT_ID / O365_CLIENT_SECRET / O365_SENDER_EMAIL
//
//   --- Email Brevo (fallback) ---
//   BREVO_API_KEY=xxx
//
//   --- SMS OVH ---
//   OVH_SMS_ACCOUNT=xxx / OVH_SMS_LOGIN=xxx / OVH_SMS_PASSWORD=xxx / OVH_SMS_SENDER=CatchUp

import nodemailer from 'nodemailer'

const NOTIFICATION_MODE = process.env.NOTIFICATION_MODE || (process.env.NODE_ENV === 'production' ? 'email' : 'console')

interface NotificationResult {
  sent: boolean
  channel: 'sms' | 'email' | 'console'
  error?: string
}

// ─── Envoi par SMS (OVH API) ───
async function sendSmsOvh(telephone: string, message: string): Promise<NotificationResult> {
  const account = process.env.OVH_SMS_ACCOUNT
  const login = process.env.OVH_SMS_LOGIN
  const password = process.env.OVH_SMS_PASSWORD
  const sender = process.env.OVH_SMS_SENDER || 'CatchUp'

  if (!account || !login || !password) {
    console.warn('[SMS] OVH credentials manquantes, fallback email')
    return { sent: false, channel: 'sms', error: 'OVH credentials missing' }
  }

  try {
    // Formater le numéro en international FR
    let formatted = telephone.replace(/\s+/g, '')
    if (formatted.startsWith('0')) {
      formatted = '+33' + formatted.substring(1)
    }

    const response = await fetch(
      `https://www.ovh.com/cgi-bin/sms/http2sms.cgi?account=${account}&login=${login}&password=${password}&from=${sender}&to=${formatted}&message=${encodeURIComponent(message)}&noStop=1`,
      { method: 'GET' }
    )

    const text = await response.text()
    if (text.includes('OK')) {
      console.log(`[SMS] Envoyé à ${formatted}`)
      return { sent: true, channel: 'sms' }
    } else {
      console.error(`[SMS] Erreur OVH: ${text}`)
      return { sent: false, channel: 'sms', error: text }
    }
  } catch (error) {
    console.error('[SMS] Erreur envoi:', error)
    return { sent: false, channel: 'sms', error: String(error) }
  }
}

// ─── Authentification Office 365 (Microsoft Graph via Client Credentials) ───
// Variables requises : O365_TENANT_ID, O365_CLIENT_ID, O365_CLIENT_SECRET, O365_SENDER_EMAIL
// Le sender doit être une boîte mail ou un shared mailbox autorisé dans Azure AD

let cachedO365Token: { token: string; expiresAt: number } | null = null

async function getO365Token(): Promise<string | null> {
  const tenantId = process.env.O365_TENANT_ID
  const clientId = process.env.O365_CLIENT_ID
  const clientSecret = process.env.O365_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) return null

  // Réutiliser le token s'il est encore valide (avec 5 min de marge)
  if (cachedO365Token && Date.now() < cachedO365Token.expiresAt - 300_000) {
    return cachedO365Token.token
  }

  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    )

    if (!response.ok) {
      console.error('[O365] Token error:', await response.text())
      return null
    }

    const data = await response.json()
    cachedO365Token = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
    return data.access_token
  } catch (error) {
    console.error('[O365] Auth error:', error)
    return null
  }
}

// ─── Envoi par Email via Office 365 (Microsoft Graph API) ───
async function sendEmailO365(to: string, subject: string, body: string): Promise<NotificationResult> {
  const senderEmail = process.env.O365_SENDER_EMAIL || process.env.SMTP_FROM
  if (!senderEmail) {
    return { sent: false, channel: 'email', error: 'O365_SENDER_EMAIL or SMTP_FROM not set' }
  }

  const token = await getO365Token()
  if (!token) {
    return { sent: false, channel: 'email', error: 'O365 auth failed' }
  }

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f8f9fa; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6C63FF; font-size: 24px; margin: 0;">Catch'Up</h1>
        <p style="color: #888; font-size: 12px; margin-top: 4px;">Fondation JAE — Orientation professionnelle</p>
      </div>
      <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0;">${body.replace(/\n/g, '<br/>')}</p>
      </div>
      <p style="font-size: 11px; color: #999; text-align: center; margin-top: 16px;">
        Ce message est envoyé automatiquement par Catch'Up.<br/>
        Ne répondez pas à cet email.
      </p>
    </div>
  `

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: 'HTML', content: htmlBody },
            toRecipients: [{ emailAddress: { address: to } }],
          },
          saveToSentItems: false,
        }),
      }
    )

    if (response.ok || response.status === 202) {
      console.log(`[EMAIL] Envoyé à ${to} via Office 365`)
      return { sent: true, channel: 'email' }
    }

    const errText = await response.text()
    console.error(`[EMAIL] O365 erreur (${response.status}): ${errText}`)
    return { sent: false, channel: 'email', error: errText }
  } catch (error) {
    console.error('[EMAIL] O365 send error:', error)
    return { sent: false, channel: 'email', error: String(error) }
  }
}

// ─── Envoi par Email SMTP direct (Office 365 / nodemailer) ───
async function sendEmailSmtp(to: string, subject: string, body: string): Promise<NotificationResult> {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = parseInt(process.env.SMTP_PORT || '587')
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@fondation-jae.org'

  if (!smtpHost || !smtpUser || !smtpPass) {
    return { sent: false, channel: 'email', error: 'SMTP not configured' }
  }

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f8f9fa; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6C63FF; font-size: 24px; margin: 0;">Catch'Up</h1>
        <p style="color: #888; font-size: 12px; margin-top: 4px;">Fondation JAE — Orientation professionnelle</p>
      </div>
      <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0;">${body.replace(/\n/g, '<br/>')}</p>
      </div>
      <p style="font-size: 11px; color: #999; text-align: center; margin-top: 16px;">
        Ce message est envoyé automatiquement par Catch'Up.<br/>Ne répondez pas à cet email.
      </p>
    </div>
  `

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { ciphers: 'SSLv3', rejectUnauthorized: false },
    })

    await transporter.sendMail({
      from: `"Catch'Up" <${smtpFrom}>`,
      to,
      subject,
      text: body,
      html: htmlBody,
    })

    console.log(`[EMAIL] Envoyé à ${to} via SMTP ${smtpHost}`)
    return { sent: true, channel: 'email' }
  } catch (error) {
    console.error(`[EMAIL] SMTP error:`, error)
    return { sent: false, channel: 'email', error: String(error) }
  }
}

// ─── Envoi par Email (chaîne de fallback : SMTP → Graph API → Brevo → console) ───
async function sendEmail(to: string, subject: string, body: string): Promise<NotificationResult> {
  // 1. SMTP direct (Office 365 ou autre) — le plus simple
  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  if (smtpConfigured) {
    const result = await sendEmailSmtp(to, subject, body)
    if (result.sent) return result
    console.warn('[EMAIL] SMTP a échoué, tentative Graph API...')
  }

  // 2. Office 365 Graph API
  const o365Configured = process.env.O365_TENANT_ID && process.env.O365_CLIENT_ID && process.env.O365_CLIENT_SECRET
  if (o365Configured) {
    const result = await sendEmailO365(to, subject, body)
    if (result.sent) return result
    console.warn('[EMAIL] Graph API a échoué, tentative Brevo...')
  }

  // 3. Brevo (ex-Sendinblue)
  const brevoKey = process.env.BREVO_API_KEY
  const smtpFrom = process.env.SMTP_FROM || process.env.O365_SENDER_EMAIL || 'noreply@fondation-jae.org'
  if (brevoKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: "Catch'Up", email: smtpFrom },
          to: [{ email: to }],
          subject,
          textContent: body,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #6C63FF; margin-bottom: 16px;">Catch'Up</h2>
              <p style="font-size: 16px; line-height: 1.6;">${body.replace(/\n/g, '<br/>')}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="font-size: 12px; color: #999;">Ce message est envoyé automatiquement par Catch'Up — Fondation JAE</p>
            </div>
          `,
        }),
      })

      if (response.ok) {
        console.log(`[EMAIL] Envoyé à ${to} via Brevo`)
        return { sent: true, channel: 'email' }
      }
      console.error(`[EMAIL] Brevo erreur: ${await response.text()}`)
    } catch (error) {
      console.error('[EMAIL] Brevo error:', error)
    }
  }

  // 4. Rien ne marche
  console.warn('[EMAIL] Aucun service email configuré')
  return { sent: false, channel: 'email', error: 'No email service configured' }
}

// ─── Console (mode développement) ───
function sendConsole(contact: string, message: string): NotificationResult {
  console.log(`\n╔══════════════════════════════════════════╗`)
  console.log(`║  📱 NOTIFICATION Catch'Up                ║`)
  console.log(`║  Destinataire: ${contact.padEnd(25)}║`)
  console.log(`║  ${message.padEnd(41)}║`)
  console.log(`╚══════════════════════════════════════════╝\n`)
  return { sent: true, channel: 'console' }
}

// ─── Point d'entrée principal ───

/**
 * Envoie un code PIN au bénéficiaire ou tiers
 * Le canal (SMS, email, console) dépend de la configuration
 */
export async function sendPinCode(
  contact: string,
  code: string,
  options: {
    type: 'beneficiaire' | 'tiers'
    prenom?: string
    conseillerPrenom?: string
    structureNom?: string
  } = { type: 'beneficiaire' }
): Promise<NotificationResult> {
  const { type, prenom, conseillerPrenom, structureNom } = options

  const host = process.env.PUBLIC_HOST || 'catchup.jaeprive.fr'
  const message = type === 'beneficiaire'
    ? `${prenom ? prenom + ', votre' : 'Votre'} conseiller${conseillerPrenom ? ' ' + conseillerPrenom : ''}${structureNom ? ' (' + structureNom + ')' : ''} vous accompagne sur Catch'Up.\n\nVotre code d'accès : ${code}\n\nRendez-vous sur ${host}/accompagnement`
    : `Vous êtes invité(e) à rejoindre un accompagnement sur Catch'Up.\n\nVotre code d'accès : ${code}\n\nRendez-vous sur ${host}/tiers`

  const subject = type === 'beneficiaire'
    ? `Catch'Up — Votre code d'accès`
    : `Catch'Up — Invitation à rejoindre un accompagnement`

  // Déterminer si c'est un email ou un téléphone
  const isEmail = contact.includes('@')
  const isPhone = /^[+0]?\d[\d\s-]{8,}$/.test(contact.replace(/\s/g, ''))

  // Mode console (dev)
  if (NOTIFICATION_MODE === 'console') {
    return sendConsole(contact, `Code: ${code}`)
  }

  // Mode SMS prioritaire
  if ((NOTIFICATION_MODE === 'sms' || NOTIFICATION_MODE === 'both') && isPhone) {
    const smsResult = await sendSmsOvh(contact, message)
    if (smsResult.sent) return smsResult
    // Fallback email si SMS échoue et qu'on a un email
    if (isEmail) return sendEmail(contact, subject, message)
  }

  // Mode email
  if ((NOTIFICATION_MODE === 'email' || NOTIFICATION_MODE === 'both') && isEmail) {
    const emailResult = await sendEmail(contact, subject, message)
    if (emailResult.sent) return emailResult
  }

  // Dernier fallback : console
  return sendConsole(contact, `Code: ${code}`)
}

/**
 * Envoie une notification de rendez-vous
 */
export async function sendRdvNotification(
  contact: string,
  rdvInfo: { titre: string; date: string; lieu: string; lienVisio?: string }
): Promise<NotificationResult> {
  const dateFormatted = new Date(rdvInfo.date).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const message = `Rappel Catch'Up : ${rdvInfo.titre}\n${dateFormatted}\n${rdvInfo.lieu === 'visio' && rdvInfo.lienVisio ? `Lien visio : ${rdvInfo.lienVisio}` : `Lieu : ${rdvInfo.lieu}`}`

  if (NOTIFICATION_MODE === 'console') {
    return sendConsole(contact, message)
  }

  const isEmail = contact.includes('@')
  if (isEmail) {
    return sendEmail(contact, `Catch'Up — Rappel : ${rdvInfo.titre}`, message)
  }

  const isPhone = /^[+0]?\d[\d\s-]{8,}$/.test(contact.replace(/\s/g, ''))
  if (isPhone) {
    return sendSmsOvh(contact, message)
  }

  return sendConsole(contact, message)
}
