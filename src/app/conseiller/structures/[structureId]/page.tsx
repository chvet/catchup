'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'
import dynamic from 'next/dynamic'
import type { MapMarker } from '@/components/MapView'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface StructureDetail {
  id: string
  nom: string
  slug?: string
  type: string
  departements: string
  ageMin: number
  ageMax: number
  specialites: string
  capaciteMax: number
  actif: number
  adresse?: string | null
  codePostal?: string | null
  ville?: string | null
  latitude?: number | null
  longitude?: number | null
  promptPersonnalise?: string | null
  nbConseillers?: number
  nbCasActifs?: number
}

interface ConseillerItem {
  id: string
  prenom: string
  nom: string
  email: string
  role: string
  derniereConnexion: string | null
  actif: number
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

export default function StructureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const conseiller = useConseiller()
  const structureId = params.structureId as string

  const [structure, setStructure] = useState<StructureDetail | null>(null)
  const [conseillers, setConseillers] = useState<ConseillerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    nom: '',
    type: 'mission_locale',
    departements: '',
    ageMin: 16,
    ageMax: 25,
    specialites: '',
    capaciteMax: 50,
  })

  const [slugEditing, setSlugEditing] = useState(false)
  const [slugValue, setSlugValue] = useState('')
  const [slugSaving, setSlugSaving] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // État pour l'édition de l'adresse
  const [adresseEditing, setAdresseEditing] = useState(false)
  const [adresseForm, setAdresseForm] = useState({ adresse: '', codePostal: '', ville: '' })
  const [adresseSaving, setAdresseSaving] = useState(false)

  // Prompt IA personnalise
  const [promptValue, setPromptValue] = useState('')
  const [promptSaving, setPromptSaving] = useState(false)
  const [promptSaved, setPromptSaved] = useState(false)

  const isAdmin = conseiller?.role === 'admin_structure' || conseiller?.role === 'super_admin'
  const isSuperAdmin = conseiller?.role === 'super_admin'

  const parseSafe = (val: string | null | undefined, fallback: string[] = []): string[] => {
    try { return JSON.parse(val || '[]') } catch { return fallback }
  }

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/conseiller/structures/${structureId}`)
      if (!res.ok) throw new Error('Structure non trouvée')
      const data = await res.json()
      setStructure(data.structure || data)
      setConseillers(data.conseillers || [])
    } catch {
      // redirect on error
    } finally {
      setLoading(false)
    }
  }, [structureId])

  useEffect(() => {
    if (!isAdmin) return
    fetchData()
  }, [isAdmin, fetchData])

  useEffect(() => {
    if (structure) {
      const deps = parseSafe(structure.departements)
      const specs = parseSafe(structure.specialites)
      setEditForm({
        nom: structure.nom,
        type: structure.type,
        departements: deps.join(', '),
        ageMin: structure.ageMin,
        ageMax: structure.ageMax,
        specialites: specs.join(', '),
        capaciteMax: structure.capaciteMax,
      })
      setSlugValue(structure.slug || '')
      setAdresseForm({
        adresse: structure.adresse || '',
        codePostal: structure.codePostal || '',
        ville: structure.ville || '',
      })
      setPromptValue(structure.promptPersonnalise || '')
    }
  }, [structure])

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-500">Accès réservé aux administrateurs</p>
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

  if (!structure) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-gray-500">Structure non trouvée</p>
        <button
          onClick={() => router.push('/conseiller/structures')}
          className="mt-4 text-catchup-primary hover:underline text-sm"
        >
          Retour aux structures
        </button>
      </div>
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/conseiller/structures/${structureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          departements: editForm.departements.split(',').map(d => d.trim()),
          specialites: editForm.specialites.split(',').map(s => s.trim()),
        }),
      })
      if (res.ok) {
        await fetchData()
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/conseiller/structures/${structureId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/conseiller/structures')
    }
  }

  const handleToggleActif = async (conseillerId: string, currentActif: number) => {
    const res = await fetch(`/api/conseiller/conseillers/${conseillerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif: currentActif ? 0 : 1 }),
    })
    if (res.ok) {
      setConseillers(prev =>
        prev.map(c => c.id === conseillerId ? { ...c, actif: currentActif ? 0 : 1 } : c)
      )
    }
  }

  const structureUrl = structure.slug
    ? `https://catchup.jaeprive.fr/?s=${structure.slug}`
    : null
  const encodedUrl = structureUrl ? encodeURIComponent(structureUrl) : ''
  const qrCodeSrc = structureUrl
    ? `/api/qrcode?size=200&data=${encodedUrl}`
    : null
  const qrCodeLargeSrc = structureUrl
    ? `/api/qrcode?size=300&data=${encodedUrl}`
    : null

  const handleCopyLink = async () => {
    if (!structureUrl) return
    try {
      await navigator.clipboard.writeText(structureUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleDownloadQR = async () => {
    if (!qrCodeSrc) return
    const link = document.createElement('a')
    link.href = qrCodeSrc
    link.download = `qrcode-${structure.slug}.png`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintPoster = () => {
    if (!structureUrl || !qrCodeLargeSrc) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Affiche Catch'Up - ${structure.nom}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 100vh; padding: 40px; text-align: center;
          }
          h1 { font-size: 2.5rem; color: #1a1a1a; margin-bottom: 1rem; }
          .qr { margin: 2rem 0; }
          .url { font-size: 1.1rem; color: #555; margin-bottom: 1.5rem; word-break: break-all; }
          .cta { font-size: 1.4rem; color: #6366f1; font-weight: 600; }
          @media print { body { padding: 60px; } }
        </style>
      </head>
      <body>
        <h1>${structure.nom}</h1>
        <div class="qr"><img src="${window.location.origin}${qrCodeLargeSrc}" alt="QR Code" width="300" height="300" /></div>
        <p class="url">${structureUrl}</p>
        <p class="cta">Scannez pour acc&eacute;der &agrave; Catch&rsquo;Up</p>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleSlugSave = async () => {
    if (!slugValue.trim()) return
    setSlugSaving(true)
    try {
      const res = await fetch(`/api/conseiller/structures/${structureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugValue.trim().toLowerCase() }),
      })
      if (res.ok) {
        await fetchData()
        setSlugEditing(false)
      }
    } finally {
      setSlugSaving(false)
    }
  }

  const handleAdresseSave = async () => {
    setAdresseSaving(true)
    try {
      const res = await fetch(`/api/conseiller/structures/${structureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adresse: adresseForm.adresse.trim(),
          codePostal: adresseForm.codePostal.trim(),
          ville: adresseForm.ville.trim(),
        }),
      })
      if (res.ok) {
        await fetchData()
        setAdresseEditing(false)
      }
    } finally {
      setAdresseSaving(false)
    }
  }

  const handlePromptSave = async () => {
    setPromptSaving(true)
    try {
      const res = await fetch(`/api/conseiller/structures/${structureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptPersonnalise: promptValue.trim() }),
      })
      if (res.ok) {
        await fetchData()
        setPromptSaved(true)
        setTimeout(() => setPromptSaved(false), 2000)
      }
    } finally {
      setPromptSaving(false)
    }
  }

  const deps = parseSafe(structure.departements)
  const specs = parseSafe(structure.specialites)

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push('/conseiller/structures')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-catchup-primary mb-6 transition-colors"
      >
        <span>←</span>
        <span>Retour aux structures</span>
      </button>

      {/* Structure info card */}
      {editing ? (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Modifier la structure</h2>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Annuler
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={editForm.nom}
                onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={editForm.type}
                onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
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
                value={editForm.departements}
                onChange={e => setEditForm(f => ({ ...f, departements: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                placeholder="75, 92, 93"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spécialités</label>
              <input
                type="text"
                value={editForm.specialites}
                onChange={e => setEditForm(f => ({ ...f, specialites: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                placeholder="insertion, orientation, decrochage"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Âge min</label>
                <input
                  type="number"
                  value={editForm.ageMin}
                  onChange={e => setEditForm(f => ({ ...f, ageMin: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Âge max</label>
                <input
                  type="number"
                  value={editForm.ageMax}
                  onChange={e => setEditForm(f => ({ ...f, ageMax: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacité max</label>
              <input
                type="number"
                value={editForm.capaciteMax}
                onChange={e => setEditForm(f => ({ ...f, capaciteMax: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-catchup-primary text-white rounded-lg font-medium hover:bg-catchup-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{structure.nom}</h2>
              <span className={`inline-block mt-1 px-3 py-1 text-xs rounded-full font-medium ${TYPE_COLORS[structure.type] || TYPE_COLORS.autre}`}>
                {TYPE_LABELS[structure.type] || structure.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 text-sm text-catchup-primary border border-catchup-primary rounded-lg hover:bg-catchup-primary/10 transition-colors"
              >
                Modifier
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Départements */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Départements</p>
              <div className="flex flex-wrap gap-1">
                {deps.map((d: string) => (
                  <span key={d} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Tranche d'âge */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Tranche d&apos;âge</p>
              <p className="text-sm font-medium text-gray-700">{structure.ageMin} - {structure.ageMax} ans</p>
            </div>

            {/* Spécialités */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Spécialités</p>
              <div className="flex flex-wrap gap-1">
                {specs.length > 0 ? specs.map((sp: string) => (
                  <span key={sp} className="px-2 py-0.5 bg-catchup-primary/10 text-catchup-primary text-xs rounded">
                    {sp}
                  </span>
                )) : (
                  <span className="text-xs text-gray-400">Aucune</span>
                )}
              </div>
            </div>

            {/* Capacité */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Capacité max</p>
              <p className="text-sm font-medium text-gray-700">{structure.capaciteMax} places</p>
            </div>
          </div>
        </div>
      )}

      {/* Adresse & Carte */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Adresse</h3>
          {isAdmin && !adresseEditing && (
            <button
              onClick={() => {
                setAdresseForm({
                  adresse: structure.adresse || '',
                  codePostal: structure.codePostal || '',
                  ville: structure.ville || '',
                })
                setAdresseEditing(true)
              }}
              className="px-2 py-1 text-xs text-catchup-primary border border-catchup-primary rounded hover:bg-catchup-primary/10 transition-colors"
            >
              Modifier
            </button>
          )}
        </div>

        {adresseEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={adresseForm.adresse}
                onChange={e => setAdresseForm(f => ({ ...f, adresse: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                placeholder="12 rue de la République"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                <input
                  type="text"
                  value={adresseForm.codePostal}
                  onChange={e => setAdresseForm(f => ({ ...f, codePostal: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                  placeholder="69008"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={adresseForm.ville}
                  onChange={e => setAdresseForm(f => ({ ...f, ville: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                  placeholder="Lyon"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAdresseEditing(false)}
                className="px-3 py-1.5 text-gray-500 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAdresseSave}
                disabled={adresseSaving}
                className="px-4 py-1.5 bg-catchup-primary text-white rounded-lg text-sm font-medium hover:bg-catchup-primary/90 transition-colors disabled:opacity-50"
              >
                {adresseSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {structure.adresse || structure.ville ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">📍</span>
                  <div>
                    {structure.adresse && <p className="text-sm text-gray-700">{structure.adresse}</p>}
                    <p className="text-sm text-gray-700">
                      {structure.codePostal && <span>{structure.codePostal} </span>}
                      {structure.ville && <span>{structure.ville}</span>}
                    </p>
                  </div>
                </div>
                {structure.latitude && structure.longitude && (
                  <div style={{ height: '150px' }} className="rounded-lg overflow-hidden">
                    <MapView
                      markers={[
                        {
                          lat: structure.latitude,
                          lng: structure.longitude,
                          color: 'blue',
                          label: structure.nom,
                          popup: `${structure.adresse}, ${structure.codePostal} ${structure.ville}`,
                        },
                      ]}
                      center={[structure.latitude, structure.longitude]}
                      zoom={15}
                      height="150px"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucune adresse renseignée</p>
            )}
          </div>
        )}
      </div>

      {/* Lien & QR Code */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lien &amp; QR Code</h3>

        {/* Slug */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Slug de la structure</p>
          {slugEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={slugValue}
                onChange={e => setSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary"
                placeholder="mon-structure"
              />
              <button
                onClick={handleSlugSave}
                disabled={slugSaving}
                className="px-3 py-2 bg-catchup-primary text-white rounded-lg text-sm font-medium hover:bg-catchup-primary/90 transition-colors disabled:opacity-50"
              >
                {slugSaving ? '...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => { setSlugEditing(false); setSlugValue(structure.slug || '') }}
                className="px-3 py-2 text-gray-500 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
                {structure.slug || <span className="text-gray-400 italic">Non défini</span>}
              </span>
              <button
                onClick={() => { setSlugValue(structure.slug || ''); setSlugEditing(true) }}
                className="px-2 py-1 text-xs text-catchup-primary border border-catchup-primary rounded hover:bg-catchup-primary/10 transition-colors"
              >
                Modifier
              </button>
            </div>
          )}
        </div>

        {structureUrl ? (
          <>
            {/* Lien personnalise */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1">Lien personnalisé</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={structureUrl}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    linkCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-catchup-primary text-white hover:bg-catchup-primary/90'
                  }`}
                >
                  {linkCopied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">QR Code</p>
              <div className="flex items-start gap-4">
                <div className="border border-gray-200 rounded-lg p-2 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeSrc!}
                    alt={`QR Code pour ${structure.nom}`}
                    width={200}
                    height={200}
                    className="block"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDownloadQR}
                    className="px-4 py-2 text-sm font-medium text-catchup-primary border border-catchup-primary rounded-lg hover:bg-catchup-primary/10 transition-colors"
                  >
                    Télécharger le QR Code
                  </button>
                  <button
                    onClick={handlePrintPoster}
                    className="px-4 py-2 text-sm font-medium text-white bg-catchup-primary rounded-lg hover:bg-catchup-primary/90 transition-colors"
                  >
                    Imprimer l&apos;affiche
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">
            Définissez un slug pour générer le lien personnalisé et le QR Code.
          </div>
        )}
      </div>

      {/* Prompt IA personnalise — visible admin_structure + super_admin */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            <span className="mr-2">&#x1F916;</span>Prompt IA personnalis&eacute;
          </h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800">
              &#x26A0;&#xFE0F; Ce prompt influence le comportement de l&apos;IA pour tous les b&eacute;n&eacute;ficiaires sourc&eacute;s par votre structure. Utilisez-le pour adapter l&apos;accompagnement IA &agrave; votre public cible.
            </p>
          </div>
          <textarea
            value={promptValue}
            onChange={e => {
              if (e.target.value.length <= 1000) {
                setPromptValue(e.target.value)
              }
            }}
            maxLength={1000}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-catchup-primary resize-vertical"
            placeholder="Ex: Notre structure accompagne principalement des d&eacute;crocheurs scolaires. L'IA doit &ecirc;tre particuli&egrave;rement bienveillante et &eacute;viter les r&eacute;f&eacute;rences au parcours scolaire classique."
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {promptValue.length}/1000 caract&egrave;res
            </span>
            <div className="flex items-center gap-2">
              {promptSaved && (
                <span className="text-sm text-green-600 font-medium">Enregistr&eacute; !</span>
              )}
              <button
                onClick={handlePromptSave}
                disabled={promptSaving || promptValue === (structure.promptPersonnalise || '')}
                className="px-4 py-1.5 bg-catchup-primary text-white rounded-lg text-sm font-medium hover:bg-catchup-primary/90 transition-colors disabled:opacity-50"
              >
                {promptSaving ? 'Enregistrement...' : 'Enregistrer le prompt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-500 mb-6">
              Êtes-vous sûr de vouloir supprimer la structure &quot;{structure.nom}&quot; ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{conseillers.length}</p>
          <p className="text-sm text-gray-500">Conseillers</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-catchup-primary">{structure.nbCasActifs ?? 0}</p>
          <p className="text-sm text-gray-500">Cas actifs</p>
        </div>
      </div>

      {/* Conseillers table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Conseillers</h3>
          <button
            onClick={() => router.push(`/conseiller/conseillers?new=true&structureId=${structureId}`)}
            className="px-3 py-1.5 bg-catchup-primary text-white rounded-lg text-sm font-medium hover:bg-catchup-primary/90 transition-colors"
          >
            + Ajouter un conseiller
          </button>
        </div>

        {conseillers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">Aucun conseiller dans cette structure</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Dernière connexion</th>
                  <th className="px-4 py-3 font-medium">Actif</th>
                </tr>
              </thead>
              <tbody>
                {conseillers.map(c => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/conseiller/conseillers/${c.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-catchup-primary/10 text-catchup-primary flex items-center justify-center text-xs font-medium">
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
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.derniereConnexion
                        ? new Date(c.derniereConnexion).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : 'Jamais'
                      }
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleActif(c.id, c.actif)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${c.actif ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${c.actif ? 'left-5' : 'left-0.5'}`} />
                      </button>
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
