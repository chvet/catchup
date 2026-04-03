'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──

interface Rdv {
  id: string
  titre: string
  dateHeure: string
  dureeMinutes: number
  lieu?: string
  lienVisio?: string
  statut: 'confirme' | 'en_attente' | 'annule'
  conseiller: { prenom: string }
}

interface MesRendezVousProps {
  token: string
}

// ── Helpers ──

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatHeure(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  return `${h}h${m > 0 ? m.toString().padStart(2, '0') : '00'}`
}

function formatDateSmart(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const demain = new Date(now)
  demain.setDate(demain.getDate() + 1)

  if (isSameDay(d, now)) {
    return `Aujourd'hui à ${formatHeure(d)}`
  }
  if (isSameDay(d, demain)) {
    return `Demain à ${formatHeure(d)}`
  }

  // Within this week (next 6 days)
  const diff = d.getTime() - now.getTime()
  const diffDays = diff / (1000 * 60 * 60 * 24)
  if (diffDays > 0 && diffDays < 7) {
    const jour = JOURS[d.getDay()]
    const jourCap = jour.charAt(0).toUpperCase() + jour.slice(1)
    return `${jourCap} ${d.getDate()} ${MOIS[d.getMonth()]} à ${formatHeure(d)}`
  }

  // Further away
  const annee = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ''
  return `${d.getDate()} ${MOIS[d.getMonth()]}${annee} à ${formatHeure(d)}`
}

function minutesUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 60000)
}

function formatCountdown(min: number): string {
  if (min <= 0) return 'Maintenant'
  if (min === 1) return 'Dans 1 minute'
  return `Dans ${min} minutes`
}

function buildGoogleCalendarUrl(rdv: Rdv): string {
  const start = new Date(rdv.dateHeure)
  const end = new Date(start.getTime() + rdv.dureeMinutes * 60000)

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: rdv.titre,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Rendez-vous avec ${rdv.conseiller.prenom}`,
  })

  if (rdv.lienVisio) {
    params.set('location', rdv.lienVisio)
  } else if (rdv.lieu) {
    params.set('location', rdv.lieu)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildIcsDataUrl(rdv: Rdv): string {
  const start = new Date(rdv.dateHeure)
  const end = new Date(start.getTime() + rdv.dureeMinutes * 60000)

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const location = rdv.lienVisio || rdv.lieu || ''

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CatchUp//RDV//FR',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${rdv.titre}`,
    `DESCRIPTION:Rendez-vous avec ${rdv.conseiller.prenom}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

// ── Color bar logic ──

function getBarColor(rdv: Rdv): string {
  const now = new Date()
  const d = new Date(rdv.dateHeure)
  if (isSameDay(d, now)) return 'bg-emerald-500'
  if (rdv.statut === 'en_attente') return 'bg-orange-400'
  return 'bg-catchup-primary'
}

function getStatutBadge(rdv: Rdv): { label: string; classes: string } | null {
  if (rdv.statut === 'en_attente') {
    return { label: 'En attente', classes: 'bg-orange-100 text-orange-700' }
  }
  if (rdv.statut === 'annule') {
    return { label: 'Annulé', classes: 'bg-red-100 text-red-600' }
  }
  return null
}

// ── Component ──

export default function MesRendezVous({ token }: MesRendezVousProps) {
  const [rdvs, setRdvs] = useState<Rdv[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [, setTick] = useState(0) // force re-render for countdown

  const fetchRdvs = useCallback(async () => {
    try {
      const res = await fetch('/api/accompagnement/rdv', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setRdvs(data.rdvs || [])
      setError('')
    } catch {
      setError('Impossible de charger vos rendez-vous')
    } finally {
      setLoading(false)
    }
  }, [token])

  // Initial fetch + auto-refresh every 60s
  useEffect(() => {
    fetchRdvs()
    const interval = setInterval(fetchRdvs, 60000)
    return () => clearInterval(interval)
  }, [fetchRdvs])

  // Tick every 30s to update countdowns
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  // ── Loading ──
  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg" role="img" aria-label="Rendez-vous">📅</span>
          <h2 className="text-base font-semibold text-gray-900">Mes rendez-vous</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-3 border-catchup-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error && rdvs.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg" role="img" aria-label="Rendez-vous">📅</span>
          <h2 className="text-base font-semibold text-gray-900">Mes rendez-vous</h2>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4">
          {error}
        </div>
      </div>
    )
  }

  // Sort: upcoming first
  const upcoming = [...rdvs]
    .filter(r => r.statut !== 'annule')
    .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg" role="img" aria-label="Rendez-vous">📅</span>
        <h2 className="text-base font-semibold text-gray-900">Mes rendez-vous</h2>
        <span className="ml-auto text-xs text-gray-400">
          {upcoming.length > 0 ? `${upcoming.length} à venir` : ''}
        </span>
      </div>

      {/* Empty state */}
      {upcoming.length === 0 && (
        <div className="text-center py-10">
          <div className="text-4xl mb-3" role="img" aria-label="Calendrier vide">🗓️</div>
          <p className="text-gray-500 text-sm">
            Pas de rendez-vous prévu pour le moment
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Votre conseiller vous proposera un créneau bientôt.
          </p>
        </div>
      )}

      {/* RDV cards */}
      <div className="space-y-3">
        {upcoming.map(rdv => {
          const min = minutesUntil(rdv.dateHeure)
          const isImminent = min >= 0 && min <= 60
          const statutBadge = getStatutBadge(rdv)

          return (
            <div
              key={rdv.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex"
            >
              {/* Left color bar */}
              <div className={`w-1.5 shrink-0 ${getBarColor(rdv)}`} />

              {/* Content */}
              <div className="flex-1 p-3.5">
                {/* Countdown badge */}
                {isImminent && min > 0 && (
                  <div className="mb-2">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                      min <= 15
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      ⏱ {formatCountdown(min)}
                    </span>
                  </div>
                )}

                {/* Date */}
                <p className="text-sm text-gray-500 mb-1">
                  {formatDateSmart(rdv.dateHeure)}
                </p>

                {/* Title */}
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                  {rdv.titre}
                </h3>

                {/* Conseiller */}
                <p className="text-xs text-gray-400 mb-2">
                  Avec {rdv.conseiller.prenom}
                </p>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {rdv.lieu || 'En présentiel'}
                  </span>

                  {statutBadge && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statutBadge.classes}`}>
                      {statutBadge.label}
                    </span>
                  )}
                </div>

                {/* Calendar links */}
                <div className="flex gap-2">
                  <a
                    href={buildGoogleCalendarUrl(rdv)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.675 3 3 3.675 3 4.5v15c0 .825.675 1.5 1.5 1.5h15c.825 0 1.5-.675 1.5-1.5v-15c0-.825-.675-1.5-1.5-1.5zm0 16.5h-15V8.25h15v11.25z" />
                    </svg>
                    Google
                  </a>
                  <a
                    href={buildIcsDataUrl(rdv)}
                    download={`rdv-${rdv.id}.ics`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    iCal
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
