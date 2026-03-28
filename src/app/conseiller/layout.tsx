'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ConseillerProvider, type ConseillerInfo } from '@/components/conseiller/ConseillerProvider'
import PushNotificationManager from '@/components/PushNotificationManager'
import { useAppBrand } from '@/hooks/useAppBrand'
import { useHeartbeat } from '@/hooks/useHeartbeat'

interface AlertsData {
  enAttente: number
  nouveaux: number
  urgents: number
  enRetard: number
}

export default function ConseillerLayout({ children }: { children: React.ReactNode }) {
  const brandConfig = useAppBrand()
  const [conseiller, setConseiller] = useState<ConseillerInfo | null>(null)
  // Sidebar fermée par défaut sur mobile, ouverte sur desktop
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<AlertsData | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/conseiller/login'

  // Send heartbeat for the conseiller
  useHeartbeat('conseiller', conseiller?.id)

  // Détecter le responsive (mobile < 1024px)
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Sur desktop : sidebar ouverte par défaut
      if (!mobile) setSidebarOpen(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fermer la sidebar quand on navigue (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [pathname, isMobile])

  // Charger les infos du conseiller (sauf page login)
  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }

    fetch('/api/conseiller/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Non authentifié')
        return res.json()
      })
      .then(data => {
        setConseiller(data)
        setLoading(false)
      })
      .catch(() => {
        router.push('/conseiller/login')
      })
  }, [router, isLoginPage])

  // Polling des alertes toutes les 30 secondes
  useEffect(() => {
    if (isLoginPage || loading) return

    const fetchAlerts = () => {
      fetch('/api/conseiller/alerts')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setAlerts(d) })
        .catch(() => {})
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30_000)
    return () => clearInterval(interval)
  }, [isLoginPage, loading])

  // Page login → pas de sidebar/layout
  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await fetch('/api/conseiller/auth/logout', { method: 'POST' })
    router.push('/conseiller/login')
  }

  const navItems = [
    { href: '/conseiller', label: 'Dashboard', icon: '📊', exact: true },
    { href: '/conseiller/agenda', label: 'Agenda', icon: '📅' },
    { href: '/conseiller/file-active', label: 'File active', icon: '📋', alert: true },
    ...(conseiller?.role === 'admin_structure' || conseiller?.role === 'super_admin'
      ? [
          { href: '/conseiller/campagnes', label: 'Campagnes', icon: '🎯' },
          { href: '/conseiller/structures', label: 'Structures', icon: '🏢' },
          { href: '/conseiller/conseillers', label: 'Conseillers', icon: '👥' },
        ]
      : []),
    ...(conseiller?.role === 'super_admin'
      ? [{ href: '/conseiller/admin', label: 'Administration', icon: '⚙️' }]
      : []),
    { href: '/conseiller/parametres', label: 'Paramètres', icon: '🔧' },
  ]

  return (
    <ConseillerProvider value={conseiller}>
      <div className="h-screen bg-gray-50 flex overflow-hidden">

        {/* Overlay mobile (clic en dehors ferme la sidebar) */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          bg-catchup-dark text-white flex flex-col shrink-0
          transition-all duration-300 ease-in-out
          ${isMobile
            ? `fixed h-full z-30 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `relative h-full ${sidebarOpen ? 'w-64' : 'w-16'}`
          }
        `}>
          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            {(sidebarOpen || isMobile) && (
              <div>
                <h1 className="text-lg font-bold text-catchup-primary">{brandConfig.appName}</h1>
                <p className="text-xs text-gray-400">Espace Conseiller</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white p-1"
              title={sidebarOpen ? 'Réduire' : 'Déplier'}
            >
              {isMobile ? '✕' : sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            {navItems.map(item => {
              const isActive = 'exact' in item && item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href) && !(item.href === '/conseiller' && pathname !== '/conseiller')

              const showBadge = 'alert' in item && item.alert && alerts && alerts.enAttente > 0

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 text-sm transition-colors relative
                    ${isActive
                      ? 'bg-catchup-primary/20 text-catchup-primary border-r-2 border-catchup-primary'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <span className="text-lg relative">
                    {item.icon}
                    {!sidebarOpen && !isMobile && showBadge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {alerts.enAttente > 99 ? '99' : alerts.enAttente}
                      </span>
                    )}
                  </span>
                  {(sidebarOpen || isMobile) && (
                    <span className="flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {showBadge && (
                        <span className={`
                          text-xs font-bold px-2 py-0.5 rounded-full
                          ${alerts.urgents > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'}
                        `}>
                          {alerts.enAttente}
                          {alerts.nouveaux > 0 && (
                            <span className="font-normal ml-0.5">({alerts.nouveaux})</span>
                          )}
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          {(sidebarOpen || isMobile) && conseiller && (
            <div className="p-4 border-t border-white/10">
              <p className="text-sm font-medium">{conseiller.prenom} {conseiller.nom}</p>
              <p className="text-xs text-gray-400">{conseiller.structure?.nom || 'Super Admin'}</p>
              <button
                onClick={handleLogout}
                className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 h-full">
          {/* Topbar */}
          <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              {/* Hamburger mobile */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-500 hover:text-gray-700 text-xl p-1"
                aria-label="Menu"
              >
                ☰
              </button>
              <nav className="text-sm text-gray-500 hidden sm:block">
                {pathname === '/conseiller' && 'Dashboard'}
                {pathname.startsWith('/conseiller/agenda') && 'Agenda'}
                {pathname.startsWith('/conseiller/file-active') && 'File active'}
                {pathname.startsWith('/conseiller/structures') && 'Structures'}
                {pathname.startsWith('/conseiller/conseillers') && 'Conseillers'}
                {pathname.startsWith('/conseiller/admin') && 'Administration'}
                {pathname.startsWith('/conseiller/parametres') && 'Paramètres'}
              </nav>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Alerte file active dans la topbar */}
              {alerts && alerts.enAttente > 0 && (
                <Link
                  href="/conseiller/file-active?tab=mes_demandes"
                  className={`
                    flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-colors
                    ${alerts.urgents > 0
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      : alerts.enRetard > 0
                        ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }
                  `}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    alerts.urgents > 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                  }`} />
                  <span className="hidden sm:inline">
                    {alerts.enAttente} en attente
                    {alerts.nouveaux > 0 && (
                      <span className="font-normal"> ({alerts.nouveaux} nouveau{alerts.nouveaux > 1 ? 'x' : ''})</span>
                    )}
                  </span>
                  <span className="sm:hidden">{alerts.enAttente}</span>
                  {alerts.urgents > 0 && (
                    <span className="text-[10px] lg:text-xs bg-red-100 text-red-600 px-1 lg:px-1.5 py-0.5 rounded font-bold">
                      {alerts.urgents} urgent{alerts.urgents > 1 ? 's' : ''}
                    </span>
                  )}
                </Link>
              )}
              <span className="text-xs lg:text-sm text-gray-500 hidden md:block">
                {conseiller?.structure?.nom}
              </span>
              <div className="w-8 h-8 rounded-full bg-catchup-primary text-white flex items-center justify-center text-sm font-medium shrink-0">
                {conseiller?.prenom?.[0]}{conseiller?.nom?.[0]}
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
      {conseiller && <PushNotificationManager type="conseiller" />}
    </ConseillerProvider>
  )
}
