'use client'

import { useState, useEffect, useCallback } from 'react'

interface Provider {
  id: string
  providerType: string
  providerName: string
  actif: boolean
  priorite: number
  configured: boolean
  dernierSucces: string | null
  dernierEchec: string | null
  dernierMessageErreur: string | null
  reglages: Record<string, unknown>
}

const TYPE_LABELS: Record<string, string> = {
  llm: 'Intelligence Artificielle (LLM)',
  sms: 'SMS',
  email: 'Email',
  tts: 'Synthese vocale (TTS)',
  stt: 'Reconnaissance vocale (STT)',
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI (GPT-4o)',
  anthropic: 'Anthropic (Claude)',
  mistral: 'Mistral AI',
  vonage: 'Vonage',
  ovh: 'OVH',
  smtp: 'SMTP Direct',
  o365: 'Microsoft 365 (Graph)',
  brevo: 'Brevo (ex-Sendinblue)',
  google_tts: 'Google Translate TTS',
}

function StatusBadge({ provider }: { provider: Provider }) {
  if (!provider.actif) {
    return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Desactive</span>
  }
  if (!provider.configured) {
    return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">Cles manquantes</span>
  }
  if (provider.dernierEchec && (!provider.dernierSucces || provider.dernierEchec > provider.dernierSucces)) {
    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Erreur</span>
  }
  if (provider.dernierSucces) {
    return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Connecte</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">Non teste</span>
}

function timeAgo(iso: string | null): string {
  if (!iso) return '-'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'a l\'instant'
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/conseiller/admin/providers')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setProviders(data.providers || [])
    } catch (err) {
      console.error(err)
      setToast('Erreur de chargement des fournisseurs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProviders() }, [fetchProviders])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const toggleActif = (id: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, actif: !p.actif } : p))
    setDirty(true)
  }

  const movePriority = (id: string, direction: 'up' | 'down') => {
    setProviders(prev => {
      const idx = prev.findIndex(p => p.id === id)
      if (idx < 0) return prev
      const p = prev[idx]
      const sameType = prev.filter(x => x.providerType === p.providerType)
      const posInType = sameType.findIndex(x => x.id === id)
      if (direction === 'up' && posInType === 0) return prev
      if (direction === 'down' && posInType === sameType.length - 1) return prev

      const swapIdx = direction === 'up' ? posInType - 1 : posInType + 1
      const swapTarget = sameType[swapIdx]

      return prev.map(x => {
        if (x.id === p.id) return { ...x, priorite: swapTarget.priorite }
        if (x.id === swapTarget.id) return { ...x, priorite: p.priorite }
        return x
      })
    })
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/conseiller/admin/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providers: providers.map(p => ({
            id: p.id,
            actif: p.actif,
            priorite: p.priorite,
            reglages: p.reglages,
          })),
        }),
      })
      if (!res.ok) throw new Error('Erreur sauvegarde')
      setDirty(false)
      setToast('Configuration sauvegardee')
      fetchProviders()
    } catch {
      setToast('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const groupedByType = providers.reduce<Record<string, Provider[]>>((acc, p) => {
    const type = p.providerType
    if (!acc[type]) acc[type] = []
    acc[type].push(p)
    acc[type].sort((a, b) => a.priorite - b.priorite)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration des fournisseurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Activez, desactivez et reordonnez les fournisseurs tiers. Les cles API restent dans les variables d&apos;environnement.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            dirty
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {toast && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
          {toast}
        </div>
      )}

      {Object.entries(groupedByType).map(([type, typeProviders]) => (
        <div key={type} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            {TYPE_LABELS[type] || type}
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {typeProviders.map((provider, idx) => (
              <div key={provider.id} className="p-4 flex items-center gap-4">
                {/* Priority arrows */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => movePriority(provider.id, 'up')}
                    disabled={idx === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs"
                    title="Monter la priorite"
                  >
                    &#9650;
                  </button>
                  <button
                    onClick={() => movePriority(provider.id, 'down')}
                    disabled={idx === typeProviders.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs"
                    title="Baisser la priorite"
                  >
                    &#9660;
                  </button>
                </div>

                {/* Priority number */}
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-mono">
                  {idx + 1}
                </span>

                {/* Provider info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {PROVIDER_LABELS[provider.providerName] || provider.providerName}
                    </span>
                    <StatusBadge provider={provider} />
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    <span>Dernier succes : {timeAgo(provider.dernierSucces)}</span>
                    {provider.dernierEchec && (
                      <span className="text-red-400" title={provider.dernierMessageErreur || ''}>
                        Dernier echec : {timeAgo(provider.dernierEchec)}
                      </span>
                    )}
                  </div>
                  {provider.dernierMessageErreur && provider.dernierEchec && (
                    <p className="text-xs text-red-400 mt-0.5 truncate max-w-md" title={provider.dernierMessageErreur}>
                      {provider.dernierMessageErreur}
                    </p>
                  )}
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleActif(provider.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    provider.actif ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                  title={provider.actif ? 'Desactiver' : 'Activer'}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      provider.actif ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
        <p className="font-medium text-gray-600 mb-1">Comment ca fonctionne</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Le fournisseur avec la priorite la plus haute (1) est utilise en premier</li>
          <li>En cas d&apos;echec, le systeme bascule automatiquement sur le suivant</li>
          <li>Les cles API sont configurees dans les variables d&apos;environnement du serveur</li>
          <li>Les changements sont pris en compte immediatement (pas de redemarrage necessaire)</li>
        </ul>
      </div>
    </div>
  )
}
