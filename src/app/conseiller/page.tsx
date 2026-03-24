'use client'

import { useState, useEffect } from 'react'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts'

interface DashboardStats {
  kpis: {
    demandes: number
    prisesEnCharge: number
    terminees: number
    abandonnees: number
    tauxPriseEnCharge: number
    tempsMoyenAttente: number
    urgencesEnCours: number
    capacite: { max: number; actifs: number; taux: number } | null
  }
  repartitionUrgences: {
    normale: number
    haute: number
    critique: number
  }
}

interface RiasecData {
  distribution: { dimension: string; label: string; score: number }[]
  total: number
}

const URGENCE_COLORS = {
  normale: '#22C55E',
  haute: '#F59E0B',
  critique: '#EF4444',
}

const RIASEC_DIM_COLORS: Record<string, string> = {
  R: '#EF4444', I: '#3B82F6', A: '#8B5CF6',
  S: '#22C55E', E: '#F59E0B', C: '#6B7280',
}

const RIASEC_ORIENTATIONS: Record<string, string> = {
  R: 'BTP, mécanique, agriculture, artisanat, industrie, logistique, sport',
  I: 'Sciences, informatique, recherche, santé, ingénierie, data',
  A: 'Arts, design, communication, mode, musique, audiovisuel, écriture',
  S: 'Enseignement, social, santé, animation, médiation, RH',
  E: 'Commerce, management, entrepreneuriat, marketing, droit, finance',
  C: 'Comptabilité, administration, banque, assurance, secrétariat, qualité',
}

export default function DashboardPage() {
  const conseiller = useConseiller()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [riasec, setRiasec] = useState<RiasecData | null>(null)
  const [periode, setPeriode] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/conseiller/dashboard/stats?periode=${periode}`).then(r => r.json()),
      fetch(`/api/conseiller/dashboard/riasec?periode=${periode}`).then(r => r.json()),
    ])
      .then(([statsData, riasecData]) => {
        setStats(statsData)
        setRiasec(riasecData)
        setLoading(false)
      })
      .catch(err => {
        console.error('Erreur dashboard:', err)
        setLoading(false)
      })
  }, [periode])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const urgenceData = stats ? [
    { name: 'Normale', value: stats.repartitionUrgences.normale, color: URGENCE_COLORS.normale },
    { name: 'Haute', value: stats.repartitionUrgences.haute, color: URGENCE_COLORS.haute },
    { name: 'Critique', value: stats.repartitionUrgences.critique, color: URGENCE_COLORS.critique },
  ].filter(d => d.value > 0) : []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {conseiller?.structure?.nom || 'Vue globale'} — {periode} derniers jours
          </p>
        </div>
        <select
          value={periode}
          onChange={e => setPeriode(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-catchup-primary outline-none"
        >
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
          <option value={365}>12 mois</option>
        </select>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Demandes"
            value={stats.kpis.demandes}
            icon="📨"
            color="blue"
          />
          <KpiCard
            label="Prises en charge"
            value={stats.kpis.prisesEnCharge}
            icon="🤝"
            color="green"
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
          <KpiCard
            label="Urgences en cours"
            value={stats.kpis.urgencesEnCours}
            icon="🚨"
            color={stats.kpis.urgencesEnCours > 0 ? 'red' : 'green'}
          />
          <KpiCard
            label="Terminées"
            value={stats.kpis.terminees}
            icon="✅"
            color="green"
          />
          <KpiCard
            label="Abandonnées"
            value={stats.kpis.abandonnees}
            icon="⚠️"
            color={stats.kpis.abandonnees > 5 ? 'red' : 'yellow'}
          />
          {stats.kpis.capacite && (
            <KpiCard
              label="Remplissage"
              value={`${stats.kpis.capacite.taux}%`}
              subtitle={`${stats.kpis.capacite.actifs}/${stats.kpis.capacite.max}`}
              icon="🏢"
              color={stats.kpis.capacite.taux > 80 ? 'red' : stats.kpis.capacite.taux > 60 ? 'yellow' : 'green'}
            />
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition urgences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition des urgences</h3>
          {urgenceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={urgenceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {urgenceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Aucune donnée sur cette période
            </div>
          )}
        </div>

        {/* Distribution RIASEC — Dimensions dominantes + orientations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Profils dominants ({riasec?.total || 0} bénéficiaires)
          </h3>
          {riasec && riasec.total > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={riasec.distribution} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {riasec.distribution.map((entry, i) => (
                      <Cell key={i} fill={RIASEC_DIM_COLORS[entry.dimension] || '#6C63FF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Orientations possibles par dimension dominante */}
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Orientations fréquentes</p>
                <div className="space-y-2">
                  {riasec.distribution
                    .filter(d => d.score > 20)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)
                    .map(d => (
                      <div key={d.dimension} className="flex items-start gap-2">
                        <span className="inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: RIASEC_DIM_COLORS[d.dimension] || '#6C63FF' }} />
                        <div>
                          <span className="text-sm font-medium text-gray-700">{d.label}</span>
                          <p className="text-xs text-gray-500">{RIASEC_ORIENTATIONS[d.dimension] || ''}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Aucun profil sur cette période
            </div>
          )}
        </div>

        {/* Statuts des prises en charge */}
        {stats && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Vue d&apos;ensemble des prises en charge</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { label: 'En cours', value: stats.kpis.prisesEnCharge, fill: '#3B82F6' },
                { label: 'Terminées', value: stats.kpis.terminees, fill: '#22C55E' },
                { label: 'Abandonnées', value: stats.kpis.abandonnees, fill: '#9CA3AF' },
              ]}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {[
                    { fill: '#3B82F6' },
                    { fill: '#22C55E' },
                    { fill: '#9CA3AF' },
                  ].map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Alertes */}
      {stats && stats.kpis.urgencesEnCours > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-red-800 font-semibold mb-2">Alertes</h3>
          <p className="text-red-700 text-sm">
            🔴 {stats.kpis.urgencesEnCours} urgence(s) non prise(s) en charge
          </p>
        </div>
      )}
    </div>
  )
}

// === KPI CARD ===

function KpiCard({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string
  value: string | number
  subtitle?: string
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    red: 'bg-red-50 border-red-100',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}
