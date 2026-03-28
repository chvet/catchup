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

  // Auto-join immediately — no pre-join screen
  useEffect(() => {
    const storedName = typeof localStorage !== 'undefined' ? localStorage.getItem('visio_name') || '' : ''
    const storedRole = typeof localStorage !== 'undefined' ? localStorage.getItem('visio_role') as typeof participantRole || '' : ''

    const resolvedName = nameParam || storedName || 'Participant'
    const resolvedRole = roleParam || (storedRole as typeof participantRole) || 'beneficiaire'

    setParticipantName(resolvedName)
    setParticipantRole(resolvedRole)
    setReady(true)

    // Always auto-join when we have a room
    if (room) {
      if (resolvedName) localStorage.setItem('visio_name', resolvedName)
      setJoined(true)
    }
  }, [nameParam, roleParam, room])

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

  // Loading while auto-joining
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-white/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/70 text-sm">Connexion a la visio...</p>
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
