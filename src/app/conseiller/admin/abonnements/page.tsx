'use client'

import { useState, useEffect } from 'react'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

interface AboItem {
  id: string; structureId: string; structureNom: string; plan: string
  montantMensuelHtCentimes: number; limiteConversations: number; limiteSms: number
  limiteBeneficiaires: number; limiteConseillers: number | null; dateDebut: string; statut: string
  conversationsIa: number; smsEnvoyes: number; beneficiairesActifs: number
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', pro: 'Pro', premium: 'Premium', pay_per_outcome: 'Pay-per-Outcome',
}
const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700', pro: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700', pay_per_outcome: 'bg-amber-100 text-amber-700',
}

function Gauge({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="text-xs">
      <div className="flex justify-between text-gray-500 mb-0.5"><span>{label}</span><span>{used}/{limit}</span></div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full"><div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export default function AbonnementsPage() {
  const conseiller = useConseiller()
  const [abonnements, setAbonnements] = useState<AboItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [structures, setStructures] = useState<{ id: string; nom: string }[]>([])
  const [form, setForm] = useState({ structureId: '', plan: 'starter', email: '' })
  const [creating, setCreating] = useState(false)

  const isSuperAdmin = conseiller?.role === 'super_admin'

  useEffect(() => {
    if (!isSuperAdmin) return
    Promise.all([
      fetch('/api/conseiller/admin/abonnements').then(r => r.json()),
      fetch('/api/conseiller/structures?all=true').then(r => r.json()),
    ]).then(([aboData, strData]) => {
      setAbonnements(aboData.data || [])
      setStructures((strData.data || []).map((s: { id: string; nom: string }) => ({ id: s.id, nom: s.nom })))
    }).finally(() => setLoading(false))
  }, [isSuperAdmin])

  const handleCreate = async () => {
    if (!form.structureId || !form.plan) return
    setCreating(true)
    const res = await fetch('/api/conseiller/admin/abonnements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setAbonnements(prev => [{ ...data.abonnement, structureNom: structures.find(s => s.id === form.structureId)?.nom || '', conversationsIa: 0, smsEnvoyes: 0, beneficiairesActifs: 0 }, ...prev])
      setShowCreate(false)
      setForm({ structureId: '', plan: 'starter', email: '' })
    }
    setCreating(false)
  }

  if (!isSuperAdmin) return <div className="text-center py-12"><p className="text-gray-500">Acc&egrave;s super admin requis</p></div>
  if (loading) return <div className="flex justify-center h-64"><div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Abonnements</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-catchup-primary text-white rounded-lg text-sm font-medium hover:bg-catchup-primary/90">
          + Nouvel abonnement
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Cr&eacute;er un abonnement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={form.structureId} onChange={e => setForm(f => ({ ...f, structureId: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">S&eacute;lectionner une structure</option>
              {structures.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
            <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
              {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input placeholder="Email facturation (optionnel)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button onClick={handleCreate} disabled={creating || !form.structureId} className="mt-3 px-4 py-2 bg-catchup-primary text-white rounded-lg text-sm disabled:opacity-50">
            {creating ? 'Cr&eacute;ation...' : 'Cr&eacute;er'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase border-b">
              <th className="px-4 py-3">Structure</th><th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Prix HT/mois</th><th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {abonnements.map(a => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{a.structureNom}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PLAN_COLORS[a.plan] || ''}`}>{PLAN_LABELS[a.plan] || a.plan}</span></td>
                <td className="px-4 py-3 text-sm text-gray-700">{(a.montantMensuelHtCentimes / 100).toFixed(0)} &euro;</td>
                <td className="px-4 py-3 space-y-1 w-48">
                  <Gauge used={a.conversationsIa} limit={a.limiteConversations} label="Conv. IA" />
                  <Gauge used={a.smsEnvoyes} limit={a.limiteSms} label="SMS" />
                  <Gauge used={a.beneficiairesActifs} limit={a.limiteBeneficiaires} label="B&eacute;n&eacute;f." />
                </td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded-full ${a.statut === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.statut}</span></td>
              </tr>
            ))}
            {abonnements.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucun abonnement</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
