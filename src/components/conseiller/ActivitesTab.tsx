'use client'

import { useState, useEffect, useCallback } from 'react'

interface Categorie {
  id: string
  code: string
  label: string
  icone: string
  couleur: string
}

interface Declaration {
  id: string
  categorieCode: string
  description: string | null
  dureeMinutes: number
  dateActivite: string
  dateSemaine: string
  source: string
  statut: string
  commentaireConseiller: string | null
  creeLe: string
}

interface SemaineResume {
  semaine: string
  totalHeures: number
  totalValideesHeures: number
  objectifHeures: number
  parCategorie: Record<string, { totalMinutes: number; count: number; validees: number }>
  nbDeclarations: number
}

function getMondayISO(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return dateStr }
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

const STATUT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  en_attente: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente' },
  validee: { bg: 'bg-green-100', text: 'text-green-700', label: 'Validee' },
  refusee: { bg: 'bg-red-100', text: 'text-red-700', label: 'Refusee' },
}

export default function ActivitesTab({ referralId }: { referralId: string }) {
  const [categories, setCategories] = useState<Categorie[]>([])
  const [declarations, setDeclarations] = useState<Declaration[]>([])
  const [resume, setResume] = useState<SemaineResume | null>(null)
  const [loading, setLoading] = useState(true)
  const [semaine, setSemaine] = useState(getMondayISO(new Date()))
  const [objectifInput, setObjectifInput] = useState('')
  const [savingObjectif, setSavingObjectif] = useState(false)

  // Formulaire d'ajout
  const [showForm, setShowForm] = useState(false)
  const [formCat, setFormCat] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDuree, setFormDuree] = useState('60')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, declRes, semRes] = await Promise.all([
        fetch('/api/conseiller/activites/categories'),
        fetch(`/api/conseiller/file-active/${referralId}/activites?semaine=${semaine}`),
        fetch(`/api/conseiller/file-active/${referralId}/activites/semaine?semaine=${semaine}`),
      ])
      const cats = catRes.ok ? await catRes.json() : []
      const decls = declRes.ok ? await declRes.json() : []
      const sem = semRes.ok ? await semRes.json() : null
      setCategories(Array.isArray(cats) ? cats : [])
      setDeclarations(Array.isArray(decls) ? decls : decls.data || [])
      setResume(sem?.data || sem)
      setObjectifInput(String((sem?.data || sem)?.objectifHeures ?? 5))
    } catch (err) {
      console.error('[ActivitesTab] Erreur:', err)
    }
    setLoading(false)
  }, [referralId, semaine])

  useEffect(() => { fetchData() }, [fetchData])

  const catMap = Object.fromEntries(categories.map(c => [c.code, c]))

  const handleValidate = async (actId: string, statut: 'validee' | 'refusee') => {
    await fetch(`/api/conseiller/file-active/${referralId}/activites/${actId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    fetchData()
  }

  const handleSubmitDeclaration = async () => {
    if (!formCat || !formDuree || !formDate) return
    setSubmitting(true)
    await fetch(`/api/conseiller/file-active/${referralId}/activites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categorieCode: formCat,
        description: formDesc || null,
        dureeMinutes: parseInt(formDuree),
        dateActivite: formDate,
      }),
    })
    setShowForm(false)
    setFormDesc('')
    setFormDuree('60')
    setSubmitting(false)
    fetchData()
  }

  const handleSaveObjectif = async () => {
    const heures = parseFloat(objectifInput)
    if (isNaN(heures) || heures < 0) return
    setSavingObjectif(true)
    await fetch(`/api/conseiller/file-active/${referralId}/objectifs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cibleHeures: heures, semaine }),
    })
    setSavingObjectif(false)
    fetchData()
  }

  // Navigation semaine
  const prevWeek = () => {
    const d = new Date(semaine)
    d.setDate(d.getDate() - 7)
    setSemaine(d.toISOString().split('T')[0])
  }
  const nextWeek = () => {
    const d = new Date(semaine)
    d.setDate(d.getDate() + 7)
    setSemaine(d.toISOString().split('T')[0])
  }
  const isCurrentWeek = semaine === getMondayISO(new Date())

  const progressPct = resume?.objectifHeures ? Math.min(100, Math.round((resume.totalHeures / resume.objectifHeures) * 100)) : 0
  const progressColor = progressPct >= 70 ? 'bg-green-500' : progressPct >= 30 ? 'bg-amber-500' : 'bg-red-400'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-catchup-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation semaine */}
      <div className="flex items-center justify-between">
        <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-gray-800">
            Semaine du {formatDate(semaine)}
          </h3>
          {!isCurrentWeek && (
            <button onClick={() => setSemaine(getMondayISO(new Date()))} className="text-xs text-catchup-primary hover:underline">
              Revenir a cette semaine
            </button>
          )}
        </div>
        <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Progression */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-gray-800">
              {resume?.totalHeures ?? 0}h <span className="text-base font-normal text-gray-400">/ {resume?.objectifHeures ?? 5}h</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{resume?.nbDeclarations ?? 0} activite(s) declaree(s)</p>
          </div>
          <span className="text-sm font-semibold text-gray-600">{progressPct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${progressPct}%` }} />
        </div>

        {/* Répartition par catégorie */}
        {resume?.parCategorie && Object.keys(resume.parCategorie).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(resume.parCategorie).map(([code, data]) => {
              const cat = catMap[code]
              return (
                <span key={code} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 border border-gray-200">
                  <span>{cat?.icone || '?'}</span>
                  <span>{cat?.label || code}</span>
                  <span className="text-gray-500 ml-0.5">{formatMinutes(data.totalMinutes)}</span>
                </span>
              )
            })}
          </div>
        )}

        {/* Objectif ajustable */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
          <span className="text-xs text-gray-500">Objectif :</span>
          <input
            type="number"
            min="0"
            max="40"
            step="0.5"
            value={objectifInput}
            onChange={e => setObjectifInput(e.target.value)}
            className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none"
          />
          <span className="text-xs text-gray-500">h/semaine</span>
          <button
            onClick={handleSaveObjectif}
            disabled={savingObjectif}
            className="px-3 py-1 text-xs bg-catchup-primary text-white rounded-lg hover:bg-catchup-primary/90 transition-colors disabled:opacity-50"
          >
            {savingObjectif ? '...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-catchup-primary text-white rounded-xl text-sm font-medium hover:bg-catchup-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une activite
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Nouvelle activite</h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map(cat => (
              <button
                key={cat.code}
                onClick={() => setFormCat(cat.code)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all ${
                  formCat === cat.code
                    ? 'border-catchup-primary bg-catchup-primary/5 text-catchup-primary font-medium ring-2 ring-catchup-primary/20'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <span>{cat.icone}</span>
                <span className="truncate text-xs">{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duree (minutes)</label>
              <input
                type="number"
                min="5"
                max="480"
                step="5"
                value={formDuree}
                onChange={e => setFormDuree(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="Optionnel..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button
              onClick={handleSubmitDeclaration}
              disabled={!formCat || !formDuree || submitting}
              className="px-4 py-2 text-sm bg-catchup-primary text-white rounded-lg hover:bg-catchup-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des déclarations */}
      <div className="space-y-2">
        {declarations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Aucune activite declaree cette semaine</p>
          </div>
        ) : (
          declarations.map(d => {
            const cat = catMap[d.categorieCode]
            const style = STATUT_STYLES[d.statut] || STATUT_STYLES.en_attente
            return (
              <div key={d.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
                <span className="text-xl shrink-0">{cat?.icone || '?'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">{cat?.label || d.categorieCode}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(d.dateActivite)} — {formatMinutes(d.dureeMinutes)}
                    {d.description && <span className="ml-1 text-gray-400">| {d.description}</span>}
                  </p>
                </div>
                {d.statut === 'en_attente' && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleValidate(d.id, 'validee')}
                      className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                      title="Valider"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleValidate(d.id, 'refusee')}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Refuser"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
