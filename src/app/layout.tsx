import type { Metadata, Viewport } from 'next'
import './globals.css'
import UpdateBanner from '@/components/UpdateBanner'

export const metadata: Metadata = {
  title: "Catch'Up — Ton guide orientation",
  description: "Catch'Up t'aide a trouver ta voie professionnelle. Decouvre ton profil, explore des metiers, construis ton avenir.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Catch'Up",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#6C63FF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var s=JSON.parse(localStorage.getItem('catchup-a11y')||'{}'),r=document.documentElement;if(s.fontSize===1)r.classList.add('a11y-font-1');if(s.fontSize===2)r.classList.add('a11y-font-2');if(s.highContrast)r.classList.add('a11y-contrast');if(s.reducedMotion)r.classList.add('a11y-reduced-motion');if(s.lineSpacing)r.classList.add('a11y-spacing')}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://agents.jaeprive.fr" />
        <link rel="dns-prefetch" href="https://agents.jaeprive.fr" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/png" href="/favicon-catchup.png?v=3" />
        <link rel="apple-touch-icon" href="/logo-catchup.png?v=3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased bg-catchup-bg overflow-x-hidden">
        <a href="#main-content" className="skip-nav">
          Aller au contenu principal
        </a>
        {children}
        <UpdateBanner />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                var isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
                if (isCapacitor || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    regs.forEach(function(r) { r.unregister(); });
                  });
                  caches.keys().then(function(names) {
                    names.forEach(function(n) { caches.delete(n); });
                  });
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(reg) {
                        console.log('[SW] Enregistré, scope :', reg.scope);
                        // Vérifier les mises à jour toutes les 60s
                        setInterval(function() { reg.update(); }, 60000);
                        // Détecter quand un nouveau SW est installé
                        reg.addEventListener('updatefound', function() {
                          var newSW = reg.installing;
                          if (newSW) {
                            newSW.addEventListener('statechange', function() {
                              if (newSW.state === 'activated') {
                                console.log('[SW] Nouvelle version activée');
                              }
                            });
                          }
                        });
                      })
                      .catch(function(err) {
                        console.warn('[SW] Échec enregistrement :', err);
                      });
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
