'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppBrand } from '@/hooks/useAppBrand'

interface StructureInfo {
  nom: string
  slug: string
  type: string
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-catchup-dark to-catchup-dark/70 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const brandConfig = useAppBrand()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [structureInfo, setStructureInfo] = useState<StructureInfo | null>(null)
  const [parcoureoEnabled, setParcoureoEnabled] = useState(false)
  const [parcoureoLoading, setParcoureoLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = searchParams.get('s') || ''
  const ssoError = searchParams.get('error') || ''

  // Charger les infos de la structure si slug présent
  useEffect(() => {
    if (slug) {
      fetch(`/api/structures/${slug}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setStructureInfo(data)
        })
        .catch(() => {})
    }
  }, [slug])

  // Vérifier si Parcoureo SSO est disponible
  useEffect(() => {
    fetch('/api/conseiller/auth/parcoureo/status')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.configured) setParcoureoEnabled(true)
      })
      .catch(() => {})
  }, [])

  // Afficher les erreurs SSO provenant du callback
  useEffect(() => {
    if (ssoError) {
      const messages: Record<string, string> = {
        parcoureo_not_configured: 'L\'integration Parcoureo n\'est pas configuree.',
        missing_token: 'Token Parcoureo manquant.',
        invalid_token: 'Token Parcoureo invalide ou expire.',
        account_disabled: 'Votre compte est desactive.',
        server_error: 'Erreur serveur lors de la connexion Parcoureo.',
      }
      setError(messages[ssoError] || 'Erreur de connexion Parcoureo.')
    }
  }, [ssoError])

  const handleParcoureoLogin = () => {
    setParcoureoLoading(true)
    // Rediriger vers le endpoint GET qui redirige vers Parcoureo
    window.location.href = '/api/conseiller/auth/parcoureo'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/conseiller/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, slug: slug || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion')
        setLoading(false)
        return
      }

      // Rediriger vers le slug de la structure du conseiller
      const targetSlug = data.slug || slug
      if (targetSlug) {
        router.push(`/conseiller?s=${targetSlug}`)
      } else {
        router.push('/conseiller')
      }
    } catch {
      setError('Erreur de connexion au serveur')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-catchup-dark to-catchup-dark/70 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-catchup.png?v=3"
            alt="Catch'Up"
            className="h-12 mx-auto mb-3"
          />
          <p className="text-catchup-primary text-lg">Espace Conseiller</p>
          {structureInfo ? (
            <div className="mt-3 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
              <p className="text-white font-medium text-sm">{structureInfo.nom}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-2">
              Plateforme de mise en relation — Fondation JAE
            </p>
          )}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Connexion</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email professionnel
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="conseiller@structure.fr"
              required
              autoFocus
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none transition text-gray-800"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none transition text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Lien mot de passe oublié */}
          <div className="text-right mb-6">
            <button
              type="button"
              onClick={() => setShowRecovery(!showRecovery)}
              className="text-xs text-catchup-primary hover:text-catchup-primary/80 transition-colors"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-catchup-primary text-white rounded-lg font-medium hover:bg-catchup-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            {structureInfo
              ? `Accès réservé aux conseillers de ${structureInfo.nom}`
              : 'Accès réservé aux conseillers habilités'
            }
          </p>

          {/* Séparateur + bouton Parcoureo SSO */}
          {parcoureoEnabled && (
            <>
              <div className="flex items-center gap-3 mt-6 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={handleParcoureoLogin}
                disabled={parcoureoLoading}
                className="w-full py-3 bg-parcoureo text-white rounded-lg font-medium hover:bg-parcoureo/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {parcoureoLoading ? 'Redirection...' : 'Se connecter avec Parcoureo'}
              </button>
            </>
          )}
        </form>

        {/* Procédure de récupération d'accès */}
        {showRecovery && (
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 animate-fade-in">
            <h3 className="text-white font-semibold text-sm mb-3">
              🔑 Récupération d&apos;accès
            </h3>
            <div className="space-y-3 text-gray-300 text-xs leading-relaxed">
              <div className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-catchup-primary/30 text-catchup-primary flex items-center justify-center text-xs font-bold">1</span>
                <p>
                  <strong className="text-white">Contactez votre administrateur de structure</strong> — il peut réinitialiser votre mot de passe depuis l&apos;espace de gestion des conseillers.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-catchup-primary/30 text-catchup-primary flex items-center justify-center text-xs font-bold">2</span>
                <p>
                  <strong className="text-white">Si votre administrateur n&apos;est pas joignable</strong>, envoyez un email à{' '}
                  <a href="mailto:support@fondation-jae.org" className="text-catchup-primary hover:underline">
                    support@fondation-jae.org
                  </a>{' '}
                  en précisant votre nom, prénom, structure et email professionnel.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-catchup-primary/30 text-catchup-primary flex items-center justify-center text-xs font-bold">3</span>
                <p>
                  <strong className="text-white">Délai de traitement</strong> — votre accès sera rétabli sous 24h ouvrées après vérification de votre identité.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
