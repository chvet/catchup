'use client'

// Page autonome pour la visio en fenêtre popup (desktop)
// URL : /visio/[sessionId]?role=conseiller|beneficiaire&peerName=Prénom

import { useParams, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'

const VisioCall = dynamic(() => import('@/components/VisioCall'), { ssr: false })

export default function VisioPopupPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const searchParams = useSearchParams()
  const role = (searchParams.get('role') as 'conseiller' | 'beneficiaire') || 'beneficiaire'
  const peerName = searchParams.get('peerName') || 'Interlocuteur'

  // Titre de la fenêtre
  useEffect(() => {
    document.title = `Appel vidéo — ${peerName}`
  }, [peerName])

  const handleEnd = () => {
    // Fermer la popup quand l'appel se termine
    window.close()
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>Session invalide</p>
      </div>
    )
  }

  return (
    <VisioCall
      sessionId={sessionId}
      role={role}
      peerName={peerName}
      onEnd={handleEnd}
      standalone
    />
  )
}
