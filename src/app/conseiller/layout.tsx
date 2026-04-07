'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ConseillerProvider, type ConseillerInfo } from '@/components/conseiller/ConseillerProvider'
import PushNotificationManager from '@/components/PushNotificationManager'
import AiAssistantPanel from '@/components/conseiller/AiAssistantPanel'
import RgaaPanel from '@/components/RgaaPanel'
import VersionPanel from '@/components/VersionPanel'
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
    { href: '/conseiller', label: 'Dashboard', icon: '📊', iconLabel: 'Tableau de bord', exact: true },
    { href: '/conseiller/agenda', label: 'Agenda', icon: '📅', iconLabel: 'Calendrier' },
    { href: '/conseiller/file-active', label: 'File active', icon: '📋', iconLabel: 'Liste des dossiers', alert: true },
    ...(conseiller?.role === 'admin_structure' || conseiller?.role === 'super_admin'
      ? [
          { href: '/conseiller/campagnes', label: 'Campagnes', icon: '🎯', iconLabel: 'Objectifs campagnes' },
          { href: '/conseiller/structures', label: 'Structures', icon: '🏢', iconLabel: 'Bâtiment structures' },
          { href: '/conseiller/conseillers', label: 'Conseillers', icon: '👥', iconLabel: 'Équipe conseillers' },
        ]
      : []),
    ...(conseiller?.role === 'super_admin' || conseiller?.role === 'admin_structure'
      ? [{ href: '/conseiller/admin', label: 'Administration', icon: '⚙️', iconLabel: 'Paramètres administration' }]
      : []),
    { href: '/conseiller/parametres', label: 'Paramètres', icon: '🔧', iconLabel: 'Réglages' },
  ]

  return (
    <ConseillerProvider value={conseiller}>
      <div className="h-screen bg-gray-50 flex overflow-hidden" role="application" aria-label="Espace conseiller Catch'Up">
        <a href="#main-content" className="skip-nav">
          Aller au contenu principal
        </a>

        {/* Overlay mobile (clic en dehors ferme la sidebar) */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside id="sidebar-nav" className={`
          bg-catchup-dark text-white flex flex-col shrink-0
          transition-all duration-300 ease-in-out
          ${isMobile
            ? `fixed h-full z-30 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `relative h-full ${sidebarOpen ? 'w-64' : 'w-16'}`
          }
        `}>
          {/* Logo Catch'Up + Logo structure */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              {(sidebarOpen || isMobile) ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/favicon-catchup.png?v=3" alt={brandConfig.appName} className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-catchup-primary leading-tight">{brandConfig.appName}</h1>
                    <p className="text-[10px] text-gray-400">Espace Conseiller</p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/favicon-catchup.png?v=3" alt={brandConfig.appName} className="w-6 h-6 object-contain" />
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
            {/* Logo de la structure (sous le logo Catch'Up) */}
            {conseiller?.structure?.logoUrl && (
              <div className={`mt-3 flex ${(sidebarOpen || isMobile) ? 'items-center gap-3' : 'justify-center'}`}>
                <div className="w-12 h-12 rounded-lg bg-transparent flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={conseiller.structure.logoUrl} alt={conseiller.structure.nom} className="w-10 h-10 object-contain" />
                </div>
                {(sidebarOpen || isMobile) && (
                  <p className="text-xs font-medium text-gray-300 truncate">{conseiller.structure.nom}</p>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto" aria-label="Navigation principale">
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
                    flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150 relative
                    focus-visible:ring-2 focus-visible:ring-catchup-primary focus-visible:outline-none
                    ${isActive
                      ? 'bg-catchup-primary/20 text-catchup-primary border-r-2 border-catchup-primary'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <span className="text-lg relative" role="img" aria-label={item.iconLabel}>
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
            <div className="p-4 border-t border-white/10 hover:bg-white/5 transition-colors duration-150 rounded-lg mx-1 mb-1">
              <p className="text-sm font-medium">{conseiller.prenom} {conseiller.nom}</p>
              <p className="text-xs text-gray-400">{conseiller.structure?.nom || 'Super Admin'}</p>
              <p className="text-[10px] text-catchup-primary/80 mt-0.5">
                {conseiller.role === 'super_admin' ? 'Super Administrateur'
                  : conseiller.role === 'admin_structure' ? 'Administrateur'
                  : 'Conseiller'}
              </p>
              <button
                onClick={handleLogout}
                className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none rounded"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 h-full" role="main" aria-label="Contenu principal">
          {/* Topbar */}
          <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              {/* Hamburger mobile */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-500 hover:text-gray-700 text-xl p-1"
                aria-label="Menu"
                aria-expanded={sidebarOpen}
                aria-controls="sidebar-nav"
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
              <VersionPanel />
              <RgaaPanel variant="dark" />
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
            <h1 className="sr-only">
              {pathname === '/conseiller' && 'Dashboard'}
              {pathname.startsWith('/conseiller/agenda') && 'Agenda'}
              {pathname.startsWith('/conseiller/file-active') && 'File active'}
              {pathname.startsWith('/conseiller/structures') && 'Structures'}
              {pathname.startsWith('/conseiller/conseillers') && 'Conseillers'}
              {pathname.startsWith('/conseiller/admin') && 'Administration'}
              {pathname.startsWith('/conseiller/parametres') && 'Paramètres'}
              {pathname.startsWith('/conseiller/campagnes') && 'Campagnes'}
            </h1>
            {children}
          </div>
        </main>
      </div>
      {conseiller && <PushNotificationManager type="conseiller" />}
      {conseiller && <AiAssistantPanel />}
    </ConseillerProvider>
  )
}
