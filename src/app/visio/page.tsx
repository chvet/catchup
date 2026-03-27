'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import VisioRoom from '@/components/VisioRoom'

function VisioPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const room = searchParams.get('room')
  const nameParam = searchParams.get('name')
  const roleParam = searchParams.get('role') as 'conseiller' | 'beneficiaire' | 'tiers' | null

  const [participantName, setParticipantName] = useState('')
  const [participantRole, setParticipantRole] = useState<'conseiller' | 'beneficiaire' | 'tiers'>('beneficiaire')
  const [joined, setJoined] = useState(false)
  const [ready, setReady] = useState(false)

  // Load from URL params or localStorage
  useEffect(() => {
    const storedName = typeof localStorage !== 'undefined' ? localStorage.getItem('visio_name') || '' : ''
    const storedRole = typeof localStorage !== 'undefined' ? localStorage.getItem('visio_role') as typeof participantRole || '' : ''

    const resolvedName = nameParam || storedName || ''
    const resolvedRole = roleParam || (storedRole as typeof participantRole) || 'beneficiaire'

    setParticipantName(resolvedName)
    setParticipantRole(resolvedRole)
    setReady(true)

    // Auto-join dès qu'on a un nom (pas besoin de sélectionner un rôle)
    if (room && resolvedName) {
      setJoined(true)
    }
  }, [nameParam, roleParam, room])

  const handleJoin = () => {
    if (!participantName.trim()) return

    // Save for next time
    localStorage.setItem('visio_name', participantName)
    localStorage.setItem('visio_role', participantRole)
    setJoined(true)
  }

  const handleClose = () => {
    // Try to go back, or go to home
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-sm text-gray-500 mb-4">
            Ce lien de visio est incomplet. Veuillez utiliser le lien fourni par votre conseiller.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  if (!ready) return null

  if (joined) {
    return (
      <VisioRoom
        roomId={room}
        participantName={participantName}
        participantRole={participantRole}
        onClose={handleClose}
      />
    )
  }

  // Pre-join screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Rejoindre la visio</h1>
          <p className="text-sm text-gray-500 mt-1">Entrez votre nom pour participer</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Votre nom
            </label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Prenom Nom"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              autoFocus
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!participantName.trim()}
            className="w-full px-4 py-3 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 active:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rejoindre
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VisioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    }>
      <VisioPageContent />
    </Suspense>
  )
}
