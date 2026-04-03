'use client'

import { useState } from 'react'

interface Rdv {
  id: string
  titre: string
  dateDebut: string
  dateFin: string
  lieu?: string
  description?: string
  googleUrl: string
  icsUrl: string
  statut?: string // 'propose' | 'accepte' | 'refuse'
  proposePar?: string
  motifRefus?: string
}

interface RdvCardProps {
  rdv: Rdv
  viewerType?: 'conseiller' | 'beneficiaire' | 'tiers'
  onAccept?: (id: string) => void
  onDecline?: (id: string, motif: string) => void
  onResend?: (rdv: Rdv) => void
}

function formatDateFr(dateStr: string): string {
  let normalized = dateStr
  if (normalized.includes(' ') && !normalized.includes('T')) {
    normalized = normalized.replace(' ', 'T')
  }
  if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.includes('-', 10)) {
    normalized += 'Z'
  }
  const date = new Date(normalized)
  if (isNaN(date.getTime())) return dateStr

  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

  return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()} à ${date.getHours()}h${date.getMinutes().toString().padStart(2, '0') !== '00' ? date.getMinutes().toString().padStart(2, '0') : ''}`
}

function toICSDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function generateClientICS(rdv: Rdv): string {
  const start = toICSDate(rdv.dateDebut)
  const end = toICSDate(rdv.dateFin)
  if (!start || !end) return ''
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CatchUp//Fondation JAE//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:catchup-${rdv.id}`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${rdv.titre}`,
    `DESCRIPTION:${rdv.description || "RDV Catch'Up"}`,
    rdv.lieu ? `LOCATION:${rdv.lieu}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

export default function RdvCard({ rdv, viewerType, onAccept, onDecline, onResend }: RdvCardProps) {
  const { id, titre, dateDebut, lieu, description, googleUrl, statut, motifRefus } = rdv
  const clientIcsUrl = generateClientICS(rdv)
  const [showRefusForm, setShowRefusForm] = useState(false)
  const [motif, setMotif] = useState('')

  const isPending = !statut || statut === 'propose'
  const isAccepted = statut === 'accepte'
  const isRefused = statut === 'refuse'
  const canRespond = isPending && viewerType === 'beneficiaire' && onAccept && onDecline

  const handleRefuse = () => {
    if (motif.trim()) {
      onDecline?.(id, motif.trim())
      setShowRefusForm(false)
    }
  }

  return (
    <div className="my-2 max-w-[85%] md:max-w-[70%]">
      <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${
        isAccepted ? 'border-green-200' : isRefused ? 'border-red-200' : 'border-gray-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" role="img" aria-label="Rendez-vous">📅</span>
            <h3 className="text-sm font-semibold text-gray-900">{titre}</h3>
          </div>
          {isAccepted && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Accepté</span>
          )}
          {isRefused && (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">✕ Refusé</span>
          )}
        </div>

        {/* Date + lieu */}
        <div className="px-4 pb-2">
          <p className="text-sm text-gray-600">{formatDateFr(dateDebut)}</p>
          {lieu && (
            <p className="text-xs text-gray-400 mt-0.5">
              📍 {lieu}
            </p>
          )}
        </div>

        {/* Description */}
        {description && (
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Motif de refus */}
        {isRefused && motifRefus && (
          <div className="mx-4 mb-3 p-2 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600"><strong>Motif :</strong> {motifRefus}</p>
          </div>
        )}

        {/* Calendar buttons — uniquement si accepté ou si côté conseiller */}
        {(isAccepted || viewerType === 'conseiller' || (!canRespond && !isRefused)) && (
          <div className="flex gap-2.5 px-4 pb-3">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-blue-200 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors no-underline"
            >
              📅 Google Agenda
            </a>
            <a
              href={clientIcsUrl}
              download={`rdv-catchup-${id}.ics`}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors no-underline"
            >
              ⬇️ Outlook / iCal
            </a>
          </div>
        )}

        {/* Bouton Rappeler — côté conseiller uniquement */}
        {viewerType === 'conseiller' && onResend && (
          <div className="px-4 pb-3">
            <button
              onClick={() => onResend(rdv)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-orange-200 text-orange-600 text-xs font-medium hover:bg-orange-50 transition-colors"
            >
              🔔 Rappeler ce RDV au bénéficiaire
            </button>
          </div>
        )}

        {/* Boutons Accepter / Refuser — côté bénéficiaire uniquement */}
        {canRespond && !showRefusForm && (
          <div className="flex border-t border-gray-100">
            <button
              onClick={() => setShowRefusForm(true)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Refuser
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={() => onAccept?.(id)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              Accepter
            </button>
          </div>
        )}

        {/* Formulaire de motif de refus */}
        {canRespond && showRefusForm && (
          <div className="border-t border-gray-100 p-3">
            <p className="text-xs text-gray-500 mb-2">Pourquoi souhaitez-vous refuser ce rendez-vous ?</p>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Ex: Je ne suis pas disponible à cette date..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-200 outline-none"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { setShowRefusForm(false); setMotif('') }}
                className="flex-1 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRefuse}
                disabled={!motif.trim()}
                className="flex-1 px-3 py-1.5 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
