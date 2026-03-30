import type { Metadata, Viewport } from 'next'
import './globals.css'

const isCatchup = process.env.NEXT_PUBLIC_APP_BRAND === 'catchup'

export const metadata: Metadata = {
  title: isCatchup ? "Catch'Up — Ton guide orientation" : "Wesh — Ton guide orientation",
  description: isCatchup
    ? "Catch'Up t'aide a trouver ta voie professionnelle. Decouvre ton profil, explore des metiers, construis ton avenir."
    : "Wesh t'aide a trouver ta voie professionnelle. Decouvre ton profil, explore des metiers, construis ton avenir.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: isCatchup ? "Catch'Up" : 'Wesh',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6C63FF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://agents.jaeprive.fr" />
        <link rel="dns-prefetch" href="https://agents.jaeprive.fr" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href={isCatchup ? '/favicon-catchup.svg' : '/favicon.svg'} />
        {!isCatchup && <link rel="icon" type="image/png" href="/favicon.png" />}
        <link rel="apple-touch-icon" href={isCatchup ? '/logo-catchup.png' : '/icons/icon-512.png'} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased bg-catchup-bg overflow-x-hidden">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                  // Dev : désactiver le SW et vider les caches
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
