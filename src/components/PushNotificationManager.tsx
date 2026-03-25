'use client'

// Composant de gestion des notifications push
// Affiche une bannière non-intrusive pour demander la permission
// et souscrit au push quand l'utilisateur accepte

import { useState, useEffect, useCallback } from 'react'

interface PushNotificationManagerProps {
  type: 'conseiller' | 'beneficiaire'
  utilisateurId?: string // requis pour les bénéficiaires sans auth JWT
}

const STORAGE_KEY = 'catchup-push-state'

function getPushState(): 'subscribed' | 'dismissed' | 'pending' {
  if (typeof window === 'undefined') return 'pending'
  const val = localStorage.getItem(STORAGE_KEY)
  if (val === 'subscribed' || val === 'dismissed') return val
  return 'pending'
}

function setPushState(state: 'subscribed' | 'dismissed') {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, state)
  }
}

export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)
    setIsSubscribed(getPushState() === 'subscribed')
  }, [])

  return { isSubscribed, isSupported }
}

export default function PushNotificationManager({
  type,
  utilisateurId,
}: PushNotificationManagerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { isSupported } = usePushSubscription()

  useEffect(() => {
    if (!isSupported) return

    const state = getPushState()
    if (state === 'pending' && Notification.permission === 'default') {
      // Attendre un peu avant d'afficher la bannière (ne pas interrompre)
      const timer = setTimeout(() => setShowBanner(true), 3000)
      return () => clearTimeout(timer)
    }

    // Si déjà autorisé mais pas souscrit, souscrire silencieusement
    if (Notification.permission === 'granted' && state !== 'subscribed') {
      subscribeQuietly()
    }
  }, [isSupported])

  const subscribeQuietly = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready

      // Récupérer la clé VAPID
      const vapidRes = await fetch('/api/push/vapid')
      const { publicKey } = await vapidRes.json()
      if (!publicKey) return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })

      const sub = subscription.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: sub.keys,
          type,
          utilisateurId,
        }),
      })

      setPushState('subscribed')
    } catch (err) {
      console.warn('[Push] Souscription silencieuse echouee:', err)
    }
  }, [type, utilisateurId])

  const handleAccept = async () => {
    setIsSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        await subscribeQuietly()
        setPushState('subscribed')
      } else {
        setPushState('dismissed')
      }
    } catch (err) {
      console.error('[Push] Erreur souscription:', err)
    } finally {
      setIsSubscribing(false)
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setPushState('dismissed')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0" role="img" aria-label="notification">
            🔔
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Activer les notifications
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Pour ne rien manquer de vos messages et rendez-vous.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAccept}
                disabled={isSubscribing}
                className="px-3 py-1.5 bg-catchup-primary text-white text-xs font-medium rounded-lg hover:bg-catchup-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubscribing ? 'Activation...' : 'Activer'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper : convertit une clé VAPID base64url en Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
