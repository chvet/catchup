'use client'

import { useState, useEffect } from 'react'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

interface ParcoureoStatus {
  configured: boolean
  linked: boolean
  parcoureoId?: string
}

interface CalendarStatus {
  google: { connected: boolean; email?: string; since?: string }
  outlook: { connected: boolean; email?: string; since?: string }
}

export default function ParametresPage() {
  const conseiller = useConseiller()
  const [slug, setSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [parcoureo, setParcoureo] = useState<ParcoureoStatus>({ configured: false, linked: false })
  const [parcoureoLoading, setParcoureoLoading] = useState(false)
  const [calendar, setCalendar] = useState<CalendarStatus>({
    google: { connected: false },
    outlook: { connected: false },
  })
  const [calendarLoading, setCalendarLoading] = useState<string | null>(null)
  const [calendarMessage, setCalendarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (conseiller?.structure?.id) {
      fetch(`/api/conseiller/structures/${conseiller.structure.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          // L'API retourne { structure: { slug, ... }, conseillers: [...] }
          const s = data?.structure?.slug || data?.slug
          if (s) setSlug(s)
        })
        .catch(() => {})
    }
  }, [conseiller?.structure?.id])

  // Vérifier le statut Parcoureo
  useEffect(() => {
    fetch('/api/conseiller/auth/parcoureo/status')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.configured) {
          const linked = !!conseiller?.parcoureoId
          setParcoureo({
            configured: true,
            linked,
            parcoureoId: linked ? String(conseiller.parcoureoId) : undefined,
          })
        }
      })
      .catch(() => {})
  }, [conseiller])

  // Charger le statut des calendriers connectes
  useEffect(() => {
    fetch('/api/calendar/status')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setCalendar(data)
      })
      .catch(() => {})
  }, [])

  // Detecter les parametres de retour apres OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const calParam = params.get('calendar')
    const providerParam = params.get('provider')
    if (calParam === 'connected' && providerParam) {
      setCalendarMessage({ type: 'success', text: `${providerParam === 'google' ? 'Google Calendar' : 'Outlook'} connecte avec succes !` })
      // Refresh status
      fetch('/api/calendar/status')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setCalendar(data) })
        .catch(() => {})
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setCalendarMessage(null), 5000)
    } else if (calParam === 'error') {
      setCalendarMessage({ type: 'error', text: `Erreur de connexion ${providerParam === 'google' ? 'Google Calendar' : 'Outlook'}. Veuillez reessayer.` })
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setCalendarMessage(null), 5000)
    }
  }, [])

  const handleConnectCalendar = (provider: 'google' | 'outlook') => {
    setCalendarLoading(provider)
    window.location.href = `/api/calendar/${provider}?returnUrl=/conseiller/parametres`
  }

  const handleDisconnectCalendar = async (provider: 'google' | 'outlook') => {
    setCalendarLoading(provider)
    try {
      const res = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      if (res.ok) {
        setCalendar(prev => ({
          ...prev,
          [provider]: { connected: false },
        }))
        setCalendarMessage({ type: 'success', text: `${provider === 'google' ? 'Google Calendar' : 'Outlook'} deconnecte.` })
        setTimeout(() => setCalendarMessage(null), 3000)
      }
    } catch {
      setCalendarMessage({ type: 'error', text: 'Erreur lors de la deconnexion.' })
      setTimeout(() => setCalendarMessage(null), 3000)
    } finally {
      setCalendarLoading(null)
    }
  }

  const handleLinkParcoureo = () => {
    setParcoureoLoading(true)
    window.location.href = '/api/conseiller/auth/parcoureo'
  }

  const beneficiaireUrl = slug ? `https://wesh.chat/?s=${slug}` : null
  const conseillerUrl = slug ? `https://wesh.chat/conseiller/login?s=${slug}` : null
  const qrCodeUrl = beneficiaireUrl
    ? `/api/qrcode?data=${encodeURIComponent(beneficiaireUrl)}&size=200&v=2`
    : null
  const qrCodeUrlLarge = beneficiaireUrl
    ? `/api/qrcode?data=${encodeURIComponent(beneficiaireUrl)}&size=400&v=2`
    : null

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    if (!beneficiaireUrl || !qrCodeUrlLarge) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>QR Code — ${conseiller?.structure?.nom}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 60px 40px; }
        h1 { font-size: 28px; color: #1a1a2e; margin-bottom: 8px; }
        h2 { font-size: 18px; color: #6C63FF; font-weight: 500; margin-bottom: 40px; }
        img { margin: 0 auto; display: block; }
        .url { font-size: 14px; color: #666; margin-top: 30px; word-break: break-all; }
        .cta { font-size: 20px; color: #333; margin-top: 30px; font-weight: 600; }
      </style></head><body>
        <h1>${conseiller?.structure?.nom || 'Catch\'Up'}</h1>
        <h2>Catch'Up — Orientation professionnelle</h2>
        <img src="${qrCodeUrlLarge}" width="300" height="300" />
        <p class="cta">📱 Scannez pour accéder à Catch'Up</p>
        <p class="url">${beneficiaireUrl}</p>
      </body></html>
    `)
    w.document.close()
    w.onload = () => { w.print() }
  }

  const handleDownloadQR = () => {
    if (!qrCodeUrlLarge) return
    const a = document.createElement('a')
    a.href = qrCodeUrlLarge
    a.download = `qrcode-catchup-${slug}.png`
    a.target = '_blank'
    a.click()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Profil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Mon profil</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-catchup-primary text-white flex items-center justify-center text-xl font-bold">
                {conseiller?.prenom?.[0]}{conseiller?.nom?.[0]}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {conseiller?.prenom} {conseiller?.nom}
                </p>
                <p className="text-gray-500">{conseiller?.email}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Rôle</span>
                <span className="text-sm font-medium text-gray-800">
                  {conseiller?.role === 'super_admin' ? 'Super Administrateur' :
                   conseiller?.role === 'admin_structure' ? 'Administrateur structure' :
                   'Conseiller'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Structure</span>
                <span className="text-sm font-medium text-gray-800">
                  {conseiller?.structure?.nom || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code & Liens */}
        {slug && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🔗 Lien & QR Code de ma structure</h2>

            <div className="flex flex-col items-center gap-4">
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="p-3 bg-white border-2 border-gray-200 rounded-xl">
                  <object data={qrCodeUrl} type="image/svg+xml" width={180} height={180}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="QR Code" width={180} height={180} />
                  </object>
                </div>
              )}

              {/* Lien bénéficiaire */}
              <div className="w-full">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Lien bénéficiaire</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={beneficiaireUrl || ''}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono"
                  />
                  <button
                    onClick={() => beneficiaireUrl && handleCopy(beneficiaireUrl)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-catchup-primary text-white hover:bg-catchup-primary/90'
                    }`}
                  >
                    {copied ? '✓' : 'Copier'}
                  </button>
                </div>
              </div>

              {/* Lien conseiller */}
              <div className="w-full">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Lien conseiller</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={conseillerUrl || ''}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono"
                  />
                  <button
                    onClick={() => conseillerUrl && handleCopy(conseillerUrl)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {copied ? '✓' : 'Copier'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDownloadQR}
                  className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ⬇️ Télécharger
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-3 py-2 text-sm font-medium bg-catchup-primary/10 text-catchup-primary rounded-lg hover:bg-catchup-primary/20 transition-colors"
                >
                  🖨️ Imprimer
                </button>
              </div>

              {/* Partage réseaux sociaux */}
              <div className="w-full">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Partager</p>
                <div className="flex gap-2">
                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(beneficiaireUrl || '')}&quote=${encodeURIComponent(`Découvre Catch'Up, ton guide d'orientation professionnelle ! ${conseiller?.structure?.nom || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1877F2] text-white text-sm font-medium rounded-lg hover:bg-[#1877F2]/90 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(beneficiaireUrl || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0A66C2] text-white text-sm font-medium rounded-lg hover:bg-[#0A66C2]/90 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                  {/* X / Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(beneficiaireUrl || '')}&text=${encodeURIComponent(`Découvre Catch'Up, ton guide d'orientation ! 🚀 ${conseiller?.structure?.nom || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X
                  </a>
                </div>
                {/* WhatsApp + Email + Copier le lien — ligne 2 */}
                <div className="flex gap-2 mt-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Découvre Catch'Up pour ton orientation ! 🚀 ${beneficiaireUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:bg-[#25D366]/90 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Catch'Up — Orientation professionnelle`)}&body=${encodeURIComponent(`Bonjour,\n\nDécouvrez Catch'Up, la plateforme d'orientation professionnelle de ${conseiller?.structure?.nom || 'notre structure'}.\n\nAccédez directement : ${beneficiaireUrl}\n\nBonne découverte !`)}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    Email
                  </a>
                  <button
                    onClick={() => beneficiaireUrl && handleCopy(beneficiaireUrl)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    {copied ? 'Copie !' : 'Copier le lien'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parcoureo */}
        {parcoureo.configured && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Parcoureo</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${parcoureo.linked ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-700">
                  {parcoureo.linked ? 'Compte Parcoureo lie' : 'Compte non lie'}
                </span>
              </div>

              {parcoureo.linked ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Votre compte est lie a Parcoureo.
                  </p>
                  {parcoureo.parcoureoId && (
                    <p className="text-xs text-green-600 mt-1">
                      Identifiant : <span className="font-mono">{parcoureo.parcoureoId}</span>
                    </p>
                  )}
                  <p className="text-xs text-green-600 mt-1">
                    Email : {conseiller?.email}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    Liez votre compte Parcoureo pour vous connecter en un clic et synchroniser les profils.
                  </p>
                  <button
                    onClick={handleLinkParcoureo}
                    disabled={parcoureoLoading}
                    className="px-4 py-2.5 bg-[#2D5F8A] text-white text-sm font-medium rounded-lg hover:bg-[#2D5F8A]/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    {parcoureoLoading ? 'Redirection...' : 'Lier mon compte Parcoureo'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mes agendas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Mes agendas</h2>

          {calendarMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              calendarMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {calendarMessage.text}
            </div>
          )}

          <p className="text-sm text-gray-500 mb-4">
            Connectez vos agendas pour synchroniser automatiquement les rendez-vous.
          </p>

          <div className="space-y-3">
            {/* Google Calendar */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              calendar.google.connected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-800">Google Calendar</p>
                  {calendar.google.connected && calendar.google.email && (
                    <p className="text-xs text-green-600">{calendar.google.email}</p>
                  )}
                </div>
                {calendar.google.connected && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                )}
              </div>
              {calendar.google.connected ? (
                <button
                  onClick={() => handleDisconnectCalendar('google')}
                  disabled={calendarLoading === 'google'}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {calendarLoading === 'google' ? '...' : 'Deconnecter'}
                </button>
              ) : (
                <button
                  onClick={() => handleConnectCalendar('google')}
                  disabled={calendarLoading === 'google'}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-catchup-primary rounded-lg hover:bg-catchup-primary/90 disabled:opacity-50 transition-colors"
                >
                  {calendarLoading === 'google' ? 'Redirection...' : 'Connecter'}
                </button>
              )}
            </div>

            {/* Outlook Calendar */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              calendar.outlook.connected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.583a.793.793 0 01-.583.238h-8.196v-12.5h8.196c.234 0 .43.08.588.238.158.16.233.354.233.583v.38zM7.5 5.5v13h-6c-.23 0-.424-.08-.583-.238A.793.793 0 01.68 17.68V6.32c0-.23.08-.424.238-.583A.793.793 0 011.5 5.5h6z"/>
                  <path fill="#0364B8" d="M24 7.387H14.983V6.186h8.196c.234 0 .43.08.588.238.158.16.233.354.233.583v.38zM14.983 18.686h8.196c.23 0 .424-.08.583-.238a.793.793 0 00.238-.583v-.38H14.983v1.2z"/>
                  <path fill="#0078D4" d="M14.5 6.186L7.5 5.5v13l7-1.186V6.186z"/>
                  <path fill="white" d="M10.25 9.5c.688 0 1.247.234 1.68.703.43.47.648 1.07.648 1.797s-.218 1.328-.648 1.797c-.433.469-.992.703-1.68.703s-1.247-.234-1.68-.703c-.43-.469-.648-1.07-.648-1.797s.218-1.328.648-1.797c.433-.469.992-.703 1.68-.703zm0 .937c-.375 0-.68.148-.914.445-.234.297-.352.68-.352 1.148 0 .469.118.852.352 1.148.234.297.539.445.914.445s.68-.148.914-.445c.234-.297.352-.68.352-1.148 0-.469-.118-.852-.352-1.148-.234-.297-.539-.445-.914-.445z"/>
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-800">Outlook</p>
                  {calendar.outlook.connected && calendar.outlook.email && (
                    <p className="text-xs text-green-600">{calendar.outlook.email}</p>
                  )}
                </div>
                {calendar.outlook.connected && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                )}
              </div>
              {calendar.outlook.connected ? (
                <button
                  onClick={() => handleDisconnectCalendar('outlook')}
                  disabled={calendarLoading === 'outlook'}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {calendarLoading === 'outlook' ? '...' : 'Deconnecter'}
                </button>
              ) : (
                <button
                  onClick={() => handleConnectCalendar('outlook')}
                  disabled={calendarLoading === 'outlook'}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#0078D4] rounded-lg hover:bg-[#0078D4]/90 disabled:opacity-50 transition-colors"
                >
                  {calendarLoading === 'outlook' ? 'Redirection...' : 'Connecter'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Infos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Version : <span className="font-mono">2.0.0</span> (Espace Conseiller)</p>
            <p>Plateforme : Catch&apos;Up — Fondation JAE</p>
            {slug && <p>Identifiant structure : <span className="font-mono text-catchup-primary">{slug}</span></p>}
            <p className="text-gray-400 mt-4">
              Pour modifier votre mot de passe ou vos informations, contactez votre administrateur de structure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
