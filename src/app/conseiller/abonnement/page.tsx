'use client'

import { useState, useEffect } from 'react'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

interface AboInfo {
  plan: string; montantMensuelHtCentimes: number; dateDebut: string; statut: string
  limiteConversations: number; limiteSms: number; limiteBeneficiaires: number; limiteConseillers: number | null
}

interface UsageInfo {
  conversations: { used: number; limit: number }
  sms: { used: number; limit: number }
  beneficiaires: { used: number; limit: number }
  conseillers: { used: number; limit: number | null }
}

interface Facture { id: string; montantCentimes: number; statut: string; date: number; pdfUrl?: string; hostedUrl?: string }

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', pro: 'Pro', premium: 'Premium', pay_per_outcome: 'Pay-per-Outcome',
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ['3 conseillers', '100 b\u00E9n\u00E9ficiaires/mois', '500 conversations IA/mois', '200 SMS/mois', 'Logo personnalis\u00E9', 'Support email J+2'],
  pro: ['10 conseillers', '500 b\u00E9n\u00E9ficiaires/mois', '3 000 conversations IA/mois', '1 500 SMS/mois', 'Logo + prompt IA', 'Dashboard complet', 'Support J+1'],
  premium: ['Conseillers illimit\u00E9s', '2 000 b\u00E9n\u00E9ficiaires/mois', '15 000 conversations IA/mois', '8 000 SMS/mois', 'Webhook + API', 'Support d\u00E9di\u00E9 + visio'],
  pay_per_outcome: ['3 conseillers', 'Socle 150 \u20AC/mois', '+5 \u20AC/orientation r\u00E9ussie', '+15 \u20AC/accompagnement termin\u00E9', '+2 \u20AC/profil RIASEC fiable', '+1 \u20AC/NPS > 8'],
}

function Gauge({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">{label}</span><span className="font-bold text-gray-800">{used} / {limit}</span></div>
      <div className="w-full h-3 bg-gray-200 rounded-full"><div className={`h-3 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} /></div>
      {pct > 90 && <p className="text-xs text-red-600 mt-1">Quota presque atteint !</p>}
    </div>
  )
}

export default function MonAbonnementPage() {
  const conseiller = useConseiller()
  const [abo, setAbo] = useState<AboInfo | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = conseiller?.role === 'admin_structure' || conseiller?.role === 'super_admin'

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/conseiller/abonnement').then(r => r.json())
      .then(data => {
        setAbo(data.abonnement)
        setUsage(data.usage)
        setFactures(data.factures || [])
      }).finally(() => setLoading(false))
  }, [isAdmin])

  const handlePortal = async () => {
    const res = await fetch('/api/conseiller/abonnement/portail', { method: 'POST' })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    }
  }

  if (!isAdmin) return <div className="text-center py-12"><p className="text-gray-500">Acc&egrave;s admin requis</p></div>
  if (loading) return <div className="flex justify-center h-64"><div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" /></div>

  if (!abo) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">&#x1F4E6;</p>
        <h2 className="text-lg font-bold text-gray-800">Aucun abonnement actif</h2>
        <p className="text-sm text-gray-500 mt-2">Contactez l&apos;&eacute;quipe Catch&apos;Up pour souscrire un plan.</p>
        <p className="text-sm text-gray-400 mt-1">support@fondation-jae.org</p>
      </div>
    )
  }

  const features = PLAN_FEATURES[abo.plan] || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon abonnement</h1>

      {/* Plan actuel */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Plan {PLAN_LABELS[abo.plan] || abo.plan}</h2>
            <p className="text-sm text-gray-500 mt-1">Depuis le {new Date(abo.dateDebut).toLocaleDateString('fr-FR')}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-catchup-primary">{(abo.montantMensuelHtCentimes / 100).toFixed(0)} &euro; HT/mois</p>
            <span className={`px-2 py-0.5 text-xs rounded-full ${abo.statut === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{abo.statut}</span>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {features.map((f, i) => <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><span className="text-green-500">&#x2713;</span>{f}</li>)}
        </ul>
        <button onClick={handlePortal} className="mt-4 px-4 py-2 bg-catchup-primary text-white rounded-lg text-sm font-medium hover:bg-catchup-primary/90">
          G&eacute;rer mon abonnement
        </button>
      </div>

      {/* Jauges d'usage */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Gauge used={usage.conversations.used} limit={usage.conversations.limit} label="Conversations IA" />
          <Gauge used={usage.sms.used} limit={usage.sms.limit} label="SMS" />
          <Gauge used={usage.beneficiaires.used} limit={usage.beneficiaires.limit} label="B&eacute;n&eacute;ficiaires" />
          {usage.conseillers.limit && <Gauge used={usage.conseillers.used} limit={usage.conseillers.limit} label="Conseillers" />}
        </div>
      )}

      {/* Factures */}
      {factures.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Historique des factures</h3>
          <div className="space-y-2">
            {factures.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{(f.montantCentimes / 100).toFixed(2)} &euro;</p>
                  <p className="text-xs text-gray-500">{new Date(f.date * 1000).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${f.statut === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{f.statut === 'paid' ? 'Pay&eacute;e' : f.statut}</span>
                  {f.pdfUrl && <a href={f.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">PDF</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
