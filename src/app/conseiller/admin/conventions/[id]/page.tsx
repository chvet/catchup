'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

interface Convention {
  id: string; type: string; nom: string; montantAnnuelHtCentimes: number
  limiteStructures: number; limiteBeneficiaires: number; limiteConversations: number; limiteSms: number
  dateDebut: string; dateFin: string; statut: string; contactNom?: string; contactEmail?: string
}

interface StructureMembre { structureId: string; structureNom: string; dateAjout: string; statut: string }
interface Usage { conversations: number; sms: number; beneficiaires: number }

function Gauge({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1"><span>{label}</span><span className="font-medium">{used} / {limit}</span></div>
      <div className="w-full h-3 bg-gray-200 rounded-full"><div className={`h-3 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export default function ConventionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const conseiller = useConseiller()
  const conventionId = params.id as string

  const [convention, setConvention] = useState<Convention | null>(null)
  const [structures, setStructures] = useState<StructureMembre[]>([])
  const [usage, setUsage] = useState<Usage>({ conversations: 0, sms: 0, beneficiaires: 0 })
  const [loading, setLoading] = useState(true)
  const [allStructures, setAllStructures] = useState<{ id: string; nom: string }[]>([])
  const [addStructureId, setAddStructureId] = useState('')

  const isSuperAdmin = conseiller?.role === 'super_admin'

  useEffect(() => {
    if (!isSuperAdmin) return
    Promise.all([
      fetch(`/api/conseiller/admin/conventions/${conventionId}`).then(r => r.json()),
      fetch('/api/conseiller/structures?all=true').then(r => r.json()),
    ]).then(([convData, strData]) => {
      setConvention(convData.convention)
      setStructures(convData.structures || [])
      setUsage(convData.usage || { conversations: 0, sms: 0, beneficiaires: 0 })
      setAllStructures((strData.data || []).map((s: { id: string; nom: string }) => ({ id: s.id, nom: s.nom })))
    }).finally(() => setLoading(false))
  }, [isSuperAdmin, conventionId])

  const handleAddStructure = async () => {
    if (!addStructureId) return
    const res = await fetch(`/api/conseiller/admin/conventions/${conventionId}/structures`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structureId: addStructureId }),
    })
    if (res.ok) {
      const nom = allStructures.find(s => s.id === addStructureId)?.nom || ''
      setStructures(prev => [...prev, { structureId: addStructureId, structureNom: nom, dateAjout: new Date().toISOString(), statut: 'active' }])
      setAddStructureId('')
    }
  }

  if (!isSuperAdmin) return <div className="text-center py-12"><p className="text-gray-500">Acc&egrave;s super admin requis</p></div>
  if (loading) return <div className="flex justify-center h-64"><div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!convention) return <div className="text-center py-12"><p className="text-gray-500">Convention non trouv&eacute;e</p></div>

  const activeMembers = structures.filter(s => s.statut === 'active')

  return (
    <div>
      <button onClick={() => router.push('/conseiller/admin/conventions')} className="text-sm text-gray-500 hover:text-catchup-primary mb-4">&larr; Retour</button>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{convention.nom}</h1>
            <p className="text-sm text-gray-500 mt-1">{convention.type === 'departement' ? 'Convention d&eacute;partementale' : 'Convention r&eacute;gionale'}</p>
            {convention.contactNom && <p className="text-sm text-gray-500">Contact : {convention.contactNom} ({convention.contactEmail})</p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">{(convention.montantAnnuelHtCentimes / 100).toLocaleString()} &euro;/an</p>
            <span className={`px-2 py-0.5 text-xs rounded-full ${convention.statut === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{convention.statut}</span>
          </div>
        </div>
      </div>

      {/* Jauges d'usage */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Usage agr&eacute;g&eacute; du mois</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Gauge used={usage.conversations} limit={convention.limiteConversations} label="Conversations IA" />
          <Gauge used={usage.sms} limit={convention.limiteSms} label="SMS" />
          <Gauge used={usage.beneficiaires} limit={convention.limiteBeneficiaires} label="B&eacute;n&eacute;ficiaires actifs" />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">{activeMembers.length} / {convention.limiteStructures} structures</p>
        </div>
      </div>

      {/* Structures membres */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Structures membres</h3>
          <div className="flex gap-2">
            <select value={addStructureId} onChange={e => setAddStructureId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Ajouter une structure</option>
              {allStructures.filter(s => !structures.some(m => m.structureId === s.id)).map(s => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
            <button onClick={handleAddStructure} disabled={!addStructureId} className="px-3 py-2 bg-catchup-primary text-white rounded-lg text-sm disabled:opacity-50">Ajouter</button>
          </div>
        </div>
        {activeMembers.length > 0 ? (
          <div className="space-y-2">
            {activeMembers.map(s => (
              <div key={s.structureId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-800">{s.structureNom}</span>
                <span className="text-xs text-gray-500">Ajout&eacute;e le {new Date(s.dateAjout).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Aucune structure membre</p>
        )}
      </div>
    </div>
  )
}
