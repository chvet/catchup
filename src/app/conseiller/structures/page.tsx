'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

interface StructureItem {
  id: string
  nom: string
  type: string
  departements: string
  ageMin: number
  ageMax: number
  specialites: string
  capaciteMax: number
  actif: number
  nbConseillers?: number
  nbCasActifs?: number
}

const TYPE_LABELS: Record<string, string> = {
  mission_locale: 'Mission Locale',
  cio: 'CIO',
  e2c: 'E2C',
  cidj: 'CIDJ',
  privee: 'Structure privée',
  autre: 'Autre',
}

const TYPE_COLORS: Record<string, string> = {
  mission_locale: 'bg-blue-100 text-blue-700',
  cio: 'bg-green-100 text-green-700',
  e2c: 'bg-purple-100 text-purple-700',
  cidj: 'bg-orange-100 text-orange-700',
  privee: 'bg-pink-100 text-pink-700',
  autre: 'bg-gray-100 text-gray-700',
}

export default function StructuresPage() {
  const conseiller = useConseiller()
  const router = useRouter()
  const [structures, setStructures] = useState<StructureItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    type: 'mission_locale',
    departements: '',
    ageMin: 16,
    ageMax: 25,
    specialites: '',
    capaciteMax: 50,
  })

  const isAdmin = conseiller?.role === 'admin_structure' || conseiller?.role === 'super_admin'

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/conseiller/structures')
      .then(r => r.json())
      .then(data => {
        setStructures(data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isAdmin])

  const filteredStructures = useMemo(() => {
    if (!search.trim()) return structures
    const q = search.toLowerCase()
    return structures.filter(s => s.nom.toLowerCase().includes(q))
  }, [structures, search])

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-500">Accès réservé aux administrateurs</p>
      </div>
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/conseiller/structures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        departements: formData.departements.split(',').map(d => d.trim()),
        specialites: formData.specialites.split(',').map(s => s.trim()),
      }),
    })

    if (res.ok) {
      const { structure } = await res.json()
      setStructures(prev => [...prev, structure])
      setShowModal(false)
      setFormData({ nom: '', type: 'mission_locale', departements: '', ageMin: 16, ageMax: 25, specialites: '', capaciteMax: 50 })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/conseiller/structures/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setStructures(prev => prev.filter(s => s.id !== id))
      setDeleteConfirm(null)
    }
  }

  const parseSafe = (val: string | null | undefined, fallback: string[] = []): string[] => {
    try { return JSON.parse(val || '[]') } catch { return fallback }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Structures</h1>
          <p className="text-gray-500 text-sm">{filteredStructures.length} structure(s)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-catchup-primary text-white rounded-lg text-sm font-medium hover:bg-catchup-primary/90 transition-colors"
        >
          + Nouvelle structure
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une structure par nom..."
          className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary focus:border-catchup-primary"
        />
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Nouvelle structure</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={e => setFormData(f => ({ ...f, nom: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    placeholder="Mission Locale Paris 15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Départements couverts</label>
                  <input
                    type="text"
                    value={formData.departements}
                    onChange={e => setFormData(f => ({ ...f, departements: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    placeholder="75, 92, 93"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spécialités</label>
                  <input
                    type="text"
                    value={formData.specialites}
                    onChange={e => setFormData(f => ({ ...f, specialites: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    placeholder="insertion, orientation, decrochage"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Âge min</label>
                    <input
                      type="number"
                      value={formData.ageMin}
                      onChange={e => setFormData(f => ({ ...f, ageMin: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Âge max</label>
                    <input
                      type="number"
                      value={formData.ageMax}
                      onChange={e => setFormData(f => ({ ...f, ageMax: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacité max</label>
                  <input
                    type="number"
                    value={formData.capaciteMax}
                    onChange={e => setFormData(f => ({ ...f, capaciteMax: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-catchup-primary text-white rounded-lg font-medium hover:bg-catchup-primary/90 transition-colors"
                >
                  Créer la structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-500 mb-6">
              Êtes-vous sûr de vouloir supprimer cette structure ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredStructures.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-4">🏢</p>
          <p className="text-gray-500 text-lg">
            {search ? 'Aucune structure trouvée' : 'Aucune structure configurée'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStructures.map(s => {
            const deps = parseSafe(s.departements)
            const specs = parseSafe(s.specialites)

            return (
              <div
                key={s.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-catchup-primary/30 transition-all cursor-pointer group"
                onClick={() => router.push(`/conseiller/structures/${s.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 group-hover:text-catchup-primary transition-colors truncate">
                      {s.nom}
                    </h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${TYPE_COLORS[s.type] || TYPE_COLORS.autre}`}>
                      {TYPE_LABELS[s.type] || s.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/conseiller/structures/${s.id}`)}
                      className="p-1.5 text-gray-400 hover:text-catchup-primary rounded-lg hover:bg-catchup-primary/10 transition-colors"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    {conseiller?.role === 'super_admin' && (
                      <button
                        onClick={() => setDeleteConfirm(s.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Départements */}
                {deps.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {deps.map((d: string) => (
                      <span key={d} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {/* Spécialités */}
                {specs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {specs.map((sp: string) => (
                      <span key={sp} className="px-2 py-0.5 bg-catchup-primary/10 text-catchup-primary text-xs rounded">
                        {sp}
                      </span>
                    ))}
                  </div>
                )}

                {/* Info row */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>👤 {s.ageMin}-{s.ageMax} ans</span>
                  <span>📊 Capacité : {s.capaciteMax}</span>
                </div>

                {/* Stats row */}
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-gray-800">{s.nbConseillers ?? 0}</p>
                    <p className="text-xs text-gray-500">Conseillers</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-catchup-primary">{s.nbCasActifs ?? 0}</p>
                    <p className="text-xs text-gray-500">Cas actifs</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
