'use client'

import { useState } from 'react'

interface RdvResult {
  id: string
  titre: string
  dateDebut: string
  dateFin: string
  googleUrl: string
  icsUrl: string
}

export default function PlanifierRdvModal({
  referralId,
  isOpen,
  onClose,
  onCreated,
}: {
  referralId: string
  isOpen: boolean
  onClose: () => void
  onCreated: (rdv: RdvResult) => void
}) {
  const [titre, setTitre] = useState('')
  const [date, setDate] = useState('')
  const [heureDebut, setHeureDebut] = useState('10:00')
  const [heureFin, setHeureFin] = useState('11:00')
  const [description, setDescription] = useState('')
  const [lieu, setLieu] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!titre.trim() || !date || !heureDebut || !heureFin) {
      setError('Titre, date et horaires requis')
      return
    }

    const dateDebut = new Date(`${date}T${heureDebut}:00`)
    const dateFin = new Date(`${date}T${heureFin}:00`)

    if (dateFin <= dateDebut) {
      setError('L\'heure de fin doit être après l\'heure de début')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/conseiller/file-active/${referralId}/rdv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: titre.trim(),
          dateDebut: dateDebut.toISOString(),
          dateFin: dateFin.toISOString(),
          description: description.trim() || undefined,
          lieu: lieu.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur')
        setLoading(false)
        return
      }

      const rdv = await res.json()
      onCreated(rdv)
      handleClose()
    } catch {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setTitre('')
    setDate('')
    setHeureDebut('10:00')
    setHeureFin('11:00')
    setDescription('')
    setLieu('')
    setError('')
    onClose()
  }

  // Date minimum = aujourd'hui
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h2 className="text-lg font-semibold text-gray-800">Planifier un rendez-vous</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex: Point d'accompagnement"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-catchup-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-catchup-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Début *</label>
              <input
                type="time"
                value={heureDebut}
                onChange={e => setHeureDebut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-catchup-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
              <input
                type="time"
                value={heureFin}
                onChange={e => setHeureFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-catchup-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
            <input
              type="text"
              value={lieu}
              onChange={e => setLieu(e.target.value)}
              placeholder="Adresse ou lien visio"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-catchup-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ordre du jour, notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-catchup-primary outline-none resize-none"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !titre.trim() || !date}
            className="px-4 py-2 bg-catchup-primary text-white text-sm font-medium rounded-lg hover:bg-catchup-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Création...' : '📅 Créer le RDV'}
          </button>
        </div>
      </div>
    </div>
  )
}
