'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'

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
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

type SortColumn = 'urgence' | 'prenom' | 'age' | 'dateDemande' | 'attente' | 'statut' | 'localisation'
type SortDirection = 'asc' | 'desc'

interface SortState {
  column: SortColumn
  direction: SortDirection
}

const URGENCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  normale: { bg: 'bg-green-100', text: 'text-green-800', label: 'Normale' },
  haute: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Haute' },
  critique: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critique' },
}

const STATUT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
  nouvelle: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Nouvelle' },
  prise_en_charge: { bg: 'bg-green-100', text: 'text-green-800', label: 'Prise en charge' },
  terminee: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Terminée' },
  recontacte: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Recontacté' },
  abandonnee: { bg: 'bg-red-50', text: 'text-red-600', label: 'Abandonnée' },
  echoue: { bg: 'bg-red-50', text: 'text-red-600', label: 'Échouée' },
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
  // Fallback : calculer depuis les scores
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
    return '—'
  }
}

export default function FileActivePage() {
  const [referrals, setReferrals] = useState<ReferralItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
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
  const [sort, setSort] = useState<SortState>({ column: 'urgence', direction: 'desc' })
  const [scope, setScope] = useState<'default' | 'structure'>('default')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20', scope })
    if (filters.statut) params.set('statut', filters.statut)
    if (filters.urgence) params.set('urgence', filters.urgence)

    try {
      const res = await fetch(`/api/conseiller/file-active?${params}`)
      const data = await res.json()
      setReferrals(data.data || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
    } catch (err) {
      console.error('Erreur file active:', err)
    }
    setLoading(false)
  }, [filters, scope])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh toutes les 30s
  useEffect(() => {
    const interval = setInterval(() => fetchData(pagination.page), 30000)
    return () => clearInterval(interval)
  }, [fetchData, pagination.page])

  const handleSort = (column: SortColumn) => {
    setSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortArrow = (column: SortColumn) => {
    if (sort.column !== column) return null
    return <span className="ml-1 text-catchup-primary">{sort.direction === 'asc' ? '▲' : '▼'}</span>
  }

  // Client-side filtering and sorting
  const processedReferrals = useMemo(() => {
    let filtered = [...referrals]

    // Advanced filters
    const { search, localisation, ageMin, ageMax, dateFrom, dateTo } = advancedFilters

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(r => (r.prenom || '').toLowerCase().includes(q))
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
          // Tri secondaire par date (les plus anciens d'abord à urgence égale)
          if (cmp === 0) cmp = new Date(a.creeLe).getTime() - new Date(b.creeLe).getTime()
          return mult * cmp
        case 'prenom':
          return mult * (a.prenom || '').localeCompare(b.prenom || '', 'fr')
        case 'age':
          return mult * ((a.age || 0) - (b.age || 0))
        case 'dateDemande':
          cmp = new Date(a.creeLe).getTime() - new Date(b.creeLe).getTime()
          // Tri secondaire par urgence (les plus urgents d'abord à date égale)
          if (cmp === 0) cmp = (URGENCE_ORDER[b.priorite] || 0) - (URGENCE_ORDER[a.priorite] || 0)
          return mult * cmp
        case 'attente':
          return mult * (a.attente.heures - b.attente.heures)
        case 'statut':
          return mult * a.statut.localeCompare(b.statut, 'fr')
        case 'localisation':
          return mult * (a.localisation || '').localeCompare(b.localisation || '', 'fr')
        default:
          return 0
      }
    })

    return filtered
  }, [referrals, advancedFilters, sort])

  const hasAdvancedFilters = advancedFilters.search || advancedFilters.localisation ||
    advancedFilters.ageMin || advancedFilters.ageMax || advancedFilters.dateFrom || advancedFilters.dateTo

  const clearAdvancedFilters = () => {
    setAdvancedFilters({ search: '', localisation: '', ageMin: '', ageMax: '', dateFrom: '', dateTo: '' })
  }

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-700 transition-colors'

  return (
    <div>
      {/* Header + top-level filters */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">File active</h1>
          <p className="text-gray-500 text-sm">
            {processedReferrals.length !== pagination.total
              ? `${processedReferrals.length} affichée(s) / ${pagination.total} demande(s)`
              : `${pagination.total} demande(s)`
            }
          </p>
        </div>

        <div className="flex gap-3 items-center">
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

          <select
            value={filters.statut}
            onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
          >
            <option value="">Tous statuts</option>
            <option value="nouvelle">Nouvelle</option>
            <option value="en_attente">En attente</option>
            <option value="prise_en_charge">Prise en charge</option>
            <option value="terminee">Terminée</option>
            <option value="abandonnee">Abandonnée</option>
          </select>

          {/* Scope : mes cas / ma structure */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setScope('default')}
              className={`px-3 py-2 text-sm transition-colors ${
                scope === 'default'
                  ? 'bg-catchup-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tous + mes cas
            </button>
            <button
              onClick={() => setScope('structure')}
              className={`px-3 py-2 text-sm border-l border-gray-300 transition-colors ${
                scope === 'structure'
                  ? 'bg-catchup-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Ma structure
            </button>
          </div>

          <button
            onClick={() => setShowAdvanced(v => !v)}
            className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
              showAdvanced || hasAdvancedFilters
                ? 'border-catchup-primary bg-catchup-primary/5 text-catchup-primary'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Filtres avancés {hasAdvancedFilters ? '●' : ''}
          </button>
        </div>
      </div>

      {/* Advanced filters bar */}
      {showAdvanced && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Recherche prénom</label>
              <input
                type="text"
                placeholder="Prénom..."
                value={advancedFilters.search}
                onChange={e => setAdvancedFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Localisation</label>
              <input
                type="text"
                placeholder="Département..."
                value={advancedFilters.localisation}
                onChange={e => setAdvancedFilters(f => ({ ...f, localisation: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Âge min</label>
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Âge max</label>
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

      {/* Tableau */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-gray-500 text-lg">Aucune demande dans la file active</p>
          <p className="text-gray-400 text-sm mt-1">Les nouvelles demandes apparaîtront ici automatiquement</p>
        </div>
      ) : processedReferrals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-gray-500 text-lg">Aucun résultat pour ces filtres</p>
          <button
            onClick={clearAdvancedFilters}
            className="mt-3 text-sm text-catchup-primary hover:underline"
          >
            Effacer les filtres avancés
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
                    Bénéficiaire{sortArrow('prenom')}
                  </th>
                  <th className={thClass} onClick={() => handleSort('age')}>
                    Âge{sortArrow('age')}
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
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedReferrals.map(r => {
                  const urgStyle = URGENCE_STYLES[r.priorite] || URGENCE_STYLES.normale
                  const statStyle = STATUT_STYLES[r.statut] || STATUT_STYLES.en_attente

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
                          {r.priorite === 'critique' ? '🔴' : r.priorite === 'haute' ? '🟠' : '🟢'} {urgStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{r.prenom || 'Anonyme'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.age ? `${r.age} ans` : '—'}
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
                        {r.localisation ? `📍 ${r.localisation}` : '—'}
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
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/conseiller/file-active/${r.id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-catchup-primary text-white text-sm rounded-lg hover:bg-catchup-primary/90 transition-colors"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} sur {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchData(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => fetchData(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
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
