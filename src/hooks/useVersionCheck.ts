'use client'

import { useState, useEffect, useCallback } from 'react'

const CHECK_INTERVAL = 60_000 // Vérifier toutes les 60 secondes
const VERSION_URL = '/version.json'

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [initialVersion, setInitialVersion] = useState<string | null>(null)

  // Fetch current version on mount
  useEffect(() => {
    fetch(`${VERSION_URL}?_=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (data?.buildTime) {
          setInitialVersion(data.buildTime)
          console.log('[Version] Version actuelle:', data.buildTime)
        }
      })
      .catch(() => {})
  }, [])

  // Poll for new version
  useEffect(() => {
    if (!initialVersion) return

    const check = () => {
      fetch(`${VERSION_URL}?_=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
          if (data?.buildTime && data.buildTime !== initialVersion) {
            console.log('[Version] Nouvelle version detectee:', data.buildTime, '(actuelle:', initialVersion, ')')
            setUpdateAvailable(true)
          }
        })
        .catch(() => {})
    }

    const interval = setInterval(check, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [initialVersion])

  // Listen for SW update messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log('[Version] Service Worker mis a jour')
        setUpdateAvailable(true)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [])

  // Force update: clear caches + reload
  const forceUpdate = useCallback(async () => {
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
      }
      // Clear all caches
      if ('caches' in window) {
        const names = await caches.keys()
        await Promise.all(names.map(n => caches.delete(n)))
      }
    } catch (e) {
      console.warn('[Version] Erreur nettoyage cache:', e)
    }
    // Hard reload
    window.location.reload()
  }, [])

  return { updateAvailable, forceUpdate }
}
