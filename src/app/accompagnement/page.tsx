'use client'

// Page d'accompagnement bénéficiaire
// - Saisie du code PIN pour accéder au chat avec le conseiller
// - Une fois vérifié, affiche le chat direct
// Mobile-first design

import { useState, useEffect, useRef } from 'react'
import AccompagnementChat from '@/components/AccompagnementChat'

interface SessionInfo {
  token: string
  referralId: string
  conseillerId?: string
  conseillerPrenom: string
  conseillerNom: string
  structureNom: string
  beneficiairePrenom?: string
}

const LS_ACCOMP_KEY = 'catchup_accompagnement'

export default function AccompagnementPage() {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [quitting, setQuitting] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Charger la session existante depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_ACCOMP_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SessionInfo
        setSession(parsed)
      } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  // Gestion de la saisie du code PIN (chaque chiffre dans un input séparé)
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // chiffres uniquement
    const newCode = [...code]
    newCode[index] = value.slice(-1) // un seul chiffre
    setCode(newCode)
    setError('')

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Coller un code complet
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  // Vérifier le code
  const handleVerify = async () => {
    const codeStr = code.join('')
    if (codeStr.length !== 6) {
      setError('Saisissez les 6 chiffres de votre code')
      return
    }
    if (!email.trim()) {
      setError('Saisissez votre email ou téléphone')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const res = await fetch('/api/accompagnement/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: codeStr }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Code invalide')
        setVerifying(false)
        return
      }

      // Sauvegarder la session
      const ci = data.conseillerInfo || data.conseiller || {}
      // Try to get the beneficiary name from localStorage
      const benefPrenomStored = typeof localStorage !== 'undefined' ? localStorage.getItem('catchup_user_prenom') || '' : ''
      const sessionInfo: SessionInfo = {
        token: data.token,
        referralId: data.referralId,
        conseillerId: data.conseillerId || '',
        conseillerPrenom: ci.prenom || 'Conseiller',
        conseillerNom: ci.nom || '',
        structureNom: ci.structureNom || '',
        beneficiairePrenom: benefPrenomStored || undefined,
      }
      localStorage.setItem(LS_ACCOMP_KEY, JSON.stringify(sessionInfo))
      setSession(sessionInfo)
    } catch {
      setError('Erreur de connexion. Réessayez.')
    }

    setVerifying(false)
  }

  // Auto-submit quand le code est complet
  useEffect(() => {
    if (code.every(c => c !== '') && email.trim()) {
      handleVerify()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const handleLogout = () => {
    localStorage.removeItem(LS_ACCOMP_KEY)
    setSession(null)
    setCode(['', '', '', '', '', ''])
    setEmail('')
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-catchup-dark to-[#16213E]">
        <div className="w-10 h-10 border-4 border-catchup-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Session active → afficher le chat ──
  if (session) {
    return (
      <div className="h-[100dvh] flex flex-col bg-white">
        {/* Header compact */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-catchup-dark text-white">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤝</span>
            <div>
              <span className="text-sm font-semibold">Mon conseiller : {session.conseillerPrenom}</span>
              {session.structureNom && (
                <p className="text-[10px] text-gray-400">{session.structureNom}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="px-3 py-1.5 text-xs rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              ← Retour IA
            </a>
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="text-xs text-gray-400 hover:text-red-400 transition"
            >
              Quitter
            </button>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <AccompagnementChat
            token={session.token}
            referralId={session.referralId}
            conseillerId={session.conseillerId}
            conseillerPrenom={session.conseillerPrenom}
            structureNom={session.structureNom}
            beneficiairePrenom={session.beneficiairePrenom}
          />
        </div>

        {/* Modale confirmation quitter */}
        {showQuitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Quitter l&apos;accompagnement ?</h3>
              <div className="text-sm text-gray-500 mb-5 space-y-2">
                <p>Que souhaitez-vous faire ?</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Se d&eacute;connecter (je reviendrai)
                </button>
                <button
                  onClick={async () => {
                    if (!session.referralId || quitting) return
                    setQuitting(true)
                    try {
                      await fetch(`/api/referrals/${session.referralId}/cancel`, { method: 'POST' })
                    } catch { /* on continue */ }
                    handleLogout()
                  }}
                  disabled={quitting}
                  className="w-full px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {quitting ? 'Annulation...' : 'Annuler mon accompagnement'}
                </button>
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Rester
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Pas de session → formulaire de vérification PIN ──
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-catchup-dark to-[#16213E] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Catch&apos;Up</h1>
          <p className="text-catchup-primary text-lg">Espace Accompagnement</p>
          <p className="text-gray-400 text-sm mt-2">
            Un conseiller vous accompagne ! Saisissez le code que vous avez reçu.
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Email */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Votre email ou téléphone
            </label>
            <input
              type="text"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="exemple@email.com ou 0612345678"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none transition text-gray-800"
            />
          </div>

          {/* Code PIN 6 chiffres */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code de vérification (6 chiffres)
            </label>
            {/* Input caché pour autocomplete iOS/Android (Web OTP API) */}
            <input
              type="text"
              autoComplete="one-time-code"
              inputMode="numeric"
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                if (val.length === 6) {
                  setCode(val.split(''))
                  inputRefs.current[5]?.focus()
                }
              }}
            />
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-catchup-primary focus:border-catchup-primary outline-none transition text-gray-800"
                />
              ))}
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          {/* Bouton */}
          <button
            onClick={handleVerify}
            disabled={verifying || code.some(c => c === '') || !email.trim()}
            className="w-full py-3 bg-catchup-primary text-white rounded-lg font-medium hover:bg-catchup-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? 'Vérification...' : 'Accéder à mon accompagnement'}
          </button>

          <div className="text-center mt-4">
            {resendSuccess ? (
              <p className="text-xs text-green-600 font-medium">
                Un nouveau code a ete envoye !
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-2">Vous n&apos;avez pas recu de code ?</p>
                <button
                  onClick={async () => {
                    if (!email.trim() || resending) return
                    setResending(true)
                    try {
                      const res = await fetch('/api/accompagnement/resend-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email.trim() }),
                      })
                      if (res.ok) {
                        setResendSuccess(true)
                        setCode(['', '', '', '', '', ''])
                        setError('')
                        setTimeout(() => setResendSuccess(false), 30000)
                      } else {
                        const data = await res.json()
                        setError(data.error || 'Erreur lors du renvoi')
                      }
                    } catch {
                      setError('Erreur de connexion')
                    }
                    setResending(false)
                  }}
                  disabled={!email.trim() || resending}
                  className="text-xs text-catchup-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? 'Envoi en cours...' : 'Renvoyer un code'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lien retour */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-400 text-sm hover:text-white transition">
            ← Retour à Catch&apos;Up
          </a>
        </div>
      </div>
    </div>
  )
}
