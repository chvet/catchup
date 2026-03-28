'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import OnlineDot from '@/components/OnlineDot'

interface ReferralItem {
  id: string
  prenom: string | null
  age: number | null
  genre: string | null
  localisation: string | null
  priorite: string
  niveauDetection: number
  statut: string
  motif: string | null
  moyenContact: string | null
  creeLe: string
  r: number | null
  i: number | null
  a: number | null
  s: number | null
  e: number | null
  c: number | null
  dimensionsDominantes: string | null
  priseEnCharge: {
    id: string
    statut: string
    conseillerId: string
    premiereActionLe: string | null
  } | null
  attente: {
    heures: number
    label: string
  }
  derniereActivite?: string | null
  // Double file active fields
  matchScore?: number | null
  horsChamp?: boolean | null
  raisonsHorsChamp?: string[] | null
  raisonsMatch?: string[] | null
  source?: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface StructureOption {
  id: string
  nom: string
  type: string
}

type SortColumn = 'urgence' | 'prenom' | 'age' | 'dateDemande' | 'attente' | 'statut' | 'localisation' | 'derniereActivite' | 'matchScore'
type SortDirection = 'asc' | 'desc'

interface SortState {
  column: SortColumn
  direction: SortDirection
}

type TabId = 'mes_demandes' | 'generique' | 'mes_accompagnements'

const URGENCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  normale: { bg: 'bg-green-100', text: 'text-green-800', label: 'Normale' },
  haute: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Haute' },
  critique: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critique' },
}

const STATUT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
  nouvelle: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Nouvelle' },
  prise_en_charge: { bg: 'bg-green-100', text: 'text-green-800', label: 'Prise en charge' },
  terminee: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Terminee' },
  recontacte: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Recontacte' },
  abandonnee: { bg: 'bg-red-50', text: 'text-red-600', label: 'Abandonnee' },
  echoue: { bg: 'bg-red-50', text: 'text-red-600', label: 'Echouee' },
  rupture: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rupture' },
}

const URGENCE_ORDER: Record<string, number> = {
  critique: 3,
  haute: 2,
  normale: 1,
}

function getTopDimensions(item: ReferralItem): string {
  if (item.dimensionsDominantes) {
    try {
      const dims = JSON.parse(item.dimensionsDominantes)
      return dims.slice(0, 2).join('-')
    } catch { /* */ }
  }
  const scores = [
    { k: 'R', v: item.r || 0 },
    { k: 'I', v: item.i || 0 },
    { k: 'A', v: item.a || 0 },
    { k: 'S', v: item.s || 0 },
    { k: 'E', v: item.e || 0 },
    { k: 'C', v: item.c || 0 },
  ].sort((a, b) => b.v - a.v)
  return scores.slice(0, 2).map(s => s.k).join('-')
}

function formatDateFr(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month} ${hours}h${minutes}`
  } catch {
    return '\u2014'
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const now = new Date()
    const d = new Date(dateStr)
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return "A l'instant"
    if (diffMin < 60) return `Il y a ${diffMin}min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `Il y a ${diffH}h`
    const diffD = Math.floor(diffH / 24)
    return `Il y a ${diffD}j`
  } catch {
    return '\u2014'
  }
}

// --- Toast notification ---
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up">
      <span>\u2705</span>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">\u2715</button>
    </div>
  )
}

// --- Transfer modal ---
function TransferModal({
  referral,
  onClose,
  onConfirm,
}: {
  referral: ReferralItem
  onClose: () => void
  onConfirm: (structureId: string, motif: string) => void
}) {
  const [structures, setStructures] = useState<StructureOption[]>([])
  const [loadingStructures, setLoadingStructures] = useState(true)
  const [selectedStructureId, setSelectedStructureId] = useState('')
  const [motif, setMotif] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchStructures() {
      try {
        const res = await fetch(`/api/conseiller/file-active/${referral.id}/transfer`)
        const data = await res.json()
        setStructures(data.structures || data || [])
      } catch (err) {
        console.error('Erreur chargement structures:', err)
      }
      setLoadingStructures(false)
    }
    fetchStructures()
  }, [referral.id])

  const handleSubmit = async () => {
    if (!selectedStructureId || !motif.trim()) return
    setSubmitting(true)
    onConfirm(selectedStructureId, motif.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Transferer {referral.prenom || 'Anonyme'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transferer vers :</label>
            {loadingStructures ? (
              <div className="text-sm text-gray-400">Chargement des structures...</div>
            ) : (
              <select
                value={selectedStructureId}
                onChange={e => setSelectedStructureId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              >
                <option value="">Selectionnez une structure</option>
                {structures.map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif :</label>
            <input
              type="text"
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Raison du transfert..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedStructureId || !motif.trim() || submitting}
            className="px-4 py-2 text-sm text-white bg-catchup-primary rounded-lg hover:bg-catchup-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Transfert...' : 'Transferer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Compatibility badge for "Ma structure" sub-tab ---
function CompatibilityBadge({ item }: { item: ReferralItem }) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (item.horsChamp) {
    return (
      <span
        className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {'⚠️'} Hors champ
        {showTooltip && item.raisonsHorsChamp && item.raisonsHorsChamp.length > 0 && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-50">
            <span className="font-semibold block mb-1">Raisons :</span>
            <ul className="list-disc pl-3 space-y-0.5">
              {item.raisonsHorsChamp.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
          </span>
        )}
      </span>
    )
  }

  if (item.matchScore != null && item.matchScore >= 70) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        {'✅'} Compatible
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      \u2014
    </span>
  )
}

// --- Compatibility score for "File generique" sub-tab ---
function CompatibilityScore({ item }: { item: ReferralItem }) {
  if (item.horsChamp || (item.matchScore != null && item.matchScore < 30)) {
    return (
      <span className="text-sm font-medium text-red-600">
        {'❌'} Hors champ
      </span>
    )
  }

  if (item.matchScore == null) {
    return <span className="text-sm text-gray-400">\u2014</span>
  }

  if (item.matchScore >= 70) {
    return (
      <span className="text-sm font-medium text-green-600">
        {'✅'} {item.matchScore}%
      </span>
    )
  }

  return (
    <span className="text-sm font-medium text-orange-600">
      {'⚠️'} {item.matchScore}%
    </span>
  )
}

export default function FileActivePage() {
  const conseiller = useConseiller()
  const searchParams = useSearchParams()
  const [allReferrals, setAllReferrals] = useState<ReferralItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 200, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'attente' || params.get('tab') === 'mes_demandes') return 'mes_demandes'
      if (params.get('tab') === 'generique') return 'generique'
      if (params.get('tab') === 'accompagnements') return 'mes_accompagnements'
    }
    return 'mes_accompagnements'
  })
  const [filters, setFilters] = useState({
    statut: '',
    urgence: '',
  })
  const [advancedFilters, setAdvancedFilters] = useState({
    search: '',
    localisation: '',
    ageMin: '',
    ageMax: '',
    dateFrom: '',
    dateTo: '',
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sort, setSort] = useState<SortState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'generique') return { column: 'matchScore' as SortColumn, direction: 'desc' as const }
      if (params.get('tab') === 'mes_demandes' || params.get('tab') === 'attente') return { column: 'urgence' as SortColumn, direction: 'desc' as const }
    }
    return { column: 'derniereActivite' as SortColumn, direction: 'desc' as const }
  })

  // Double file active state
  const [sourceData, setSourceData] = useState<ReferralItem[]>([])
  const [generiqueData, setGeneriqueData] = useState<ReferralItem[]>([])
  const [sourceLoading, setSourceLoading] = useState(false)
  const [generiqueLoading, setGeneriqueLoading] = useState(false)
  const [sourceFetched, setSourceFetched] = useState(false)
  const [generiqueFetched, setGeneriqueFetched] = useState(false)

  // Transfer state
  const [transferModal, setTransferModal] = useState<ReferralItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const isAdmin = conseiller?.role === 'admin_structure' || conseiller?.role === 'super_admin'

  // Fetch main data (for mes_accompagnements and tous tabs)
  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: '1', limit: '500' })

    try {
      const res = await fetch(`/api/conseiller/file-active?${params}`)
      const data = await res.json()
      setAllReferrals(data.data || [])
      setPagination(data.pagination || { page: 1, limit: 500, total: 0, pages: 0 })
    } catch (err) {
      console.error('Erreur file active:', err)
    }
    setLoading(false)
  }, [])

  // Fetch source (structure) data — lazy
  const fetchSourceData = useCallback(async () => {
    if (sourceFetched) return
    setSourceLoading(true)
    try {
      const params = new URLSearchParams({ source: 'sourcee', statut: 'en_attente', page: '1', limit: '500' })
      const res = await fetch(`/api/conseiller/file-active?${params}`)
      const data = await res.json()
      setSourceData(data.data || [])
      setSourceFetched(true)
    } catch (err) {
      console.error('Erreur file structure:', err)
    }
    setSourceLoading(false)
  }, [sourceFetched])

  // Fetch generique data — lazy
  const fetchGeneriqueData = useCallback(async () => {
    if (generiqueFetched) return
    setGeneriqueLoading(true)
    try {
      const params = new URLSearchParams({ source: 'generique', statut: 'en_attente', page: '1', limit: '500' })
      const res = await fetch(`/api/conseiller/file-active?${params}`)
      const data = await res.json()
      setGeneriqueData(data.data || [])
      setGeneriqueFetched(true)
    } catch (err) {
      console.error('Erreur file generique:', err)
    }
    setGeneriqueLoading(false)
  }, [generiqueFetched])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Charger les deux files au démarrage (pour les compteurs des onglets)
  useEffect(() => {
    fetchSourceData()
    fetchGeneriqueData()
  }, [fetchSourceData, fetchGeneriqueData])

  // Auto-refresh every 30s (silent — no loading spinner)
  useEffect(() => {
    const interval = setInterval(async () => {
      // Silently refresh main data
      try {
        const params = new URLSearchParams({ page: '1', limit: '500' })
        const res = await fetch(`/api/conseiller/file-active?${params}`)
        const data = await res.json()
        setAllReferrals(data.data || [])
        setPagination(data.pagination || { page: 1, limit: 500, total: 0, pages: 0 })
      } catch { /* silent */ }
      // Silently refresh source + generique
      try {
        const res = await fetch(`/api/conseiller/file-active?source=sourcee&statut=en_attente&page=1&limit=500`)
        const data = await res.json()
        setSourceData(data.data || [])
      } catch { /* silent */ }
      try {
        const res = await fetch(`/api/conseiller/file-active?source=generique&statut=en_attente&page=1&limit=500`)
        const data = await res.json()
        setGeneriqueData(data.data || [])
      } catch { /* silent */ }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Tab-level filtering
  const tabFilteredReferrals = useMemo(() => {
    switch (activeTab) {
      case 'mes_demandes':
        return sourceData
      case 'generique':
        return generiqueData
      case 'mes_accompagnements':
        if (!conseiller?.id) return []
        return allReferrals.filter(
          r => r.priseEnCharge?.statut === 'prise_en_charge' && r.priseEnCharge?.conseillerId === conseiller.id
        )
      default:
        return allReferrals
    }
  }, [allReferrals, activeTab, conseiller?.id, sourceData, generiqueData])

  // Counts for badges
  const tabCounts = useMemo(() => {
    const enAttente = sourceData.length + generiqueData.length
    const mesAccompagnements = conseiller?.id
      ? allReferrals.filter(r => r.priseEnCharge?.statut === 'prise_en_charge' && r.priseEnCharge?.conseillerId === conseiller.id).length
      : 0
    const tous = allReferrals.length
    return { enAttente, mesAccompagnements, tous }
  }, [allReferrals, conseiller?.id, sourceData, generiqueData])

  const handleSort = (column: SortColumn) => {
    setSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortArrow = (column: SortColumn) => {
    if (sort.column !== column) return null
    return <span className="ml-1 text-catchup-primary">{sort.direction === 'asc' ? '\u25B2' : '\u25BC'}</span>
  }

  // Client-side filtering (within the tab) and sorting
  const processedReferrals = useMemo(() => {
    let filtered = [...tabFilteredReferrals]

    // Apply statut filter only on "tous" tab
    if (false /* onglet tous supprimé */ && filters.statut) {
      filtered = filtered.filter(r => r.statut === filters.statut)
    }

    // Apply urgence filter on all tabs
    if (filters.urgence) {
      filtered = filtered.filter(r => r.priorite === filters.urgence)
    }

    // Advanced filters
    const { search, localisation, ageMin, ageMax, dateFrom, dateTo } = advancedFilters

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(r =>
        (r.prenom || '').toLowerCase().includes(q) ||
        (r.motif || '').toLowerCase().includes(q) ||
        (r.localisation || '').toLowerCase().includes(q) ||
        (r.moyenContact || '').toLowerCase().includes(q) ||
        (r.genre || '').toLowerCase().includes(q) ||
        (r.statut || '').toLowerCase().includes(q) ||
        String(r.age || '').includes(q)
      )
    }

    if (localisation.trim()) {
      const q = localisation.trim().toLowerCase()
      filtered = filtered.filter(r => (r.localisation || '').toLowerCase().includes(q))
    }

    if (ageMin) {
      const min = parseInt(ageMin, 10)
      if (!isNaN(min)) filtered = filtered.filter(r => r.age !== null && r.age >= min)
    }

    if (ageMax) {
      const max = parseInt(ageMax, 10)
      if (!isNaN(max)) filtered = filtered.filter(r => r.age !== null && r.age <= max)
    }

    if (dateFrom) {
      const from = new Date(dateFrom)
      filtered = filtered.filter(r => new Date(r.creeLe) >= from)
    }

    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      filtered = filtered.filter(r => new Date(r.creeLe) <= to)
    }

    // Sorting
    const { column, direction } = sort
    const mult = direction === 'asc' ? 1 : -1

    filtered.sort((a, b) => {
      let cmp = 0
      switch (column) {
        case 'urgence':
          cmp = (URGENCE_ORDER[a.priorite] || 0) - (URGENCE_ORDER[b.priorite] || 0)
          if (cmp === 0) cmp = new Date(a.creeLe).getTime() - new Date(b.creeLe).getTime()
          return mult * cmp
        case 'prenom':
          return mult * (a.prenom || '').localeCompare(b.prenom || '', 'fr')
        case 'age':
          return mult * ((a.age || 0) - (b.age || 0))
        case 'dateDemande':
          cmp = new Date(a.creeLe).getTime() - new Date(b.creeLe).getTime()
          if (cmp === 0) cmp = (URGENCE_ORDER[b.priorite] || 0) - (URGENCE_ORDER[a.priorite] || 0)
          return mult * cmp
        case 'attente':
          return mult * (a.attente.heures - b.attente.heures)
        case 'statut':
          return mult * a.statut.localeCompare(b.statut, 'fr')
        case 'localisation':
          return mult * (a.localisation || '').localeCompare(b.localisation || '', 'fr')
        case 'derniereActivite': {
          const aDate = a.derniereActivite ? new Date(a.derniereActivite).getTime() : 0
          const bDate = b.derniereActivite ? new Date(b.derniereActivite).getTime() : 0
          return mult * (aDate - bDate)
        }
        case 'matchScore':
          return mult * ((a.matchScore || 0) - (b.matchScore || 0))
        default:
          return 0
      }
    })

    return filtered
  }, [tabFilteredReferrals, filters, advancedFilters, sort, activeTab])

  // Pagination on processed results
  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(1)

  // Reset page when tab, sub-tab, or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, filters, advancedFilters])

  const totalPages = Math.ceil(processedReferrals.length / PAGE_SIZE)
  const paginatedReferrals = processedReferrals.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const hasAdvancedFilters = advancedFilters.search || advancedFilters.localisation ||
    advancedFilters.ageMin || advancedFilters.ageMax || advancedFilters.dateFrom || advancedFilters.dateTo

  const clearAdvancedFilters = () => {
    setAdvancedFilters({ search: '', localisation: '', ageMin: '', ageMax: '', dateFrom: '', dateTo: '' })
  }

  // Online status for all referral IDs in the current page
  const pageReferralIds = useMemo(() => paginatedReferrals.map(r => r.id), [paginatedReferrals])
  const onlineStatuses = useOnlineStatus(pageReferralIds)

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-700 transition-colors'

  const structureNom = conseiller?.structure?.nom || 'Ma structure'
  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'mes_accompagnements', label: 'Mes accompagnements', count: tabCounts.mesAccompagnements },
    { id: 'mes_demandes', label: `Demandes ${structureNom}`, count: sourceData.length },
    { id: 'generique', label: 'Toutes structures', count: generiqueData.length },
  ]

  const visibleTabs = tabs

  // When switching tabs, reset statut filter
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId)
    setFilters(f => ({ ...f, statut: '' }))
    if (tabId === 'generique') {
      setSort({ column: 'matchScore', direction: 'desc' })
    } else if (tabId === 'mes_demandes') {
      setSort({ column: 'urgence', direction: 'desc' })
    } else if (tabId === 'mes_accompagnements') {
      setSort({ column: 'derniereActivite', direction: 'desc' })
    } else {
      setSort({ column: 'dateDemande', direction: 'desc' })
    }
  }

  const showStatutFilter = false /* onglet tous supprimé */
  const showDerniereActiviteColumn = activeTab === 'mes_accompagnements'
  const showCompatibilityColumn = activeTab === 'generique'
  const showCompatibilityBadge = activeTab === 'mes_demandes'
  const showTransferActions = activeTab === 'mes_demandes' || activeTab === 'generique'

  // --- Transfer handlers ---
  const handleTransferGenerique = async (item: ReferralItem) => {
    const confirmed = window.confirm(`Transferer ${item.prenom || 'Anonyme'} vers la file generique ?`)
    if (!confirmed) return

    try {
      const res = await fetch(`/api/conseiller/file-active/${item.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: 'generique', motif: 'Hors criteres de la structure' }),
      })
      if (res.ok) {
        setSourceData(prev => prev.filter(r => r.id !== item.id))
        setToast(`${item.prenom || 'Anonyme'} transfere(e) vers la file generique`)
      } else {
        setToast('Erreur lors du transfert')
      }
    } catch {
      setToast('Erreur lors du transfert')
    }
  }

  const handleTransferStructure = (item: ReferralItem) => {
    setTransferModal(item)
  }

  const handleTransferStructureConfirm = async (structureId: string, motif: string) => {
    if (!transferModal) return

    try {
      const res = await fetch(`/api/conseiller/file-active/${transferModal.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: 'structure', structureId, motif }),
      })
      if (res.ok) {
        // Remove from whichever list it's in
        setSourceData(prev => prev.filter(r => r.id !== transferModal.id))
        setGeneriqueData(prev => prev.filter(r => r.id !== transferModal.id))
        setToast(`${transferModal.prenom || 'Anonyme'} transfere(e) vers la structure`)
      } else {
        setToast('Erreur lors du transfert')
      }
    } catch {
      setToast('Erreur lors du transfert')
    }
    setTransferModal(null)
  }

  const handlePrendreEnCharge = async (item: ReferralItem) => {
    try {
      const res = await fetch(`/api/conseiller/file-active/${item.id}/prendre-en-charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setGeneriqueData(prev => prev.filter(r => r.id !== item.id))
        setToast(`${item.prenom || 'Anonyme'} pris(e) en charge`)
        fetchData() // Refresh main data so "Mes accompagnements" updates
      } else {
        setToast('Erreur lors de la prise en charge')
      }
    } catch {
      setToast('Erreur lors de la prise en charge')
    }
  }

  const isTabDataLoading = (activeTab === 'mes_demandes' && sourceLoading) || (activeTab === 'generique' && generiqueLoading)
  const isPageLoading = (activeTab === 'mes_demandes' || activeTab === 'generique') ? isTabDataLoading : loading

  return (
    <div>
      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Transfer modal */}
      {transferModal && (
        <TransferModal
          referral={transferModal}
          onClose={() => setTransferModal(null)}
          onConfirm={handleTransferStructureConfirm}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">File active</h1>
          <p className="text-gray-500 text-sm">
            {processedReferrals.length !== tabFilteredReferrals.length
              ? `${processedReferrals.length} filtree(s) / ${tabFilteredReferrals.length} dans cet onglet`
              : `${tabFilteredReferrals.length} demande(s)`
            }
          </p>
        </div>
      </div>

      {/* Sticky tab bar */}
      <div className="sticky top-0 z-20 bg-gray-50 -mx-3 px-3 md:-mx-6 md:px-6 border-b border-gray-200">
        <div className="flex gap-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap
                  ${isActive
                    ? 'text-catchup-primary border-b-2 border-catchup-primary'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className={isActive ? 'font-bold' : ''}>{tab.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold
                    ${isActive
                      ? 'bg-catchup-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search bar — full text, always visible */}
      <div className="mt-3 mb-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par prenom, motif, departement, contact..."
            value={advancedFilters.search}
            onChange={e => setAdvancedFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-catchup-primary focus:border-transparent bg-white"
          />
          {advancedFilters.search && (
            <button
              onClick={() => setAdvancedFilters(f => ({ ...f, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4 overflow-x-auto">
        <div className="flex gap-2 md:gap-3 items-center">
          <select
            value={filters.urgence}
            onChange={e => setFilters(f => ({ ...f, urgence: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
          >
            <option value="">Toutes urgences</option>
            <option value="normale">Normale</option>
            <option value="haute">Haute</option>
            <option value="critique">Critique</option>
          </select>

          {isAdmin && (
            <button
              onClick={() => {
                const from = advancedFilters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                const to = advancedFilters.dateTo || new Date().toISOString().split('T')[0]
                window.open(`/api/conseiller/export?format=xlsx&type=beneficiaires&from=${from}&to=${to}`, '_blank')
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <span>{'\ud83d\udce5'}</span> Exporter
            </button>
          )}

          {showStatutFilter && (
            <select
              value={filters.statut}
              onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
            >
              <option value="">Tous statuts</option>
              <option value="nouvelle">Nouvelle</option>
              <option value="en_attente">En attente</option>
              <option value="prise_en_charge">Prise en charge</option>
              <option value="rupture">Rupture</option>
              <option value="terminee">Terminee</option>
              <option value="abandonnee">Abandonnee</option>
            </select>
          )}

          <button
            onClick={() => setShowAdvanced(v => !v)}
            className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
              showAdvanced || hasAdvancedFilters
                ? 'border-catchup-primary bg-catchup-primary/5 text-catchup-primary'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Filtres avances {hasAdvancedFilters ? '\u25CF' : ''}
          </button>
        </div>
      </div>

      {/* Advanced filters bar */}
      {showAdvanced && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Recherche prenom</label>
              <input
                type="text"
                placeholder="Prenom..."
                value={advancedFilters.search}
                onChange={e => setAdvancedFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Localisation</label>
              <input
                type="text"
                placeholder="Departement..."
                value={advancedFilters.localisation}
                onChange={e => setAdvancedFilters(f => ({ ...f, localisation: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Age min</label>
                <input
                  type="number"
                  placeholder="16"
                  min="0"
                  max="99"
                  value={advancedFilters.ageMin}
                  onChange={e => setAdvancedFilters(f => ({ ...f, ageMin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Age max</label>
                <input
                  type="number"
                  placeholder="30"
                  min="0"
                  max="99"
                  value={advancedFilters.ageMax}
                  onChange={e => setAdvancedFilters(f => ({ ...f, ageMax: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date du</label>
              <input
                type="date"
                value={advancedFilters.dateFrom}
                onChange={e => setAdvancedFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date au</label>
              <input
                type="date"
                value={advancedFilters.dateTo}
                onChange={e => setAdvancedFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearAdvancedFilters}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Effacer filtres
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isPageLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tabFilteredReferrals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-4">{activeTab === 'mes_accompagnements' ? '\uD83D\uDCCB' : '\uD83D\uDCED'}</p>
          <p className="text-gray-500 text-lg">
            {activeTab === 'mes_demandes' && 'Aucune demande pour votre structure'}
            {activeTab === 'generique' && 'Aucune demande dans la file générique'}
            {activeTab === 'mes_accompagnements' && 'Aucun accompagnement en cours'}
            {false /* onglet tous supprimé */ && 'Aucune demande dans la file active'}
          </p>
          <p className="text-gray-400 text-sm mt-1">Les nouvelles demandes apparaitront ici automatiquement</p>
        </div>
      ) : processedReferrals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-4">{'\uD83D\uDD0D'}</p>
          <p className="text-gray-500 text-lg">Aucun resultat pour ces filtres</p>
          <button
            onClick={clearAdvancedFilters}
            className="mt-3 text-sm text-catchup-primary hover:underline"
          >
            Effacer les filtres avances
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className={thClass} onClick={() => handleSort('urgence')}>
                    Urgence{sortArrow('urgence')}
                  </th>
                  <th className={thClass} onClick={() => handleSort('prenom')}>
                    Beneficiaire{sortArrow('prenom')}
                  </th>
                  <th className={thClass} onClick={() => handleSort('age')}>
                    Age{sortArrow('age')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    RIASEC
                  </th>
                  <th className={thClass} onClick={() => handleSort('dateDemande')}>
                    Date demande{sortArrow('dateDemande')}
                  </th>
                  <th className={thClass} onClick={() => handleSort('localisation')}>
                    Localisation{sortArrow('localisation')}
                  </th>
                  <th className={thClass} onClick={() => handleSort('attente')}>
                    Attente{sortArrow('attente')}
                  </th>
                  <th className={thClass} onClick={() => handleSort('statut')}>
                    Statut{sortArrow('statut')}
                  </th>
                  {showDerniereActiviteColumn && (
                    <th className={thClass} onClick={() => handleSort('derniereActivite')}>
                      Derniere activite{sortArrow('derniereActivite')}
                    </th>
                  )}
                  {showCompatibilityBadge && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Compatibilite
                    </th>
                  )}
                  {showCompatibilityColumn && (
                    <th className={thClass} onClick={() => handleSort('matchScore')}>
                      Compatibilite{sortArrow('matchScore')}
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedReferrals.map(r => {
                  const urgStyle = URGENCE_STYLES[r.priorite] || URGENCE_STYLES.normale
                  const statStyle = STATUT_STYLES[r.statut] || STATUT_STYLES.en_attente
                  const isCompatible = !r.horsChamp && (r.matchScore != null && r.matchScore >= 30)

                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors
                        ${r.priorite === 'critique' ? 'bg-red-50/30' : ''}
                        ${r.attente.heures > 48 && r.statut !== 'terminee' ? 'bg-orange-50/30' : ''}
                      `}
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${urgStyle.bg} ${urgStyle.text}`}>
                          {r.priorite === 'critique' ? '\uD83D\uDD34' : r.priorite === 'haute' ? '\uD83D\uDFE0' : '\uD83D\uDFE2'} {urgStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {onlineStatuses[r.id]?.online && <OnlineDot online={true} />}
                          <p className="font-medium text-gray-800">{r.prenom || 'Anonyme'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.age ? `${r.age} ans` : '\u2014'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-catchup-primary/10 text-catchup-primary text-xs font-mono font-medium">
                          {getTopDimensions(r)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDateFr(r.creeLe)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.localisation ? `\uD83D\uDCCD ${r.localisation}` : '\u2014'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          r.attente.heures > 48 ? 'text-red-600' :
                          r.attente.heures > 24 ? 'text-orange-600' :
                          'text-gray-600'
                        }`}>
                          {r.attente.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statStyle.bg} ${statStyle.text}`}>
                          {statStyle.label}
                        </span>
                      </td>
                      {showDerniereActiviteColumn && (
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {r.derniereActivite ? formatRelativeTime(r.derniereActivite) : formatRelativeTime(r.creeLe)}
                        </td>
                      )}
                      {/* Compatibility badge for "Ma structure" */}
                      {showCompatibilityBadge && (
                        <td className="px-4 py-3">
                          <CompatibilityBadge item={r} />
                        </td>
                      )}
                      {/* Compatibility score for "File generique" */}
                      {showCompatibilityColumn && (
                        <td className="px-4 py-3">
                          <CompatibilityScore item={r} />
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Transfer buttons for "Ma structure" sub-tab */}
                          {showTransferActions && activeTab === 'mes_demandes' && (
                            <>
                              <button
                                onClick={() => handleTransferGenerique(r)}
                                className="inline-flex items-center px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                title="Transferer vers la file generique"
                              >
                                {'→'} Générique
                              </button>
                              <button
                                onClick={() => handleTransferStructure(r)}
                                className="inline-flex items-center px-2 py-1 text-xs text-white bg-catchup-primary rounded hover:bg-catchup-primary/90 transition-colors"
                                title="Transferer vers une autre structure"
                              >
                                {'→'} Structure
                              </button>
                            </>
                          )}
                          {/* "Prendre en charge" button for "File generique" sub-tab */}
                          {showTransferActions && activeTab === 'generique' && isCompatible && (
                            <button
                              onClick={() => handlePrendreEnCharge(r)}
                              className="inline-flex items-center px-2.5 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                            >
                              Prendre en charge
                            </button>
                          )}
                          <Link
                            href={`/conseiller/file-active/${r.id}`}
                            className="inline-flex items-center px-3 py-1.5 bg-catchup-primary text-white text-sm rounded-lg hover:bg-catchup-primary/90 transition-colors"
                          >
                            Voir
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages} ({processedReferrals.length} resultats)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Precedent
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
