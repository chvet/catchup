'use client'

import { useState, useEffect } from 'react'

interface ImpactData {
  fileActive: number
  sorties: { positives: number; total: number; tauxPositif: number }
  repartition: {
    genre: { genre: string; count: number }[]
    age: { tranche: string; count: number }[]
    qualification: { niveau: string; count: number }[]
    situation: { situation: string; count: number }[]
    typeSortie: { type: string; count: number }[]
    typeContrat: { type: string; count: number }[]
  }
  moyennes: {
    entretiensParParticipant: number
    messagesParAccompagnement: number
    delaiPriseEnChargeHeures: number
  }
  publicsSpecifiques: {
    handicap: number
    allocatairesRsa: number
    quartiersPrioritaires: number
  }
  suiviSortie: { fait: number; enAttente: number }
}

const LABELS: Record<string, string> = {
  M: 'Hommes', F: 'Femmes', autre: 'Autre', null: 'Non renseign\u00e9',
  moins_18: '< 18 ans', '18_25': '18-25 ans', '26_45': '26-45 ans', plus_45: '> 45 ans', inconnu: 'Inconnu',
  sans_diplome: 'Sans dipl\u00f4me', cap_bep: 'CAP/BEP', bac: 'Bac', bac_plus_2: 'Bac+2', bac_plus_3_plus: 'Bac+3 et plus',
  demandeur_emploi_longue_duree: 'DELD', demandeur_emploi: 'DE', inactif: 'Inactif', en_emploi: 'En emploi', en_formation: 'En formation',
  emploi_durable: 'Emploi durable', emploi_court: 'Emploi court', formation_certifiante: 'Formation certifiante',
  creation_activite: 'Cr\u00e9ation activit\u00e9', sortie_dynamique: 'Sortie dynamique', autre_sortie: 'Autre',
  cdi: 'CDI', cdd_6_plus: 'CDD 6+ mois', interim: 'Int\u00e9rim', cdd_moins_6: 'CDD < 6 mois',
  contrat_pro: 'Contrat pro', apprentissage: 'Apprentissage', aide: 'Contrat aid\u00e9',
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    red: 'bg-red-50 border-red-100 text-red-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1">{label}</p>
      {sub && <p className="text-[10px] opacity-70 mt-0.5">{sub}</p>}
    </div>
  )
}

function BarChart({ data, title }: { data: { label: string; count: number }[]; title: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-24 truncate">{LABELS[d.label] || d.label || 'N/R'}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div className="bg-catchup-primary h-5 rounded-full flex items-center justify-end pr-1.5 text-[10px] text-white font-medium transition-all" style={{ width: `${Math.max(5, (d.count / max) * 100)}%` }}>
                {d.count}
              </div>
            </div>
            <span className="text-[10px] text-gray-400 w-10 text-right">{total > 0 ? Math.round((d.count / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function IndicateursPage() {
  const [data, setData] = useState<ImpactData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/conseiller/dashboard/impact')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return <p className="text-center text-gray-500 py-12">Erreur de chargement</p>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Indicateurs d'insertion</h1>
        <p className="text-sm text-gray-500">Suivi de l'impact et des r\u00e9sultats d'accompagnement</p>
      </div>

      {/* KPI principaux */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="File active" value={data.fileActive} color="blue" />
        <KpiCard label="Sorties positives" value={data.sorties.positives} sub={`sur ${data.sorties.total} sorties`} color="green" />
        <KpiCard label="Taux sortie positive" value={`${data.sorties.tauxPositif}%`} sub="Objectif : 50%" color={data.sorties.tauxPositif >= 50 ? 'green' : 'amber'} />
        <KpiCard label="D\u00e9lai moyen PEC" value={`${data.moyennes.delaiPriseEnChargeHeures}h`} color="purple" />
        <KpiCard label="Entretiens / participant" value={data.moyennes.entretiensParParticipant} color="blue" />
        <KpiCard label="Messages / accomp." value={data.moyennes.messagesParAccompagnement} color="blue" />
      </div>

      {/* Publics sp\u00e9cifiques */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <KpiCard label="Situation de handicap" value={data.publicsSpecifiques.handicap} color="purple" />
        <KpiCard label="Allocataires RSA" value={data.publicsSpecifiques.allocatairesRsa} color="amber" />
        <KpiCard label="Quartiers prioritaires" value={data.publicsSpecifiques.quartiersPrioritaires} color="red" />
      </div>

      {/* Suivi J+30 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard label="Suivi sortie J+30 r\u00e9alis\u00e9" value={data.suiviSortie.fait} color="green" />
        <KpiCard label="Suivi sortie J+30 en attente" value={data.suiviSortie.enAttente} color="amber" />
      </div>

      {/* R\u00e9partitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <BarChart title="R\u00e9partition par genre" data={data.repartition.genre.map(d => ({ label: d.genre, count: d.count }))} />
        <BarChart title="R\u00e9partition par \u00e2ge" data={data.repartition.age.map(d => ({ label: d.tranche, count: d.count }))} />
        <BarChart title="Niveau de qualification" data={data.repartition.qualification.map(d => ({ label: d.niveau, count: d.count }))} />
        <BarChart title="Situation march\u00e9 de l'emploi" data={data.repartition.situation.map(d => ({ label: d.situation, count: d.count }))} />
        <BarChart title="Type de sortie" data={data.repartition.typeSortie.map(d => ({ label: d.type, count: d.count }))} />
        <BarChart title="Type de contrat" data={data.repartition.typeContrat.map(d => ({ label: d.type, count: d.count }))} />
      </div>
    </div>
  )
}
