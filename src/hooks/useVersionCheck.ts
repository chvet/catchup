'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const CHECK_INTERVAL = 60_000 // Vérifier toutes les 60 secondes
const VERSION_URL = '/version.json'
const UPDATED_KEY = 'catchup_just_updated'
const GRACE_PERIOD = 15_000 // 15s de grâce après chargement avant de détecter les updates

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [initialVersion, setInitialVersion] = useState<string | null>(null)
  const mountTime = useRef(Date.now())

  // Si on vient de faire une mise à jour, marquer et ignorer les signaux SW
  useEffect(() => {
    const justUpdated = sessionStorage.getItem(UPDATED_KEY)
    if (justUpdated) {
      sessionStorage.removeItem(UPDATED_KEY)
      console.log('[Version] Mise a jour effectuee, grace period active')
    }
  }, [])

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
      // Ne pas détecter de changement pendant la période de grâce
      if (Date.now() - mountTime.current < GRACE_PERIOD) return

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

  // Listen for SW update messages — mais ignorer pendant la période de grâce
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        // Ignorer si on vient de charger la page (< 15s) ou si on vient de faire une MAJ
        if (Date.now() - mountTime.current < GRACE_PERIOD) {
          console.log('[Version] SW_UPDATED ignore (grace period)')
          return
        }
        if (sessionStorage.getItem(UPDATED_KEY)) {
          console.log('[Version] SW_UPDATED ignore (just updated)')
          return
        }
        console.log('[Version] Service Worker mis a jour')
        setUpdateAvailable(true)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [])

  // Force update: marquer, nettoyer caches, recharger
  const forceUpdate = useCallback(async () => {
    // Marquer qu'on vient de faire une MAJ (survit au reload via sessionStorage)
    try { sessionStorage.setItem(UPDATED_KEY, Date.now().toString()) } catch {}

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
