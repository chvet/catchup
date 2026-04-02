'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useConseiller } from '@/components/conseiller/ConseillerProvider'

interface CampagneConseiller {
  id: string
  prenom: string | null
  nom: string | null
}

interface Campagne {
  id: string
  slug: string | null
  designation: string
  quantiteObjectif: number
  uniteOeuvre: string
  dateDebut: string
  dateFin: string
  statut: string
  remplaceeParId: string | null
  archiveeLe: string | null
  avancement: number
  pourcentage: number
  conseillers: CampagneConseiller[]
  creeLe: string
  misAJourLe: string
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
  const [structureSlug, setStructureSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [conseillers, setConseillers] = useState<StructureConseiller[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showReplaceModal, setShowReplaceModal] = useState<string | null>(null) // campagneId à remplacer
  const [replacing, setReplacing] = useState(false)
  const [showArchives, setShowArchives] = useState(false)

  // Form state pour "Remplacer"
  const [replaceForm, setReplaceForm] = useState({
    designation: '',
    quantiteObjectif: '',
    uniteOeuvre: UNITES_OEUVRE[0],
    uniteCustom: '',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    conseillerIds: [] as string[],
    selectAll: false,
  })

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
      if (data.structureSlug) setStructureSlug(data.structureSlug)
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

  const savingRef = useRef(false)
  const handleSave = async () => {
    if (savingRef.current) return
    savingRef.current = true
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
    savingRef.current = false
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

  const openReplace = (c: Campagne) => {
    setShowReplaceModal(c.id)
    setReplaceForm({
      designation: '',
      quantiteObjectif: String(c.quantiteObjectif),
      uniteOeuvre: UNITES_OEUVRE.includes(c.uniteOeuvre) ? c.uniteOeuvre : 'custom',
      uniteCustom: UNITES_OEUVRE.includes(c.uniteOeuvre) ? '' : c.uniteOeuvre,
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '',
      conseillerIds: c.conseillers.map(cc => cc.id),
      selectAll: c.conseillers.length === conseillers.length && conseillers.length > 0,
    })
  }

  const handleReplace = async () => {
    if (!showReplaceModal || replacing) return
    setReplacing(true)
    const unite = replaceForm.uniteOeuvre === 'custom' ? replaceForm.uniteCustom : replaceForm.uniteOeuvre
    try {
      const res = await fetch(`/api/conseiller/campagnes/${showReplaceModal}/remplacer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designation: replaceForm.designation,
          quantiteObjectif: replaceForm.quantiteObjectif,
          uniteOeuvre: unite,
          dateDebut: replaceForm.dateDebut,
          dateFin: replaceForm.dateFin,
          conseillerIds: replaceForm.conseillerIds,
        }),
      })
      if (res.ok) {
        setShowReplaceModal(null)
        fetchCampagnes()
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur')
      }
    } catch { alert('Erreur de connexion') }
    setReplacing(false)
  }

  const toggleReplaceConseiller = (id: string) => {
    setReplaceForm(f => {
      const ids = f.conseillerIds.includes(id)
        ? f.conseillerIds.filter(i => i !== id)
        : [...f.conseillerIds, id]
      return { ...f, conseillerIds: ids, selectAll: ids.length === conseillers.length }
    })
  }

  const toggleReplaceAll = () => {
    setReplaceForm(f => {
      const all = !f.selectAll
      return { ...f, selectAll: all, conseillerIds: all ? conseillers.map(c => c.id) : [] }
    })
  }

  // Séparer campagnes actives et archivées
  const activeCampagnes = campagnes.filter(c => c.statut !== 'archivee')
  const archivedCampagnes = campagnes.filter(c => c.statut === 'archivee')

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

  const getCampagneUrl = (c: Campagne) => {
    if (!structureSlug) return null
    // Utiliser le slug (permanent) si disponible, sinon l'ID
    const identifier = c.slug || c.id
    return `https://catchup.jaeprive.fr/?s=${structureSlug}&c=${identifier}`
  }

  const getQrCodeUrl = (c: Campagne, size = 200) => {
    const url = getCampagneUrl(c)
    if (!url) return null
    return `/api/qrcode?data=${encodeURIComponent(url)}&size=${size}&v=2`
  }

  const handleCopyLink = async (c: Campagne) => {
    const url = getCampagneUrl(c)
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(c.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(c.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleDownloadQR = (c: Campagne) => {
    const qrUrl = getQrCodeUrl(c, 400)
    if (!qrUrl) return
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `qr-campagne-${c.designation.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.svg`
    a.target = '_blank'
    a.click()
  }

  const handlePrintQR = (c: Campagne) => {
    const qrUrl = getQrCodeUrl(c, 300)
    const campagneUrl = getCampagneUrl(c)
    if (!qrUrl || !campagneUrl) return
    const w = window.open('', '_blank', 'width=500,height=700')
    if (!w) return
    const designation = c.designation
    w.document.write(`
      <html><head><title>QR Code — ${designation}</title>
      <style>body{font-family:system-ui,sans-serif;text-align:center;padding:40px 20px}
      h2{color:#1a1a2e;margin-bottom:4px}p{color:#666;font-size:14px}
      img{margin:24px auto;display:block}
      .url{background:#f3f4f6;padding:8px 16px;border-radius:8px;font-size:12px;color:#4b5563;word-break:break-all;display:inline-block;margin-top:12px}
      @media print{body{padding:20px}}</style></head><body>
      <h2>Campagne : ${designation}</h2>
      <p>Scannez ce QR code pour acceder a Catch'Up</p>
      <img src="${qrUrl}" width="300" height="300" />
      <div class="url">${campagneUrl}</div>
      <script>setTimeout(()=>window.print(),500)<\/script>
      </body></html>
    `)
    w.document.close()
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
        <div className="flex items-center gap-2">
          {archivedCampagnes.length > 0 && (
            <button
              onClick={() => setShowArchives(!showArchives)}
              className="px-3 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {showArchives ? 'Masquer archives' : `Archives (${archivedCampagnes.length})`}
            </button>
          )}
          <button
            onClick={openCreate}
            disabled={activeCampagnes.length >= 3}
            className="px-4 py-2.5 bg-catchup-primary text-white text-sm font-medium rounded-xl hover:bg-catchup-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            + Nouvelle campagne
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-catchup-primary rounded-full animate-spin" />
        </div>
      ) : activeCampagnes.length === 0 && !showArchives ? (
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
          {activeCampagnes.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{c.designation}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(c.dateDebut).toLocaleDateString('fr-FR')} — {new Date(c.dateFin).toLocaleDateString('fr-FR')}
                    <span className="ml-2 font-medium">{daysLabel(c.dateFin)}</span>
                  </p>
                  {c.slug && (
                    <p className="text-[10px] text-indigo-500 mt-0.5 font-mono">slug: {c.slug}</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openReplace(c)}
                    title="Remplacer (archiver et creer une nouvelle avec le meme QR code)"
                    className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>
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

              {/* QR Code campagne */}
              {structureSlug && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-4">
                    {/* QR code preview */}
                    <div className="shrink-0">
                      <img
                        src={getQrCodeUrl(c, 200) || ''}
                        alt={`QR Code ${c.designation}`}
                        width={100}
                        height={100}
                        className="rounded-lg border border-gray-200"
                      />
                    </div>
                    {/* Actions */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-2">
                        QR Code permanent{c.slug ? ` (slug: ${c.slug})` : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleCopyLink(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          {copiedId === c.id ? (
                            <><span className="text-green-600">Copie !</span></>
                          ) : (
                            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copier le lien</>
                          )}
                        </button>
                        <button
                          onClick={() => handleDownloadQR(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Telecharger
                        </button>
                        <button
                          onClick={() => handlePrintQR(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          Imprimer
                        </button>
                      </div>
                      {/* Partage réseaux sociaux */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getCampagneUrl(c) || '')}&quote=${encodeURIComponent(`Decouvre Catch'Up, ton guide d'orientation professionnelle !`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#1877F2] text-white rounded-lg hover:bg-[#1877F2]/90 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          Facebook
                        </a>
                        <a
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getCampagneUrl(c) || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#0A66C2] text-white rounded-lg hover:bg-[#0A66C2]/90 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                          LinkedIn
                        </a>
                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getCampagneUrl(c) || '')}&text=${encodeURIComponent(`Decouvre Catch'Up, ton guide d'orientation !`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                          X
                        </a>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Decouvre Catch'Up pour ton orientation ! ${getCampagneUrl(c)}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#25D366] text-white rounded-lg hover:bg-[#25D366]/90 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp
                        </a>
                        <a
                          href={`mailto:?subject=${encodeURIComponent(`Catch'Up — Orientation professionnelle`)}&body=${encodeURIComponent(`Bonjour,\n\nDecouvrez Catch'Up, la plateforme d'orientation professionnelle.\n\nAccedez directement : ${getCampagneUrl(c)}\n\nBonne decouverte !`)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                          Email
                        </a>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1.5 truncate">
                        {getCampagneUrl(c)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Archives */}
      {showArchives && archivedCampagnes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            Campagnes archivees
          </h2>
          <div className="space-y-3">
            {archivedCampagnes.map(c => (
              <div key={c.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 opacity-75">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-600">{c.designation}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(c.dateDebut).toLocaleDateString('fr-FR')} — {new Date(c.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                    {c.archiveeLe && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        Archivee le {new Date(c.archiveeLe).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-600">
                    Archivee
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{c.avancement} / {c.quantiteObjectif} {c.uniteOeuvre}</span>
                    <span className="font-semibold text-gray-600">{c.pourcentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full bg-gray-400"
                      style={{ width: `${c.pourcentage}%` }}
                    />
                  </div>
                </div>
                {c.conseillers.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] text-gray-400">Assignes :</span>
                    {c.conseillers.map(cc => (
                      <span key={cc.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-500">
                        {cc.prenom} {cc.nom?.[0]}.
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
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
      {/* Modal Remplacer */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowReplaceModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Remplacer la campagne</h2>
                  <p className="text-xs text-gray-500">Le QR code et le lien restent identiques</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800">
                  L&apos;ancienne campagne sera archivee avec ses statistiques. La nouvelle campagne heritera du meme slug et QR code.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle designation</label>
                  <input
                    type="text"
                    value={replaceForm.designation}
                    onChange={e => setReplaceForm(f => ({ ...f, designation: e.target.value }))}
                    placeholder="Ex: Objectif T3 2026"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objectif (quantite)</label>
                    <input
                      type="number"
                      min="1"
                      value={replaceForm.quantiteObjectif}
                      onChange={e => setReplaceForm(f => ({ ...f, quantiteObjectif: e.target.value }))}
                      placeholder="50"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unite d&apos;oeuvre</label>
                    <select
                      value={replaceForm.uniteOeuvre}
                      onChange={e => setReplaceForm(f => ({ ...f, uniteOeuvre: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      {UNITES_OEUVRE.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                      <option value="custom">Autre (personnalise)...</option>
                    </select>
                  </div>
                </div>

                {replaceForm.uniteOeuvre === 'custom' && (
                  <input
                    type="text"
                    value={replaceForm.uniteCustom}
                    onChange={e => setReplaceForm(f => ({ ...f, uniteCustom: e.target.value }))}
                    placeholder="Unite personnalisee..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de debut</label>
                    <input
                      type="date"
                      value={replaceForm.dateDebut}
                      onChange={e => setReplaceForm(f => ({ ...f, dateDebut: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                    <input
                      type="date"
                      value={replaceForm.dateFin}
                      onChange={e => setReplaceForm(f => ({ ...f, dateFin: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conseillers assignes</label>
                  <label className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={replaceForm.selectAll}
                      onChange={toggleReplaceAll}
                      className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-sm font-medium text-gray-700">Tous les conseillers ({conseillers.length})</span>
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                    {conseillers.map(cc => (
                      <label key={cc.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={replaceForm.conseillerIds.includes(cc.id)}
                          onChange={() => toggleReplaceConseiller(cc.id)}
                          className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                        />
                        <span className="text-sm text-gray-700">{cc.prenom} {cc.nom}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowReplaceModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReplace}
                  disabled={replacing || !replaceForm.designation || !replaceForm.quantiteObjectif || !replaceForm.dateFin}
                  className="px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {replacing ? 'Remplacement...' : 'Remplacer et archiver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
