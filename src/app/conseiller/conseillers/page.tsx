'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

interface ConseillerItem {
  id: string
  prenom: string
  nom: string
  email: string
  role: string
  structureId: string | null
  structureNom?: string
  derniereConnexion: string | null
  actif: number
}

interface StructureOption {
  id: string
  nom: string
}

type SortKey = 'nom' | 'role' | 'structure'
type SortDir = 'asc' | 'desc'
type ViewMode = 'tableau' | 'fiches'

const ROLE_LABELS: Record<string, string> = {
  conseiller: 'Conseiller',
  admin_structure: 'Admin structure',
  super_admin: 'Super admin',
}

const ROLE_COLORS: Record<string, string> = {
  conseiller: 'bg-blue-100 text-blue-700',
  admin_structure: 'bg-purple-100 text-purple-700',
  super_admin: 'bg-red-100 text-red-700',
}

const ROLE_OPTIONS = [
  { value: '', label: 'Tous les rôles' },
  { value: 'conseiller', label: 'Conseiller' },
  { value: 'admin_structure', label: 'Admin structure' },
  { value: 'super_admin', label: 'Super admin' },
]

const ACTIF_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: '1', label: 'Actifs' },
  { value: '0', label: 'Inactifs' },
]

export default function ConseillersPage() {
  const currentConseiller = useConseiller()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [conseillers, setConseillers] = useState<ConseillerItem[]>([])
  const [structures, setStructures] = useState<StructureOption[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('tableau')

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [structureFilter, setStructureFilter] = useState('')
  const [actifFilter, setActifFilter] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('nom')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    role: 'conseiller',
    structureId: '',
  })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const isAdmin = currentConseiller?.role === 'admin_structure' || currentConseiller?.role === 'super_admin'
  const isSuperAdmin = currentConseiller?.role === 'super_admin'

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  // Load structures for dropdown
  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/conseiller/structures?all=true')
      .then(r => r.json())
      .then(data => setStructures((data.data || []).map((s: StructureOption) => ({ id: s.id, nom: s.nom }))))
      .catch(() => {})
  }, [isAdmin])

  // Load conseillers
  const fetchConseillers = useCallback(async () => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (roleFilter) params.set('role', roleFilter)
    if (structureFilter) params.set('structureId', structureFilter)
    if (actifFilter) params.set('actif', actifFilter)

    try {
      const res = await fetch(`/api/conseiller/conseillers?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setConseillers(data.data || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, roleFilter, structureFilter, actifFilter])

  useEffect(() => {
    if (!isAdmin) return
    fetchConseillers()
  }, [isAdmin, fetchConseillers])

  // Auto-open creation modal if ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      const sid = searchParams.get('structureId') || ''
      setFormData(f => ({ ...f, structureId: sid }))
      setEditingId(null)
      setShowModal(true)
    }
  }, [searchParams])

  // Sort logic
  const sortedConseillers = useMemo(() => {
    const sorted = [...conseillers]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'nom':
          cmp = `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
          break
        case 'role':
          cmp = (ROLE_LABELS[a.role] || a.role).localeCompare(ROLE_LABELS[b.role] || b.role)
          break
        case 'structure':
          cmp = (a.structureNom || '').localeCompare(b.structureNom || '')
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [conseillers, sortKey, sortDir])

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-500">Accès réservé aux administrateurs</p>
      </div>
    )
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData({ prenom: '', nom: '', email: '', password: '', role: 'conseiller', structureId: '' })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (c: ConseillerItem) => {
    setEditingId(c.id)
    setFormData({
      prenom: c.prenom,
      nom: c.nom,
      email: c.email,
      password: '',
      role: c.role,
      structureId: c.structureId || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.prenom || !formData.nom || !formData.email || !formData.role) {
      setFormError('Tous les champs obligatoires doivent être remplis.')
      return
    }
    if (!validateEmail(formData.email)) {
      setFormError('Format d\'email invalide.')
      return
    }
    if (!editingId && !formData.password) {
      setFormError('Le mot de passe est obligatoire pour la création.')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, string> = {
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        role: formData.role,
        structureId: formData.structureId,
      }
      if (formData.password) payload.motDePasse = formData.password

      const url = editingId
        ? `/api/conseiller/conseillers/${editingId}`
        : '/api/conseiller/conseillers'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowModal(false)
        fetchConseillers()
      } else {
        const err = await res.json().catch(() => ({}))
        setFormError(err.error || 'Une erreur est survenue.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/conseiller/conseillers/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setConseillers(prev => prev.filter(c => c.id !== id))
      setDeleteConfirm(null)
      if (showModal && editingId === id) setShowModal(false)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return 'Jamais'
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des conseillers</h1>
          <p className="text-gray-500 text-sm">{conseillers.length} conseiller(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-catchup-primary text-white rounded-lg text-sm font-medium hover:bg-catchup-primary/90 transition-colors"
        >
          + Nouveau conseiller
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Rechercher</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom ou email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
            />
          </div>

          {/* Role filter */}
          <div className="w-44">
            <label className="block text-xs text-gray-500 mb-1">Rôle</label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
            >
              {ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Structure filter (super_admin only) */}
          {isSuperAdmin && (
            <div className="w-52">
              <label className="block text-xs text-gray-500 mb-1">Structure</label>
              <select
                value={structureFilter}
                onChange={e => setStructureFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              >
                <option value="">Toutes les structures</option>
                {structures.map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>
          )}

          {/* Active filter */}
          <div className="w-32">
            <label className="block text-xs text-gray-500 mb-1">Statut</label>
            <select
              value={actifFilter}
              onChange={e => setActifFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
            >
              {ACTIF_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setViewMode('tableau')}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            viewMode === 'tableau'
              ? 'bg-catchup-primary text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Tableau
        </button>
        <button
          onClick={() => setViewMode('fiches')}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            viewMode === 'fiches'
              ? 'bg-catchup-primary text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Fiches
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedConseillers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-4">👥</p>
          <p className="text-gray-500 text-lg">Aucun conseiller trouvé</p>
        </div>
      ) : viewMode === 'tableau' ? (
        /* ===== TABLEAU MODE ===== */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => handleSort('nom')}
                  >
                    Prénom Nom {sortIcon('nom')}
                  </th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => handleSort('role')}
                  >
                    Rôle {sortIcon('role')}
                  </th>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => handleSort('structure')}
                  >
                    Structure {sortIcon('structure')}
                  </th>
                  <th className="px-4 py-3 font-medium">Dernière connexion</th>
                  <th className="px-4 py-3 font-medium">Actif</th>
                </tr>
              </thead>
              <tbody>
                {sortedConseillers.map(c => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openEdit(c)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-catchup-primary/10 text-catchup-primary flex items-center justify-center text-xs font-medium shrink-0">
                          {c.prenom?.[0]}{c.nom?.[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {c.prenom} {c.nom}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_COLORS[c.role] || 'bg-gray-100 text-gray-700'}`}>
                        {ROLE_LABELS[c.role] || c.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.structureNom || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.derniereConnexion)}</td>
                    <td className="px-4 py-3">
                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${c.actif ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ===== FICHES MODE ===== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedConseillers.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-catchup-primary/30 transition-all cursor-pointer"
              onClick={() => openEdit(c)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-catchup-primary/10 text-catchup-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {c.prenom?.[0]}{c.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{c.prenom} {c.nom}</h3>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_COLORS[c.role] || 'bg-gray-100 text-gray-700'}`}>
                    {ROLE_LABELS[c.role] || c.role}
                  </span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${c.actif ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600 truncate">{c.structureNom || 'Aucune structure'}</p>
                <p className="text-gray-500 truncate">{c.email}</p>
                <p className="text-xs text-gray-400">
                  Dernière connexion : {formatDate(c.derniereConnexion)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingId ? 'Modifier le conseiller' : 'Nouveau conseiller'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {formError}
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={e => setFormData(f => ({ ...f, prenom: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={e => setFormData(f => ({ ...f, nom: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                      placeholder="Dupont"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    placeholder="jean.dupont@structure.fr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe {editingId ? '(laisser vide pour ne pas modifier)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                    required={!editingId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    >
                      <option value="conseiller">Conseiller</option>
                      <option value="admin_structure">Admin structure</option>
                      {isSuperAdmin && <option value="super_admin">Super admin</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Structure *</label>
                    <select
                      value={formData.structureId}
                      onChange={e => setFormData(f => ({ ...f, structureId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    >
                      <option value="">Sélectionner...</option>
                      {structures.map(s => (
                        <option key={s.id} value={s.id}>{s.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-6">
                <div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); setDeleteConfirm(editingId) }}
                      className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-catchup-primary text-white rounded-lg font-medium hover:bg-catchup-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-500 mb-6">
              Êtes-vous sûr de vouloir désactiver ce conseiller ? Il ne pourra plus se connecter.
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
    </div>
  )
}
