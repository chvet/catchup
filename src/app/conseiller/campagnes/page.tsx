'use client'

import { useState, useEffect, useCallback } from 'react'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

interface CampagneConseiller {
  id: string
  prenom: string | null
  nom: string | null
}

interface Campagne {
  id: string
  designation: string
  quantiteObjectif: number
  uniteOeuvre: string
  dateDebut: string
  dateFin: string
  statut: string
  avancement: number
  pourcentage: number
  conseillers: CampagneConseiller[]
}

interface StructureConseiller {
  id: string
  prenom: string
  nom: string
  role: string
}

const UNITES_OEUVRE = [
  'Beneficiaire(s)',
  'Lead(s)',
  'Prise(s) en charge',
  'Rendez-vous',
  'Accompagnement(s) termine(s)',
]

export default function CampagnesPage() {
  const conseiller = useConseiller()
  const isAdmin = conseiller?.role === 'admin_structure' || conseiller?.role === 'super_admin'

  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [loading, setLoading] = useState(true)
  const [conseillers, setConseillers] = useState<StructureConseiller[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    designation: '',
    quantiteObjectif: '',
    uniteOeuvre: UNITES_OEUVRE[0],
    uniteCustom: '',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    conseillerIds: [] as string[],
    selectAll: false,
  })

  const fetchCampagnes = useCallback(async () => {
    try {
      const res = await fetch('/api/conseiller/campagnes')
      const data = await res.json()
      setCampagnes(data.campagnes || [])
    } catch { /* */ }
    setLoading(false)
  }, [])

  const fetchConseillers = useCallback(async () => {
    if (!conseiller?.structure?.id) return
    try {
      const res = await fetch(`/api/conseiller/conseillers?structureId=${conseiller.structure.id}&actif=1`)
      const data = await res.json()
      setConseillers(data.data || [])
    } catch { /* */ }
  }, [conseiller?.structure?.id])

  useEffect(() => { fetchCampagnes() }, [fetchCampagnes])
  useEffect(() => { fetchConseillers() }, [fetchConseillers])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      designation: '',
      quantiteObjectif: '',
      uniteOeuvre: UNITES_OEUVRE[0],
      uniteCustom: '',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '',
      conseillerIds: [],
      selectAll: false,
    })
    setShowModal(true)
  }

  const openEdit = (c: Campagne) => {
    setEditingId(c.id)
    const isCustom = !UNITES_OEUVRE.includes(c.uniteOeuvre)
    setForm({
      designation: c.designation,
      quantiteObjectif: String(c.quantiteObjectif),
      uniteOeuvre: isCustom ? 'custom' : c.uniteOeuvre,
      uniteCustom: isCustom ? c.uniteOeuvre : '',
      dateDebut: c.dateDebut.split('T')[0],
      dateFin: c.dateFin.split('T')[0],
      conseillerIds: c.conseillers.map(cc => cc.id),
      selectAll: c.conseillers.length === conseillers.length && conseillers.length > 0,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const unite = form.uniteOeuvre === 'custom' ? form.uniteCustom : form.uniteOeuvre
    const payload = {
      designation: form.designation,
      quantiteObjectif: form.quantiteObjectif,
      uniteOeuvre: unite,
      dateDebut: form.dateDebut,
      dateFin: form.dateFin,
      conseillerIds: form.conseillerIds,
    }

    try {
      const url = editingId ? `/api/conseiller/campagnes/${editingId}` : '/api/conseiller/campagnes'
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setShowModal(false)
        fetchCampagnes()
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur')
      }
    } catch { alert('Erreur de connexion') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/conseiller/campagnes/${id}`, { method: 'DELETE' })
      fetchCampagnes()
    } catch { /* */ }
    setDeleting(null)
  }

  const toggleConseiller = (id: string) => {
    setForm(f => {
      const ids = f.conseillerIds.includes(id)
        ? f.conseillerIds.filter(i => i !== id)
        : [...f.conseillerIds, id]
      return { ...f, conseillerIds: ids, selectAll: ids.length === conseillers.length }
    })
  }

  const toggleAll = () => {
    setForm(f => {
      const all = !f.selectAll
      return { ...f, selectAll: all, conseillerIds: all ? conseillers.map(c => c.id) : [] }
    })
  }

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
    if (days === 1) return 'Demain'
    return `${days}j restants`
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Acces reserve aux administrateurs de structure.</p>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Campagnes</h1>
          <p className="text-sm text-gray-500">Definissez des objectifs pour votre equipe (max 3)</p>
        </div>
        <button
          onClick={openCreate}
          disabled={campagnes.filter(c => c.statut !== 'archivee').length >= 3}
          className="px-4 py-2.5 bg-catchup-primary text-white text-sm font-medium rounded-xl hover:bg-catchup-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          + Nouvelle campagne
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-catchup-primary rounded-full animate-spin" />
        </div>
      ) : campagnes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-catchup-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-catchup-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucune campagne</h3>
          <p className="text-sm text-gray-500 mb-4">Creez votre premiere campagne pour definir des objectifs.</p>
          <button onClick={openCreate} className="px-4 py-2 bg-catchup-primary text-white text-sm rounded-lg hover:bg-catchup-primary/90 transition-colors">
            Creer une campagne
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campagnes.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{c.designation}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(c.dateDebut).toLocaleDateString('fr-FR')} — {new Date(c.dateFin).toLocaleDateString('fr-FR')}
                    <span className="ml-2 font-medium">{daysLabel(c.dateFin)}</span>
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-catchup-primary rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button
                    onClick={() => { if (confirm(`Supprimer "${c.designation}" ?`)) handleDelete(c.id) }}
                    disabled={deleting === c.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-semibold text-gray-800">{c.avancement} / {c.quantiteObjectif} {c.uniteOeuvre}</span>
                  <span className="font-bold text-lg">{c.pourcentage}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor(c.pourcentage, c.dateFin)}`}
                    style={{ width: `${c.pourcentage}%` }}
                  />
                </div>
              </div>

              {/* Conseillers assignés */}
              {c.conseillers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 mr-1">Assignes :</span>
                  {c.conseillers.map(cc => (
                    <span key={cc.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      {cc.prenom} {cc.nom?.[0]}.
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal création / édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {editingId ? 'Modifier la campagne' : 'Nouvelle campagne'}
              </h2>

              <div className="space-y-4">
                {/* Designation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                    placeholder="Ex: Objectif T2 2026"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                  />
                </div>

                {/* Quantité + Unité */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objectif (quantite)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.quantiteObjectif}
                      onChange={e => setForm(f => ({ ...f, quantiteObjectif: e.target.value }))}
                      placeholder="50"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unite d&apos;oeuvre</label>
                    <select
                      value={form.uniteOeuvre}
                      onChange={e => setForm(f => ({ ...f, uniteOeuvre: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    >
                      {UNITES_OEUVRE.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                      <option value="custom">Autre (personnalise)...</option>
                    </select>
                  </div>
                </div>

                {form.uniteOeuvre === 'custom' && (
                  <input
                    type="text"
                    value={form.uniteCustom}
                    onChange={e => setForm(f => ({ ...f, uniteCustom: e.target.value }))}
                    placeholder="Unite personnalisee..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                  />
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de debut</label>
                    <input
                      type="date"
                      value={form.dateDebut}
                      onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                    <input
                      type="date"
                      value={form.dateFin}
                      onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                    />
                  </div>
                </div>

                {/* Assignation conseillers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conseillers assignes</label>
                  <label className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.selectAll}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-catchup-primary focus:ring-catchup-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Tous les conseillers ({conseillers.length})</span>
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                    {conseillers.map(c => (
                      <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.conseillerIds.includes(c.id)}
                          onChange={() => toggleConseiller(c.id)}
                          className="rounded border-gray-300 text-catchup-primary focus:ring-catchup-primary"
                        />
                        <span className="text-sm text-gray-700">{c.prenom} {c.nom}</span>
                        {c.role === 'admin_structure' && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Admin</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.designation || !form.quantiteObjectif || !form.dateFin}
                  className="px-5 py-2 bg-catchup-primary text-white text-sm font-medium rounded-lg hover:bg-catchup-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Creer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
