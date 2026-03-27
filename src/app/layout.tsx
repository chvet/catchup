import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Catch'Up — Ton guide orientation",
  description: "Catch'Up t'aide à trouver ta voie professionnelle grâce à l'IA. Découvre ton profil, explore des métiers, construis ton avenir.",
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased bg-catchup-bg overflow-x-hidden">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
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
            `,
          }}
        />
      </body>
    </html>
  )
}
