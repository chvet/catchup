'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [ChatApp, setChatApp] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    setMounted(true)
    import('@/components/ChatApp').then(mod => setChatApp(() => mod.default))
  }, [])

  if (!mounted || !ChatApp) {
    return (
      <div className="flex items-center justify-center h-screen bg-catchup-bg">
        <div className="animate-pulse text-catchup-primary text-lg font-medium">Chargement...</div>
      </div>
    )
  }

  return <ChatApp />
}
