'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

interface ConventionItem {
  id: string; type: string; nom: string; montantAnnuelHtCentimes: number
  limiteStructures: number; limiteBeneficiaires: number; dateDebut: string
  dateFin: string; statut: string; nbStructures: number
}

export default function ConventionsPage() {
  const conseiller = useConseiller()
  const router = useRouter()
  const [conventions, setConventions] = useState<ConventionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ type: 'departement', nom: '', contactNom: '', contactEmail: '', dateDebut: '', dateFin: '' })
  const [creating, setCreating] = useState(false)

  const isSuperAdmin = conseiller?.role === 'super_admin'

  useEffect(() => {
    if (!isSuperAdmin) return
    fetch('/api/conseiller/admin/conventions').then(r => r.json())
      .then(data => setConventions(data.data || []))
      .finally(() => setLoading(false))
  }, [isSuperAdmin])

  const handleCreate = async () => {
    if (!form.nom || !form.dateDebut || !form.dateFin) return
    setCreating(true)
    const res = await fetch('/api/conseiller/admin/conventions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setConventions(prev => [{ ...data.convention, nbStructures: 0 }, ...prev])
      setShowCreate(false)
    }
    setCreating(false)
  }

  if (!isSuperAdmin) return <div className="text-center py-12"><p className="text-gray-500">Acc&egrave;s super admin requis</p></div>
  if (loading) return <div className="flex justify-center h-64"><div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Conventions territoriales</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-catchup-primary text-white rounded-lg text-sm font-medium">
          + Nouvelle convention
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Cr&eacute;er une convention</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
              <option value="departement">D&eacute;partement (18 000 &euro;/an)</option>
              <option value="region">R&eacute;gion (65 000 &euro;/an)</option>
            </select>
            <input placeholder="Nom (ex: Convention Hauts-de-Seine)" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Contact nom" value={form.contactNom} onChange={e => setForm(f => ({ ...f, contactNom: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Contact email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input type="date" value={form.dateDebut} onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input type="date" value={form.dateFin} onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button onClick={handleCreate} disabled={creating || !form.nom} className="mt-3 px-4 py-2 bg-catchup-primary text-white rounded-lg text-sm disabled:opacity-50">
            {creating ? 'Cr&eacute;ation...' : 'Cr&eacute;er'}
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {conventions.map(c => (
          <div key={c.id} onClick={() => router.push(`/conseiller/admin/conventions/${c.id}`)} className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer hover:border-catchup-primary transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{c.nom}</h3>
                <p className="text-sm text-gray-500">
                  {c.type === 'departement' ? 'Convention d&eacute;partementale' : 'Convention r&eacute;gionale'} &mdash; {c.nbStructures}/{c.limiteStructures} structures
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">{(c.montantAnnuelHtCentimes / 100).toLocaleString()} &euro;/an</p>
                <span className={`px-2 py-0.5 text-xs rounded-full ${c.statut === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.statut}</span>
              </div>
            </div>
          </div>
        ))}
        {conventions.length === 0 && <p className="text-center text-gray-400 py-8">Aucune convention</p>}
      </div>
    </div>
  )
}
