'use client'

import { useState, useEffect } from 'react'

interface JournalEvent {
  id: string
  type: string
  acteurType: string
  acteurId: string
  cibleType: string | null
  cibleId: string | null
  resume: string | null
  details: Record<string, unknown> | null
  horodatage: string
}

const TYPE_ICONS: Record<string, string> = {
  message_envoye: '💬',
  participant_rejoint: '👋',
  participant_quitte: '🚪',
  consentement_demande: '🤝',
  consentement_accepte: '✅',
  consentement_refuse: '❌',
  video_proposee: '📹',
  video_acceptee: '🎥',
  video_refusee: '📵',
  rdv_planifie: '📅',
  bris_de_glace: '🔓',
  tiers_invite: '➕',
  tiers_revoque: '🚫',
}

const TYPE_LABELS: Record<string, string> = {
  message_envoye: 'Message envoyé',
  participant_rejoint: 'Participant rejoint',
  participant_quitte: 'Participant parti',
  consentement_demande: 'Consentement demandé',
  consentement_accepte: 'Consentement accepté',
  consentement_refuse: 'Consentement refusé',
  video_proposee: 'Appel vidéo proposé',
  video_acceptee: 'Appel vidéo accepté',
  video_refusee: 'Appel vidéo refusé',
  rdv_planifie: 'RDV planifié',
  bris_de_glace: 'Bris de glace',
  tiers_invite: 'Intervenant invité',
  tiers_revoque: 'Intervenant révoqué',
}

const ACTEUR_LABELS: Record<string, string> = {
  conseiller: '👤 Conseiller',
  beneficiaire: '🧑 Bénéficiaire',
  tiers: '🤝 Intervenant',
  systeme: '⚙️ Système',
}

export default function JournalEvenements({ referralId }: { referralId: string }) {
  const [events, setEvents] = useState<JournalEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/conseiller/file-active/${referralId}/journal`)
      .then(r => r.json())
      .then(d => {
        setEvents(d.evenements || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [referralId])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-catchup-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-gray-400">Aucun événement enregistré</p>
      </div>
    )
  }

  // Grouper par jour
  const grouped = events.reduce((acc, evt) => {
    const day = new Date(evt.horodatage).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    if (!acc[day]) acc[day] = []
    acc[day].push(evt)
    return acc
  }, {} as Record<string, JournalEvent[]>)

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Journal des événements</h3>

      <div className="space-y-6">
        {Object.entries(grouped).map(([day, dayEvents]) => (
          <div key={day}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-400 uppercase">{day}</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="space-y-2">
              {dayEvents.map(evt => (
                <div
                  key={evt.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    evt.type === 'bris_de_glace'
                      ? 'border-red-200 bg-red-50'
                      : evt.type.startsWith('consentement')
                        ? 'border-blue-100 bg-blue-50/50'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">
                    {TYPE_ICONS[evt.type] || '📌'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-800">
                        {TYPE_LABELS[evt.type] || evt.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {ACTEUR_LABELS[evt.acteurType] || evt.acteurType}
                      </span>
                    </div>

                    {evt.resume && (
                      <p className="text-sm text-gray-600">{evt.resume}</p>
                    )}

                    {evt.type === 'bris_de_glace' && evt.details && (
                      <p className="text-xs text-red-600 mt-1 italic">
                        Justification : {(evt.details as Record<string, string>).justification}
                      </p>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(evt.horodatage).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
