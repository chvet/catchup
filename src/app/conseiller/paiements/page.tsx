'use client'

import { useState, useEffect } from 'react'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

interface PaiementItem {
  id: string
  montantCentimes: number
  devise: string
  statut: string
  methode: string | null
  recuUrl: string | null
  paieLe: string | null
  creeLe: string
  tarifLibelle: string
  beneficiairePrenom: string | null
  beneficiaireEmail: string | null
}

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  reussi: 'Reussi',
  echoue: 'Echoue',
  rembourse: 'Rembourse',
}

const STATUT_COLORS: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  en_cours: 'bg-blue-100 text-blue-700',
  reussi: 'bg-green-100 text-green-700',
  echoue: 'bg-red-100 text-red-700',
  rembourse: 'bg-purple-100 text-purple-700',
}

export default function PaiementsPage() {
  const conseiller = useConseiller()
  const [paiements, setPaiements] = useState<PaiementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const isAdmin = conseiller?.role === 'admin_structure' || conseiller?.role === 'super_admin'

  useEffect(() => {
    if (!isAdmin) return
    async function fetchPaiements() {
      try {
        const res = await fetch('/api/conseiller/paiements?limit=50')
        if (res.ok) {
          const data = await res.json()
          setPaiements(data.data || [])
          setTotal(data.total || 0)
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetchPaiements()
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">&#x1F512;</p>
        <p className="text-gray-500">Acc&egrave;s r&eacute;serv&eacute; aux administrateurs</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalReussi = paiements
    .filter(p => p.statut === 'reussi')
    .reduce((sum, p) => sum + p.montantCentimes, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Historique des paiements</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{total}</p>
          <p className="text-sm text-gray-500">Paiements total</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{(totalReussi / 100).toFixed(2)} &euro;</p>
          <p className="text-sm text-gray-500">Chiffre d&apos;affaires</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-catchup-primary">{paiements.filter(p => p.statut === 'reussi').length}</p>
          <p className="text-sm text-gray-500">Paiements r&eacute;ussis</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {paiements.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">&#x1F4B3;</p>
            <p className="text-gray-500">Aucun paiement pour le moment</p>
            <p className="text-sm text-gray-400 mt-1">Les paiements appara&icirc;tront ici lorsque des b&eacute;n&eacute;ficiaires accepteront vos tarifs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">B&eacute;n&eacute;ficiaire</th>
                  <th className="px-4 py-3 font-medium">Formule</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Re&ccedil;u</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{p.beneficiairePrenom || 'Anonyme'}</p>
                      {p.beneficiaireEmail && <p className="text-xs text-gray-500">{p.beneficiaireEmail}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.tarifLibelle}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{(p.montantCentimes / 100).toFixed(2)} &euro; TTC</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUT_COLORS[p.statut] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUT_LABELS[p.statut] || p.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.paieLe
                        ? new Date(p.paieLe).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                        : new Date(p.creeLe).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                      }
                    </td>
                    <td className="px-4 py-3">
                      {p.recuUrl ? (
                        <a
                          href={p.recuUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Voir
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
