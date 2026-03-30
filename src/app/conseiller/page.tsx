'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  Legend
} from 'recharts'

// === Types ===

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
    mesAccompagnementsActifs: number
    terminesCeMois: number
    satisfactionMoyenne: number | null
    enAttente: number
  }
  repartitionUrgences: {
    normale: number
    haute: number
    critique: number
  }
  repartitionStatut: { statut: string; count: number }[]
  evolution30j: { date: string; count: number }[]
  recentActivity: { type: string; resume: string | null; acteurType: string; horodatage: string }[]
}

interface RiasecData {
  distribution: { dimension: string; label: string; score: number }[]
  total: number
}

// === Constants ===

const URGENCE_COLORS = {
  normale: '#22C55E',
  haute: '#F59E0B',
  critique: '#EF4444',
}

const STATUT_COLORS: Record<string, string> = {
  en_attente: '#F59E0B',
  nouvelle: '#3B82F6',
  prise_en_charge: '#6366F1',
  terminee: '#22C55E',
  abandonnee: '#9CA3AF',
  rupture: '#EF4444',
}

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  nouvelle: 'Nouvelle',
  prise_en_charge: 'Prise en charge',
  terminee: 'Terminee',
  abandonnee: 'Abandonnee',
  rupture: 'Rupture',
}

const RIASEC_DIM_COLORS: Record<string, string> = {
  R: '#EF4444', I: '#3B82F6', A: '#8B5CF6',
  S: '#22C55E', E: '#F59E0B', C: '#6B7280',
}

const RIASEC_ORIENTATIONS: Record<string, string> = {
  R: 'BTP, mecanique, agriculture, artisanat, industrie, logistique, sport',
  I: 'Sciences, informatique, recherche, sante, ingenierie, data',
  A: 'Arts, design, communication, mode, musique, audiovisuel, ecriture',
  S: 'Enseignement, social, sante, animation, mediation, RH',
  E: 'Commerce, management, entrepreneuriat, marketing, droit, finance',
  C: 'Comptabilite, administration, banque, assurance, secretariat, qualite',
}

const ACTIVITY_ICONS: Record<string, string> = {
  nouvelle_demande: '📨',
  message_envoye: '💬',
  participant_rejoint: '👋',
  participant_quitte: '👋',
  consentement_demande: '📝',
  consentement_accepte: '✅',
  consentement_refuse: '❌',
  video_proposee: '📹',
  video_acceptee: '📹',
  rdv_planifie: '📅',
  bris_de_glace: '🚨',
  tiers_invite: '👥',
  statut_recontacte: '📞',
  statut_en_attente: '⏳',
  statut_echoue: '❌',
  default: '📋',
}

// === Main Component ===

export default function DashboardPage() {
  const conseiller = useConseiller()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [riasec, setRiasec] = useState<RiasecData | null>(null)
  const [periode, setPeriode] = useState(30)
  const [loading, setLoading] = useState(true)

  const isAdmin = conseiller?.role === 'admin_structure' || conseiller?.role === 'super_admin'

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

  const statutData = stats?.repartitionStatut
    ?.filter(s => s.count > 0)
    .map(s => ({
      name: STATUT_LABELS[s.statut] || s.statut,
      value: s.count,
      fill: STATUT_COLORS[s.statut] || '#6B7280',
    })) || []

  // Format evolution data for the line chart
  const evolutionData = stats?.evolution30j?.map(e => ({
    date: new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    count: e.count,
  })) || []

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {conseiller?.structure?.nom || 'Vue globale'} &mdash; {periode} derniers jours
          </p>
        </div>
        <select
          value={periode}
          onChange={e => setPeriode(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-catchup-primary outline-none w-full sm:w-auto"
        >
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
          <option value={365}>12 mois</option>
        </select>
      </div>

      {/* === KPI Cards === */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          <KpiCard
            label="Cas en attente"
            value={stats.kpis.enAttente}
            icon="📨"
            color={stats.kpis.enAttente > 10 ? 'red' : stats.kpis.enAttente > 5 ? 'yellow' : 'blue'}
          />
          <KpiCard
            label="Mes accompagnements"
            value={stats.kpis.mesAccompagnementsActifs}
            icon="🤝"
            color="green"
          />
          <KpiCard
            label="Termines ce mois"
            value={stats.kpis.terminesCeMois}
            icon="✅"
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
          {stats.kpis.satisfactionMoyenne !== null ? (
            <KpiCard
              label="Satisfaction NPS"
              value={`${stats.kpis.satisfactionMoyenne}/10`}
              icon="⭐"
              color={stats.kpis.satisfactionMoyenne >= 8 ? 'green' : stats.kpis.satisfactionMoyenne >= 6 ? 'yellow' : 'red'}
            />
          ) : (
            <KpiCard
              label="Urgences en cours"
              value={stats.kpis.urgencesEnCours}
              icon="🚨"
              color={stats.kpis.urgencesEnCours > 0 ? 'red' : 'green'}
            />
          )}
        </div>
      )}

      {/* === Extra KPI row (capacity + urgences if satisfaction shown) === */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.kpis.satisfactionMoyenne !== null && (
            <KpiCard
              label="Urgences en cours"
              value={stats.kpis.urgencesEnCours}
              icon="🚨"
              color={stats.kpis.urgencesEnCours > 0 ? 'red' : 'green'}
            />
          )}
          <KpiCard
            label="Demandes totales"
            value={stats.kpis.demandes}
            icon="📋"
            color="blue"
          />
          <KpiCard
            label="Abandonnees"
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

      {/* === Raccourcis (Quick Actions) === */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Raccourcis</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            href="/conseiller/file-active"
            icon="📥"
            label="File active"
            description="Voir les demandes"
          />
          <QuickAction
            href="/conseiller/agenda"
            icon="📅"
            label="Mon agenda"
            description="Mes rendez-vous"
          />
          {isAdmin && (
            <QuickAction
              href="/conseiller/admin"
              icon="📊"
              label="Exporter"
              description="Rapports & exports"
            />
          )}
          {conseiller?.structure?.id && (
            <QuickAction
              href={`/conseiller/structures/${conseiller.structure.id}`}
              icon="🏢"
              label="Ma structure"
              description={conseiller.structure.nom}
            />
          )}
        </div>
      </div>

      {/* === Mes Campagnes (jauges) === */}
      <CampagnesWidget />

      {/* === Charts === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Bar chart: Repartition par statut */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cas par statut</h3>
          {statutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statutData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Cas" radius={[4, 4, 0, 0]}>
                  {statutData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Line chart: Evolution 30j */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolution sur 30 jours</h3>
          {evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval={Math.max(0, Math.floor(evolutionData.length / 7) - 1)}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Nouveaux cas"
                  stroke="#6C63FF"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Pie chart: Repartition urgences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Repartition des urgences</h3>
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
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Distribution RIASEC */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Profils dominants ({riasec?.total || 0} beneficiaires)
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
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Orientations frequentes</p>
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
            <EmptyChart message="Aucun profil sur cette periode" />
          )}
        </div>
      </div>

      {/* === Activite recente === */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Activite recente</h3>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((event, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xl flex-shrink-0 mt-0.5">
                  {ACTIVITY_ICONS[event.type] || ACTIVITY_ICONS.default}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">
                    {event.resume || event.type}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTimeAgo(event.horodatage)}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                  {event.acteurType}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm py-4 text-center">
            Aucune activite recente
          </p>
        )}
      </div>

      {/* === Alertes === */}
      {stats && stats.kpis.urgencesEnCours > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-red-800 font-semibold mb-2">Alertes</h3>
          <div className="space-y-1">
            <p className="text-red-700 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {stats.kpis.urgencesEnCours} urgence(s) non prise(s) en charge
            </p>
            {stats.kpis.tempsMoyenAttente > 48 && (
              <p className="text-orange-700 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                Temps d&apos;attente moyen superieur a 48h
              </p>
            )}
            {stats.kpis.capacite && stats.kpis.capacite.taux > 80 && (
              <p className="text-yellow-700 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                Structure a {stats.kpis.capacite.taux}% de capacite
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// === Campagnes Widget (jauges sur le dashboard) ===

function CampagnesWidget() {
  const [campagnes, setCampagnes] = useState<{
    id: string; designation: string; quantiteObjectif: number; uniteOeuvre: string
    dateDebut: string; dateFin: string; avancement: number; pourcentage: number
  }[]>([])

  useEffect(() => {
    fetch('/api/conseiller/campagnes')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.campagnes) setCampagnes(data.campagnes.filter((c: { statut: string }) => c.statut === 'active'))
      })
      .catch(() => {})
  }, [])

  if (campagnes.length === 0) return null

  const progressColor = (pct: number, dateFin: string) => {
    const daysLeft = (new Date(dateFin).getTime() - Date.now()) / 86400000
    if (pct >= 100) return 'bg-green-500'
    if (daysLeft < 7 && pct < 50) return 'bg-red-500'
    if (pct < 30) return 'bg-red-400'
    if (pct < 70) return 'bg-amber-400'
    return 'bg-green-500'
  }

  const daysLabel = (dateFin: string) => {
    const days = Math.ceil((new Date(dateFin).getTime() - Date.now()) / 86400000)
    if (days < 0) return 'Terminee'
    if (days === 0) return "Aujourd'hui"
    return `${days}j`
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Mes campagnes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {campagnes.map(c => (
          <Link
            key={c.id}
            href="/conseiller/campagnes"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800 truncate">{c.designation}</h4>
              <span className="text-xs text-gray-400 shrink-0 ml-2">{daysLabel(c.dateFin)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>{c.avancement}/{c.quantiteObjectif} {c.uniteOeuvre}</span>
              <span className="font-bold text-base text-gray-800">{c.pourcentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor(c.pourcentage, c.dateFin)}`}
                style={{ width: `${c.pourcentage}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// === KPI Card ===

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
    <div className={`rounded-xl border p-3 sm:p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className="text-xl sm:text-2xl">{icon}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 leading-tight">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}

// === Quick Action ===

function QuickAction({
  href,
  icon,
  label,
  description,
}: {
  href: string
  icon: string
  label: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 hover:border-catchup-primary hover:shadow-md transition-all group"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 group-hover:text-catchup-primary transition-colors">{label}</p>
        <p className="text-xs text-gray-400 truncate">{description}</p>
      </div>
    </Link>
  )
}

// === Empty Chart placeholder ===

function EmptyChart({ message = 'Aucune donnee sur cette periode' }: { message?: string }) {
  return (
    <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
      {message}
    </div>
  )
}

// === Time ago formatter ===

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return "A l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffH < 24) return `Il y a ${diffH}h`
  if (diffD === 1) return 'Hier'
  if (diffD < 7) return `Il y a ${diffD} jours`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}
