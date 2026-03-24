'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Beneficiaire {
  prenom: string
  age: number
}

interface Rdv {
  id: string
  titre: string
  dateHeure: string
  dureeMinutes: number
  lieu: 'visio' | 'presentiel'
  lienVisio?: string
  statut: 'confirme' | 'en_attente' | 'annule'
  beneficiaire: Beneficiaire
  priseEnChargeId?: string
  referralId?: string
  notes?: string
}

interface BeneficiaireOption {
  id: string
  prenom: string
  nom: string
}

type ViewMode = 'jour' | 'semaine' | 'liste'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const JOURS_COURTS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

function formatDateLong(date: Date): string {
  return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}`
}

function formatHeure(dateStr: string): string {
  const d = new Date(dateStr)
  const h = d.getHours()
  const m = d.getMinutes()
  return `${h}h${m.toString().padStart(2, '0')}`
}

function formatDateCourte(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // lundi = premier jour
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

function statutColorBorder(statut: Rdv['statut']): string {
  switch (statut) {
    case 'confirme': return 'border-[#6C63FF]'
    case 'en_attente': return 'border-orange-500'
    case 'annule': return 'border-gray-400'
  }
}

function statutColorBg(statut: Rdv['statut']): string {
  switch (statut) {
    case 'confirme': return 'bg-[#6C63FF]/10'
    case 'en_attente': return 'bg-orange-50'
    case 'annule': return 'bg-gray-50'
  }
}

function statutLabel(statut: Rdv['statut']): string {
  switch (statut) {
    case 'confirme': return 'Confirmé'
    case 'en_attente': return 'En attente'
    case 'annule': return 'Annulé'
  }
}

function statutBadge(statut: Rdv['statut']): string {
  switch (statut) {
    case 'confirme': return 'bg-[#6C63FF]/10 text-[#6C63FF]'
    case 'en_attente': return 'bg-orange-100 text-orange-700'
    case 'annule': return 'bg-gray-100 text-gray-500'
  }
}

function generateIcsUrl(rdv: Rdv): string {
  const start = new Date(rdv.dateHeure)
  const end = new Date(start.getTime() + rdv.dureeMinutes * 60000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${rdv.titre}`,
    `DESCRIPTION:RDV avec ${rdv.beneficiaire.prenom}`,
    `LOCATION:${rdv.lieu === 'visio' ? 'Visioconférence' : 'Présentiel'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics)
}

function generateGoogleCalUrl(rdv: Rdv): string {
  const start = new Date(rdv.dateHeure)
  const end = new Date(start.getTime() + rdv.dureeMinutes * 60000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: rdv.titre,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `RDV avec ${rdv.beneficiaire.prenom}`,
    location: rdv.lieu === 'visio' ? 'Visioconférence' : 'Présentiel',
  })
  return `https://calendar.google.com/calendar/event?${params.toString()}`
}

// ─── Heures du jour (8h → 20h) ──────────────────────────────────────────────

const HEURES = Array.from({ length: 13 }, (_, i) => i + 8) // 8..20

// ─── Composant principal ─────────────────────────────────────────────────────

export default function AgendaPage() {
  const [view, setView] = useState<ViewMode>('jour')
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()))
  const [rdvs, setRdvs] = useState<Rdv[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRdv, setSelectedRdv] = useState<Rdv | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Filtres pour la vue liste
  const [filtreStatut, setFiltreStatut] = useState<string>('tous')
  const [filtreType, setFiltreType] = useState<string>('tous')
  const [triColonne, setTriColonne] = useState<string>('dateHeure')
  const [triAsc, setTriAsc] = useState(true)

  // Plage de dates pour le fetch
  const dateRange = useMemo(() => {
    if (view === 'jour') {
      const from = startOfDay(currentDate)
      const to = addDays(from, 1)
      return { from, to }
    } else {
      const weekStart = startOfWeek(currentDate)
      const weekEnd = addDays(weekStart, 7)
      return { from: weekStart, to: weekEnd }
    }
  }, [view, currentDate])

  // Fetch des RDV
  const fetchRdvs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      })
      const res = await fetch(`/api/conseiller/rdv?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRdvs(data.rdvs || [])
      }
    } catch (err) {
      console.error('Erreur chargement RDV:', err)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchRdvs()
  }, [fetchRdvs])

  // Quand on sélectionne un RDV, charger les notes
  useEffect(() => {
    if (selectedRdv) {
      setNoteText(selectedRdv.notes || '')
    }
  }, [selectedRdv])

  // Navigation
  const naviguer = (direction: number) => {
    if (view === 'jour') {
      setCurrentDate(prev => addDays(prev, direction))
    } else {
      setCurrentDate(prev => addDays(prev, direction * 7))
    }
    setSelectedRdv(null)
  }

  const allerAujourdhui = () => {
    setCurrentDate(startOfDay(new Date()))
    setSelectedRdv(null)
  }

  // Stats
  const aujourdhuiRdvs = rdvs.filter(r => {
    const d = new Date(r.dateHeure)
    return isSameDay(d, new Date()) && r.statut !== 'annule'
  })

  const semaineRdvs = rdvs.filter(r => r.statut !== 'annule')

  const visioAVenir = rdvs.filter(r => {
    const d = new Date(r.dateHeure)
    return d > new Date() && r.lieu === 'visio' && r.statut === 'confirme'
  })

  // Sauvegarder une note
  const sauvegarderNote = async () => {
    if (!selectedRdv) return
    setSavingNote(true)
    try {
      await fetch(`/api/conseiller/rdv/${selectedRdv.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText }),
      })
    } catch (err) {
      console.error('Erreur sauvegarde note:', err)
    } finally {
      setSavingNote(false)
    }
  }

  // Annuler un RDV
  const annulerRdv = async (rdv: Rdv) => {
    if (!confirm(`Annuler le rendez-vous "${rdv.titre}" ?`)) return
    try {
      const res = await fetch(`/api/conseiller/rdv/${rdv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'annule' }),
      })
      if (res.ok) {
        fetchRdvs()
        setSelectedRdv(null)
      }
    } catch (err) {
      console.error('Erreur annulation:', err)
    }
  }

  // Vue liste : filtrage et tri
  const rdvsFiltres = useMemo(() => {
    let liste = [...rdvs]
    if (filtreStatut !== 'tous') liste = liste.filter(r => r.statut === filtreStatut)
    if (filtreType !== 'tous') liste = liste.filter(r => r.lieu === filtreType)
    liste.sort((a, b) => {
      let cmp = 0
      switch (triColonne) {
        case 'dateHeure':
          cmp = new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime()
          break
        case 'titre':
          cmp = a.titre.localeCompare(b.titre)
          break
        case 'beneficiaire':
          cmp = a.beneficiaire.prenom.localeCompare(b.beneficiaire.prenom)
          break
        case 'statut':
          cmp = a.statut.localeCompare(b.statut)
          break
        default:
          cmp = 0
      }
      return triAsc ? cmp : -cmp
    })
    return liste
  }, [rdvs, filtreStatut, filtreType, triColonne, triAsc])

  const toggleTri = (col: string) => {
    if (triColonne === col) {
      setTriAsc(prev => !prev)
    } else {
      setTriColonne(col)
      setTriAsc(true)
    }
  }

  // Label du titre de navigation
  const titreNavigation = useMemo(() => {
    if (view === 'jour') {
      return formatDateLong(currentDate)
    } else {
      const ws = startOfWeek(currentDate)
      const we = addDays(ws, 6)
      return `${formatDateCourte(ws)} — ${formatDateCourte(we)} ${MOIS[ws.getMonth()]} ${ws.getFullYear()}`
    }
  }, [view, currentDate])

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos rendez-vous et votre planning</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#6C63FF] text-white rounded-xl text-sm font-medium hover:bg-[#5B54E6] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau rendez-vous
        </button>
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#6C63FF]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{aujourdhuiRdvs.length}</p>
            <p className="text-xs text-gray-500">RDV aujourd&apos;hui</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{semaineRdvs.length}</p>
            <p className="text-xs text-gray-500">Cette semaine</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{visioAVenir.length}</p>
            <p className="text-xs text-gray-500">Visio à venir</p>
          </div>
        </div>
      </div>

      {/* ── Contrôles : vues + navigation ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Toggles de vue */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {([
            { key: 'jour' as ViewMode, label: "Aujourd'hui" },
            { key: 'semaine' as ViewMode, label: 'Semaine' },
            { key: 'liste' as ViewMode, label: 'Liste' },
          ]).map(v => (
            <button
              key={v.key}
              onClick={() => { setView(v.key); setSelectedRdv(null) }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === v.key
                  ? 'bg-white text-[#6C63FF] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Navigation jour / semaine */}
        <div className="flex items-center gap-2">
          <button
            onClick={allerAujourdhui}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => naviguer(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[180px] text-center capitalize">
            {titreNavigation}
          </span>
          <button
            onClick={() => naviguer(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Contenu principal + sidebar ───────────────────────────────── */}
      <div className="flex gap-4">
        {/* Zone principale */}
        <div className={`flex-1 min-w-0 ${selectedRdv ? 'hidden lg:block' : ''}`}>
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rdvs.length === 0 ? (
            <EmptyState onCreateClick={() => setShowCreateModal(true)} />
          ) : view === 'jour' ? (
            <VueJour
              rdvs={rdvs.filter(r => isSameDay(new Date(r.dateHeure), currentDate))}
              selectedId={selectedRdv?.id}
              onSelect={setSelectedRdv}
            />
          ) : view === 'semaine' ? (
            <VueSemaine
              rdvs={rdvs}
              weekStart={startOfWeek(currentDate)}
              selectedId={selectedRdv?.id}
              onSelect={setSelectedRdv}
            />
          ) : (
            <VueListe
              rdvs={rdvsFiltres}
              filtreStatut={filtreStatut}
              filtreType={filtreType}
              triColonne={triColonne}
              triAsc={triAsc}
              onFiltreStatut={setFiltreStatut}
              onFiltreType={setFiltreType}
              onToggleTri={toggleTri}
              selectedId={selectedRdv?.id}
              onSelect={setSelectedRdv}
            />
          )}
        </div>

        {/* Sidebar détail RDV */}
        {selectedRdv && (
          <DetailSidebar
            rdv={selectedRdv}
            noteText={noteText}
            savingNote={savingNote}
            onNoteChange={setNoteText}
            onSaveNote={sauvegarderNote}
            onCancel={annulerRdv}
            onClose={() => setSelectedRdv(null)}
          />
        )}
      </div>

      {/* ── Modal création rapide ─────────────────────────────────────── */}
      {showCreateModal && (
        <CreateRdvModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchRdvs() }}
        />
      )}
    </div>
  )
}

// ─── Vue Jour (timeline) ─────────────────────────────────────────────────────

function VueJour({
  rdvs,
  selectedId,
  onSelect,
}: {
  rdvs: Rdv[]
  selectedId?: string
  onSelect: (rdv: Rdv) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="relative">
        {HEURES.map(h => (
          <div key={h} className="flex border-b border-gray-100 last:border-b-0" style={{ minHeight: '60px' }}>
            {/* Label heure */}
            <div className="w-16 shrink-0 py-2 pr-3 text-right text-xs text-gray-400 font-medium">
              {h}h00
            </div>
            {/* Zone du créneau */}
            <div className="flex-1 relative border-l border-gray-100 py-1 px-2">
              {rdvs
                .filter(r => new Date(r.dateHeure).getHours() === h)
                .map(rdv => (
                  <button
                    key={rdv.id}
                    onClick={() => onSelect(rdv)}
                    className={`w-full text-left rounded-lg border-l-4 px-3 py-2 mb-1 transition-all hover:shadow-md cursor-pointer ${
                      statutColorBorder(rdv.statut)
                    } ${statutColorBg(rdv.statut)} ${
                      selectedId === rdv.id ? 'ring-2 ring-[#6C63FF]/40 shadow-md' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {formatHeure(rdv.dateHeure)} — {rdv.titre}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${statutBadge(rdv.statut)}`}>
                        {statutLabel(rdv.statut)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{rdv.beneficiaire.prenom}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                        rdv.lieu === 'visio' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {rdv.lieu === 'visio' ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Visio
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Présentiel
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400">{rdv.dureeMinutes} min</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Vue Semaine ─────────────────────────────────────────────────────────────

function VueSemaine({
  rdvs,
  weekStart,
  selectedId,
  onSelect,
}: {
  rdvs: Rdv[]
  weekStart: Date
  selectedId?: string
  onSelect: (rdv: Rdv) => void
}) {
  const days = getWeekDays(weekStart)
  const today = startOfDay(new Date())

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={i}
              className={`text-center py-3 border-r last:border-r-0 border-gray-100 ${
                isToday ? 'bg-[#6C63FF]/5' : ''
              }`}
            >
              <p className="text-[10px] font-medium text-gray-400 uppercase">{JOURS_COURTS[(i + 1) % 7]}</p>
              <p className={`text-sm font-bold mt-0.5 ${
                isToday ? 'text-[#6C63FF]' : 'text-gray-700'
              }`}>
                {day.getDate()}
              </p>
            </div>
          )
        })}
      </div>

      {/* Corps : timeline simplifiée */}
      <div className="grid grid-cols-7 min-h-[500px]">
        {days.map((day, i) => {
          const dayRdvs = rdvs
            .filter(r => isSameDay(new Date(r.dateHeure), day))
            .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
          const isToday = isSameDay(day, today)

          return (
            <div
              key={i}
              className={`border-r last:border-r-0 border-gray-100 p-1.5 space-y-1 ${
                isToday ? 'bg-[#6C63FF]/[0.02]' : ''
              }`}
            >
              {dayRdvs.map(rdv => (
                <button
                  key={rdv.id}
                  onClick={() => onSelect(rdv)}
                  className={`w-full text-left rounded-md p-1.5 border-l-3 transition-all hover:shadow cursor-pointer ${
                    statutColorBorder(rdv.statut)
                  } ${statutColorBg(rdv.statut)} ${
                    selectedId === rdv.id ? 'ring-2 ring-[#6C63FF]/40' : ''
                  }`}
                >
                  <p className="text-[10px] font-bold text-gray-700">{formatHeure(rdv.dateHeure)}</p>
                  <p className="text-[10px] text-gray-500 truncate">{rdv.beneficiaire.prenom}</p>
                </button>
              ))}
              {dayRdvs.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[10px] text-gray-300">—</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Vue Liste (tableau) ─────────────────────────────────────────────────────

function VueListe({
  rdvs,
  filtreStatut,
  filtreType,
  triColonne,
  triAsc,
  onFiltreStatut,
  onFiltreType,
  onToggleTri,
  selectedId,
  onSelect,
}: {
  rdvs: Rdv[]
  filtreStatut: string
  filtreType: string
  triColonne: string
  triAsc: boolean
  onFiltreStatut: (v: string) => void
  onFiltreType: (v: string) => void
  onToggleTri: (col: string) => void
  selectedId?: string
  onSelect: (rdv: Rdv) => void
}) {
  const SortIcon = ({ col }: { col: string }) => (
    <svg className={`w-3 h-3 inline ml-1 ${triColonne === col ? 'text-[#6C63FF]' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {triColonne === col && !triAsc ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      )}
    </svg>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filtres */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Statut :</label>
          <select
            value={filtreStatut}
            onChange={e => onFiltreStatut(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
          >
            <option value="tous">Tous</option>
            <option value="confirme">Confirmé</option>
            <option value="en_attente">En attente</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Type :</label>
          <select
            value={filtreType}
            onChange={e => onFiltreType(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
          >
            <option value="tous">Tous</option>
            <option value="visio">Visio</option>
            <option value="presentiel">Présentiel</option>
          </select>
        </div>
        <span className="text-xs text-gray-400 ml-auto">{rdvs.length} résultat{rdvs.length > 1 ? 's' : ''}</span>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => onToggleTri('dateHeure')}>
                Date / Heure <SortIcon col="dateHeure" />
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => onToggleTri('titre')}>
                Titre <SortIcon col="titre" />
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => onToggleTri('beneficiaire')}>
                Bénéficiaire <SortIcon col="beneficiaire" />
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Type</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => onToggleTri('statut')}>
                Statut <SortIcon col="statut" />
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rdvs.map(rdv => {
              const dt = new Date(rdv.dateHeure)
              return (
                <tr
                  key={rdv.id}
                  onClick={() => onSelect(rdv)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedId === rdv.id ? 'bg-[#6C63FF]/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-900">{formatDateCourte(dt)}</p>
                    <p className="text-[10px] text-gray-500">{formatHeure(rdv.dateHeure)} — {rdv.dureeMinutes} min</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 font-medium">{rdv.titre}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-700">{rdv.beneficiaire.prenom}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({rdv.beneficiaire.age} ans)</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      rdv.lieu === 'visio' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {rdv.lieu === 'visio' ? 'Visio' : 'Présentiel'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ${statutBadge(rdv.statut)}`}>
                      {statutLabel(rdv.statut)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={e => { e.stopPropagation(); onSelect(rdv) }}
                      className="text-xs text-[#6C63FF] hover:underline font-medium"
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-[#6C63FF]/10 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Aucun rendez-vous</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        Votre agenda est libre pour cette période. Planifiez un nouveau rendez-vous pour commencer.
      </p>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#6C63FF] text-white rounded-xl text-sm font-medium hover:bg-[#5B54E6] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Créer un rendez-vous
      </button>
    </div>
  )
}

// ─── Sidebar détail RDV ──────────────────────────────────────────────────────

function DetailSidebar({
  rdv,
  noteText,
  savingNote,
  onNoteChange,
  onSaveNote,
  onCancel,
  onClose,
}: {
  rdv: Rdv
  noteText: string
  savingNote: boolean
  onNoteChange: (v: string) => void
  onSaveNote: () => void
  onCancel: (rdv: Rdv) => void
  onClose: () => void
}) {
  return (
    <div className="w-full lg:w-[380px] shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden self-start sticky top-4">
      {/* Header sidebar */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Détails du rendez-vous</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Titre + statut */}
        <div>
          <h4 className="text-base font-bold text-gray-900">{rdv.titre}</h4>
          <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full mt-2 ${statutBadge(rdv.statut)}`}>
            {statutLabel(rdv.statut)}
          </span>
        </div>

        {/* Infos date/heure */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700 capitalize">
                {formatDateLong(new Date(rdv.dateHeure))}
              </p>
              <p className="text-xs text-gray-500">
                {formatHeure(rdv.dateHeure)} — {rdv.dureeMinutes} minutes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              rdv.lieu === 'visio' ? 'bg-blue-50' : 'bg-green-50'
            }`}>
              {rdv.lieu === 'visio' ? (
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              ) : (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </div>
            <p className="text-xs text-gray-700">
              {rdv.lieu === 'visio' ? 'Visioconférence' : 'En présentiel'}
            </p>
          </div>
        </div>

        {/* Bénéficiaire */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Bénéficiaire</p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] flex items-center justify-center text-xs font-bold">
              {rdv.beneficiaire.prenom[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{rdv.beneficiaire.prenom}</p>
              <p className="text-[10px] text-gray-500">{rdv.beneficiaire.age} ans</p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-2">
          {rdv.lieu === 'visio' && rdv.lienVisio && rdv.statut !== 'annule' && (
            <a
              href={rdv.lienVisio}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#6C63FF] text-white rounded-lg text-sm font-medium hover:bg-[#5B54E6] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Lancer la visio
            </a>
          )}

          <div className="grid grid-cols-2 gap-2">
            <a
              href={generateGoogleCalUrl(rdv)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.675 3 3 3.675 3 4.5v15c0 .825.675 1.5 1.5 1.5h15c.825 0 1.5-.675 1.5-1.5v-15c0-.825-.675-1.5-1.5-1.5zm0 16.5h-15V8.25h15v11.25z" /></svg>
              Google Agenda
            </a>
            <a
              href={generateIcsUrl(rdv)}
              download={`rdv-${rdv.id}.ics`}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Télécharger .ics
            </a>
          </div>

          {rdv.statut !== 'annule' && (
            <button
              onClick={() => onCancel(rdv)}
              className="w-full px-4 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Annuler le rendez-vous
            </button>
          )}
        </div>

        {/* Note rapide */}
        <div>
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide block mb-1.5">
            Note rapide
          </label>
          <textarea
            value={noteText}
            onChange={e => onNoteChange(e.target.value)}
            rows={3}
            placeholder="Ajouter une note sur ce rendez-vous..."
            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#6C63FF] resize-none text-gray-700 placeholder:text-gray-300"
          />
          <button
            onClick={onSaveNote}
            disabled={savingNote}
            className="mt-1.5 text-xs font-medium text-[#6C63FF] hover:underline disabled:opacity-50"
          >
            {savingNote ? 'Enregistrement...' : 'Enregistrer la note'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de création rapide ────────────────────────────────────────────────

function CreateRdvModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    titre: '',
    date: new Date().toISOString().slice(0, 10),
    heure: '09:00',
    duree: '30',
    lieu: 'visio' as 'visio' | 'presentiel',
    description: '',
    beneficiaireId: '',
  })
  const [beneficiaires, setBeneficiaires] = useState<BeneficiaireOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingBenef, setLoadingBenef] = useState(true)

  // Charger les bénéficiaires actifs
  useEffect(() => {
    fetch('/api/conseiller/rdv/beneficiaires')
      .then(r => r.ok ? r.json() : { beneficiaires: [] })
      .then(d => setBeneficiaires(d.beneficiaires || []))
      .catch(() => {})
      .finally(() => setLoadingBenef(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titre || !form.date || !form.heure) return

    setSubmitting(true)
    try {
      const dateHeure = new Date(`${form.date}T${form.heure}:00`).toISOString()
      const res = await fetch('/api/conseiller/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: form.titre,
          dateHeure,
          dureeMinutes: parseInt(form.duree),
          lieu: form.lieu,
          description: form.description,
          beneficiaireId: form.beneficiaireId || undefined,
        }),
      })
      if (res.ok) {
        onCreated()
      }
    } catch (err) {
      console.error('Erreur création RDV:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Nouveau rendez-vous</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Titre */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Titre *</label>
            <input
              type="text"
              value={form.titre}
              onChange={e => updateForm('titre', e.target.value)}
              placeholder="Ex : Point d'étape orientation"
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] text-gray-700 placeholder:text-gray-300"
            />
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => updateForm('date', e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] text-gray-700"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Heure *</label>
              <input
                type="time"
                value={form.heure}
                onChange={e => updateForm('heure', e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] text-gray-700"
              />
            </div>
          </div>

          {/* Durée + Lieu */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Durée</label>
              <select
                value={form.duree}
                onChange={e => updateForm('duree', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] text-gray-700 bg-white"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 heure</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Lieu</label>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => updateForm('lieu', 'visio')}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                    form.lieu === 'visio'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Visio
                </button>
                <button
                  type="button"
                  onClick={() => updateForm('lieu', 'presentiel')}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                    form.lieu === 'presentiel'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Présentiel
                </button>
              </div>
            </div>
          </div>

          {/* Bénéficiaire */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Bénéficiaire</label>
            <select
              value={form.beneficiaireId}
              onChange={e => updateForm('beneficiaireId', e.target.value)}
              disabled={loadingBenef}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] text-gray-700 bg-white disabled:opacity-50"
            >
              <option value="">
                {loadingBenef ? 'Chargement...' : '— Sélectionner un bénéficiaire —'}
              </option>
              {beneficiaires.map(b => (
                <option key={b.id} value={b.id}>{b.prenom} {b.nom}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => updateForm('description', e.target.value)}
              rows={2}
              placeholder="Notes ou détails complémentaires..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] text-gray-700 placeholder:text-gray-300 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !form.titre}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#6C63FF] rounded-xl hover:bg-[#5B54E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Création...' : 'Créer le RDV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
