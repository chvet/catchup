// Capacitor bridge — detects if running in native app vs browser
// Provides unified API for native features with web fallbacks

export function isNativeApp(): boolean {
  // Capacitor injects this on the window object
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()
}

export function getPlatform(): 'android' | 'ios' | 'web' {
  if (typeof window === 'undefined') return 'web'
  const cap = (window as any).Capacitor
  if (!cap?.isNativePlatform?.()) return 'web'
  return cap.getPlatform?.() || 'web'
}

// Native push notifications (Firebase Cloud Messaging on Android)
export async function registerNativePush(): Promise<string | null> {
  if (!isNativeApp()) return null

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') return null

    await PushNotifications.register()

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token) => {
        resolve(token.value)
      })
      PushNotifications.addListener('registrationError', () => {
        resolve(null)
      })
      // Timeout after 10s
      setTimeout(() => resolve(null), 10000)
    })
  } catch {
    return null
  }
}

// Native geolocation
export async function getNativeLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!isNativeApp()) return null

  try {
    const { Geolocation } = await import('@capacitor/geolocation')
    const pos = await Geolocation.getCurrentPosition()
    return { lat: pos.coords.latitude, lng: pos.coords.longitude }
  } catch {
    return null
  }
}

// Haptic feedback
export async function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
  if (!isNativeApp()) return

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    const styleMap = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }
    await Haptics.impact({ style: styleMap[type] })
  } catch {
    // Silently fail
  }
}

// Open URL in system browser (for external links)
export async function openInBrowser(url: string): Promise<void> {
  if (!isNativeApp()) {
    window.open(url, '_blank')
    return
  }

  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
  } catch {
    window.open(url, '_blank')
  }
}

// Status bar color
export async function setStatusBarColor(color: string): Promise<void> {
  if (!isNativeApp()) return

  try {
    const { StatusBar } = await import('@capacitor/status-bar')
    await StatusBar.setBackgroundColor({ color })
  } catch {
    // Silently fail
  }
}
