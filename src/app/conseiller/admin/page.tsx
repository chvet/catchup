'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import CarteDesRessources from '@/components/conseiller/CarteDesRessources'

// MapView déplacé dans CarteDesRessources

// === Types ===

interface ConseillerStat {
  id: string
  prenom: string
  nom: string
  email: string
  casActifs: number
  casTermines: number
  casRupture: number
  derniereConnexion: string | null
}

interface AdminStats {
  kpis: {
    enAttente: number
    prisesActives: number
    terminesCeMois: number
    rupturesCeMois: number
    tempsMoyenAttente: number
    tauxPriseEnCharge: number
  }
  structures: StructureStat[]
  conseillerStats?: ConseillerStat[]
  barChartData: BarChartItem[]
  evolutionJours: { jour: string; count: number }[]
  repartitionStatuts: { statut: string; count: number }[]
  alertes: {
    structuresEnAlerte: { id: string; nom: string; casEnAttente: number }[]
    enAttente48h: number
    structuresSansConnexion: { id: string; nom: string; derniereConnexion: string | null }[]
  }
}

interface StructureStat {
  id: string
  nom: string
  type: string
  departements?: string[]
  capaciteMax: number
  conseillersActifs: number
  casEnAttente: number
  casPrisEnCharge: number
  casTermines: number
  casRupture: number
  tempsMoyenAttente: number
  tauxPriseEnCharge: number
  derniereConnexionConseiller: string | null
}

interface BarChartItem {
  nom: string
  en_attente: number
  prise_en_charge: number
  terminee: number
  rupture: number
}

// === Couleurs ===

const CHART_COLORS = {
  primary: '#6C63FF',
  enAttente: '#F59E0B',
  priseEnCharge: '#3B82F6',
  terminee: '#22C55E',
  rupture: '#EF4444',
}

const STATUT_LABELS: Record<string, string> = {
  nouvelle: 'Nouvelle',
  en_attente: 'En attente',
  prise_en_charge: 'Prise en charge',
  recontacte: 'Recontacte',
  terminee: 'Terminee',
  echoue: 'Echouee',
  refuse: 'Refusee',
  abandonnee: 'Abandonnee',
}

const STATUT_COLORS: Record<string, string> = {
  nouvelle: '#8B5CF6',
  en_attente: '#F59E0B',
  prise_en_charge: '#3B82F6',
  recontacte: '#6366F1',
  terminee: '#22C55E',
  echoue: '#EF4444',
  refuse: '#9CA3AF',
  abandonnee: '#EF4444',
}

// === Composants auxiliaires ===

type SortKey = keyof StructureStat
type SortDir = 'asc' | 'desc'

function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    red: 'bg-red-50 border-red-100',
    purple: 'bg-purple-50 border-purple-100',
    gray: 'bg-gray-50 border-gray-100',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

// === Export dropdown ===

function ExportDropdown() {
  const [open, setOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  const doExport = (format: string, type: string) => {
    const url = `/api/conseiller/export?format=${format}&type=${type}&from=${dateFrom}&to=${dateTo}`
    window.open(url, '_blank')
    setOpen(false)
  }

  const exportOptions = [
    { label: '\ud83d\udcca Rapport PDF', format: 'pdf', type: 'activite' },
    { label: '\ud83d\udcca Rapport Excel', format: 'xlsx', type: 'activite' },
    { label: '\ud83d\udc65 Liste beneficiaires (Excel)', format: 'xlsx', type: 'beneficiaires' },
    { label: '\ud83c\udfe2 Liste structures (Excel)', format: 'xlsx', type: 'structures' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="px-4 py-2 bg-catchup-primary text-white rounded-lg text-sm font-medium hover:bg-catchup-primary/90 transition-colors flex items-center gap-2"
      >
        Exporter
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Date picker */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-2">Periode du rapport</p>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
              <span className="text-gray-400 text-sm">au</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
          </div>

          {/* Options */}
          {exportOptions.map((opt, i) => (
            <button
              key={i}
              onClick={() => doExport(opt.format, opt.type)}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}

// === Section Satisfaction ===

interface SatisfactionData {
  moyennes: {
    noteGlobale: number | null
    noteEcoute: number | null
    noteUtilite: number | null
    noteConseiller: number | null
    nps: number | null
    totalReponses: number
  }
  npsScore: number | null
}

function SatisfactionSection({ data }: { data: SatisfactionData }) {
  const npsScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'
    if (score > 50) return 'text-green-600'
    if (score > 0) return 'text-orange-500'
    return 'text-red-500'
  }

  const npsColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'
    if (score > 8) return 'text-green-600'
    if (score > 6) return 'text-orange-500'
    return 'text-red-500'
  }

  const renderStars = (score: number | null) => {
    if (score === null) return <span className="text-gray-400 text-sm">Pas de donnees</span>
    const full = Math.floor(score)
    const hasHalf = score - full >= 0.3
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} className={`w-5 h-5 ${i <= full ? 'text-yellow-400' : i === full + 1 && hasHalf ? 'text-yellow-300' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm font-semibold text-gray-700">{score.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Satisfaction des beneficiaires</h3>

      {data.moyennes.totalReponses === 0 ? (
        <p className="text-gray-400 text-sm">Aucune enquete de satisfaction pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-1">Score NPS</p>
            <p className={`text-3xl font-bold ${npsScoreColor(data.npsScore)}`}>
              {data.npsScore !== null ? data.npsScore : '\u2014'}
            </p>
            <p className="text-xs text-gray-400 mt-1">{data.moyennes.totalReponses} reponse{data.moyennes.totalReponses > 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-1">Experience globale</p>
            {renderStars(data.moyennes.noteGlobale)}
          </div>
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-1">Ecoute</p>
            {renderStars(data.moyennes.noteEcoute)}
          </div>
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-1">Utilite de l&apos;IA</p>
            {renderStars(data.moyennes.noteUtilite)}
          </div>
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-1">Aide du conseiller</p>
            {renderStars(data.moyennes.noteConseiller)}
          </div>
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-1">Recommandation (0-10)</p>
            <p className={`text-2xl font-bold ${npsColor(data.moyennes.nps)}`}>
              {data.moyennes.nps !== null ? data.moyennes.nps.toFixed(1) : '\u2014'}
              <span className="text-sm font-normal text-gray-400">/10</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// === Page principale ===

export default function AdminDashboardPage() {
  const conseiller = useConseiller()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('casEnAttente')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [satisfaction, setSatisfaction] = useState<SatisfactionData | null>(null)

  const isSuperAdmin = conseiller?.role === 'super_admin'
  const isAdminStructure = conseiller?.role === 'admin_structure'

  // Redirection si ni super_admin ni admin_structure
  useEffect(() => {
    if (conseiller && !isSuperAdmin && !isAdminStructure) {
      router.push('/conseiller')
    }
  }, [conseiller, router, isSuperAdmin, isAdminStructure])

  // Chargement des stats
  useEffect(() => {
    fetch('/api/conseiller/admin/stats')
      .then(r => {
        if (!r.ok) throw new Error('Erreur')
        return r.json()
      })
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Erreur admin stats:', err)
        setLoading(false)
      })

    // Charger les donnees de satisfaction
    fetch('/api/conseiller/satisfaction')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setSatisfaction(data)
      })
      .catch(() => {})
  }, [])

  if (!isSuperAdmin && !isAdminStructure) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        Impossible de charger les statistiques.
      </div>
    )
  }

  // Tri du tableau
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedStructures = [...stats.structures].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortDir === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number)
  })

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-gray-300 ml-1">&#8693;</span>
    return <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  // Couleur de ligne du tableau
  const rowColor = (s: StructureStat) => {
    if (s.casEnAttente > 5) return 'bg-red-50'
    if (s.casEnAttente > 3) return 'bg-orange-50'
    return ''
  }

  // Pie chart data
  const pieData = stats.repartitionStatuts
    .filter(s => s.count > 0)
    .map(s => ({
      name: STATUT_LABELS[s.statut || ''] || s.statut || 'Inconnu',
      value: s.count,
      color: STATUT_COLORS[s.statut || ''] || '#9CA3AF',
    }))

  // Line chart data - remplir les jours manquants
  const lineData = (() => {
    const map = new Map(stats.evolutionJours.map(d => [d.jour, d.count]))
    const result: { jour: string; demandes: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = date.toISOString().split('T')[0]
      result.push({
        jour: `${date.getDate()}/${date.getMonth() + 1}`,
        demandes: map.get(key) || 0,
      })
    }
    return result
  })()

  const hasAlertes = stats.alertes.structuresEnAlerte.length > 0
    || stats.alertes.enAttente48h > 0
    || stats.alertes.structuresSansConnexion.length > 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isSuperAdmin ? 'Administration multi-structures' : `Administration — ${conseiller?.structure?.nom || 'Ma structure'}`}
          </h1>
          <p className="text-gray-500 text-sm">
            {isSuperAdmin ? "Vue d'ensemble de toutes les structures" : 'Vue de votre structure et de votre equipe'}
          </p>
        </div>
        <ExportDropdown />
      </div>

      {/* === Navigation admin === */}
      {isSuperAdmin && (
        <div className="flex gap-3 mb-6">
          <Link href="/conseiller/admin/conventions" className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Conventions
          </Link>
          <Link href="/conseiller/admin/abonnements" className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Abonnements
          </Link>
          <Link href="/conseiller/admin/providers" className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Fournisseurs
          </Link>
        </div>
      )}

      {/* === A. KPIs === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <KpiCard
          label="En attente"
          value={stats.kpis.enAttente}
          icon="⏳"
          color={stats.kpis.enAttente > 10 ? 'red' : stats.kpis.enAttente > 5 ? 'yellow' : 'blue'}
        />
        <KpiCard
          label="Prises en charge actives"
          value={stats.kpis.prisesActives}
          icon="🤝"
          color="blue"
        />
        <KpiCard
          label="Terminées ce mois"
          value={stats.kpis.terminesCeMois}
          icon="✅"
          color="green"
        />
        <KpiCard
          label="Ruptures ce mois"
          value={stats.kpis.rupturesCeMois}
          icon="⚠️"
          color={stats.kpis.rupturesCeMois > 5 ? 'red' : 'yellow'}
        />
        <KpiCard
          label="Attente moyenne"
          value={`${stats.kpis.tempsMoyenAttente}h`}
          icon="⏱️"
          color={stats.kpis.tempsMoyenAttente > 48 ? 'red' : stats.kpis.tempsMoyenAttente > 24 ? 'yellow' : 'green'}
        />
        <KpiCard
          label="Taux prise en charge"
          value={`${stats.kpis.tauxPriseEnCharge}%`}
          icon="📈"
          color={stats.kpis.tauxPriseEnCharge >= 80 ? 'green' : stats.kpis.tauxPriseEnCharge >= 50 ? 'yellow' : 'red'}
        />
      </div>

      {/* === D. Alertes === */}
      {hasAlertes && (
        <div className="space-y-3 mb-8">
          {stats.alertes.structuresEnAlerte.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-red-800 font-semibold mb-2">Structures en surcharge</h3>
              {stats.alertes.structuresEnAlerte.map(s => (
                <p key={s.id} className="text-red-700 text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2" />
                  <Link href={`/conseiller/structures/${s.id}`} className="underline hover:no-underline">
                    {s.nom}
                  </Link>
                  {' '}&mdash; {s.casEnAttente} cas en attente
                </p>
              ))}
            </div>
          )}

          {stats.alertes.enAttente48h > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <h3 className="text-orange-800 font-semibold mb-2">Attentes prolongées</h3>
              <p className="text-orange-700 text-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2" />
                {stats.alertes.enAttente48h} bénéficiaire(s) en attente depuis plus de 48 heures
              </p>
            </div>
          )}

          {stats.alertes.structuresSansConnexion.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-gray-700 font-semibold mb-2">Structures inactives</h3>
              {stats.alertes.structuresSansConnexion.map(s => (
                <p key={s.id} className="text-gray-600 text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2" />
                  <Link href={`/conseiller/structures/${s.id}`} className="underline hover:no-underline">
                    {s.nom}
                  </Link>
                  {' '}&mdash; aucun conseiller connecté depuis 24h
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === E. Satisfaction === */}
      {satisfaction && <SatisfactionSection data={satisfaction} />}

      {/* === Carte des ressources (Leaflet) — super_admin uniquement === */}
      {isSuperAdmin && <CarteDesRessources structures={stats.structures} />}

      {/* === Stats par conseiller (admin_structure) === */}
      {isAdminStructure && stats.conseillerStats && stats.conseillerStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Performance de l&apos;equipe</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Conseiller</th>
                  <th className="px-3 py-3 font-medium text-center">Cas actifs</th>
                  <th className="px-3 py-3 font-medium text-center">Termines ce mois</th>
                  <th className="px-3 py-3 font-medium text-center">Ruptures</th>
                  <th className="px-3 py-3 font-medium text-center">Derniere connexion</th>
                </tr>
              </thead>
              <tbody>
                {stats.conseillerStats.map(c => (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{c.prenom} {c.nom}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        c.casActifs > 10 ? 'bg-red-100 text-red-700' :
                        c.casActifs > 5 ? 'bg-orange-100 text-orange-700' :
                        c.casActifs > 0 ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {c.casActifs}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 font-medium">{c.casTermines}</td>
                    <td className="px-3 py-3 text-center text-red-500">{c.casRupture}</td>
                    <td className="px-3 py-3 text-center text-xs text-gray-500">
                      {c.derniereConnexion
                        ? new Date(c.derniereConnexion).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : 'Jamais'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === B. Tableau comparatif === */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {isSuperAdmin ? 'Comparatif des structures' : 'Indicateurs de la structure'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('nom')}>
                  Structure <SortIcon col="nom" />
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer whitespace-nowrap text-center" onClick={() => handleSort('conseillersActifs')}>
                  Conseillers <SortIcon col="conseillersActifs" />
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer whitespace-nowrap text-center" onClick={() => handleSort('casEnAttente')}>
                  En attente <SortIcon col="casEnAttente" />
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer whitespace-nowrap text-center" onClick={() => handleSort('casPrisEnCharge')}>
                  Pris en charge <SortIcon col="casPrisEnCharge" />
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer whitespace-nowrap text-center" onClick={() => handleSort('casTermines')}>
                  Terminés <SortIcon col="casTermines" />
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer whitespace-nowrap text-center" onClick={() => handleSort('casRupture')}>
                  Ruptures <SortIcon col="casRupture" />
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer whitespace-nowrap text-center" onClick={() => handleSort('tempsMoyenAttente')}>
                  Attente moy. <SortIcon col="tempsMoyenAttente" />
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer whitespace-nowrap text-center" onClick={() => handleSort('tauxPriseEnCharge')}>
                  Taux PEC <SortIcon col="tauxPriseEnCharge" />
                </th>
                <th className="px-3 py-3 font-medium whitespace-nowrap text-center">
                  Charge
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStructures.map(s => {
                const chargePct = Math.min(100, Math.round((s.casPrisEnCharge / s.capaciteMax) * 100))
                const chargeColor = chargePct > 80 ? 'bg-red-500' : chargePct > 60 ? 'bg-orange-500' : 'bg-green-500'

                return (
                  <tr key={s.id} className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${rowColor(s)}`}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/conseiller/structures/${s.id}`}
                        className="text-catchup-primary font-medium hover:underline"
                      >
                        {s.nom}
                      </Link>
                      <p className="text-xs text-gray-400">{s.type}</p>
                    </td>
                    <td className="px-3 py-3 text-center">{s.conseillersActifs}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        s.casEnAttente > 5 ? 'bg-red-100 text-red-700' :
                        s.casEnAttente > 3 ? 'bg-orange-100 text-orange-700' :
                        s.casEnAttente > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {s.casEnAttente}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-medium">{s.casPrisEnCharge}</td>
                    <td className="px-3 py-3 text-center text-green-600">{s.casTermines}</td>
                    <td className="px-3 py-3 text-center text-red-500">{s.casRupture}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={s.tempsMoyenAttente > 48 ? 'text-red-600 font-medium' : ''}>
                        {s.tempsMoyenAttente}h
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-medium ${
                        s.tauxPriseEnCharge >= 80 ? 'text-green-600' :
                        s.tauxPriseEnCharge >= 50 ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {s.tauxPriseEnCharge}%
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${chargeColor}`}
                            style={{ width: `${chargePct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {s.casPrisEnCharge}/{s.capaciteMax}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {sortedStructures.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    Aucune structure active
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === C. Graphiques === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* BarChart - Cas par structure (stacked) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cas par structure</h3>
          {stats.barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.barChartData} layout="vertical">
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="nom" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="en_attente" name="En attente" stackId="a" fill={CHART_COLORS.enAttente} />
                <Bar dataKey="prise_en_charge" name="Pris en charge" stackId="a" fill={CHART_COLORS.priseEnCharge} />
                <Bar dataKey="terminee" name="Terminés" stackId="a" fill={CHART_COLORS.terminee} />
                <Bar dataKey="rupture" name="Ruptures" stackId="a" fill={CHART_COLORS.rupture} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Aucune donnée
            </div>
          )}
        </div>

        {/* PieChart - Répartition des statuts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition des statuts</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Aucune donnée
            </div>
          )}
        </div>

        {/* LineChart - Evolution 30 jours */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Évolution des demandes (30 derniers jours)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <XAxis
                dataKey="jour"
                tick={{ fontSize: 11 }}
                interval={Math.max(0, Math.floor(lineData.length / 10) - 1)}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="demandes"
                name="Demandes"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS.primary }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
