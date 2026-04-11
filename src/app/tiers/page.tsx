'use client'

// Page Espace Intervenant (tiers)
// - Saisie du téléphone + code PIN pour accéder au chat avec le bénéficiaire
// - Une fois vérifié, affiche le chat direct
// Mobile-first design

import { useState, useEffect, useRef } from 'react'
import TiersChat from '@/components/TiersChat'

interface SessionInfo {
  token: string
  tiersPrenom: string
  tiersNom: string
  tiersRole: string
  beneficiairePrenom: string
}

const LS_TIERS_KEY = 'catchup_tiers'

const ROLE_LABELS: Record<string, string> = {
  employeur: 'Employeur',
  educateur: 'Educateur',
  formateur: 'Formateur',
  assistant_social: 'Assistant social',
  autre: 'Intervenant',
}

export default function TiersPage() {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [telephone, setTelephone] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading] = useState(true)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Charger la session existante depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_TIERS_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SessionInfo
        setSession(parsed)
      } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  // Gestion de la saisie du code PIN
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')

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

  // Formater le numéro de téléphone FR
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + ' ' + digits.slice(2)
    if (digits.length > 4) formatted = digits.slice(0, 2) + ' ' + digits.slice(2, 4) + ' ' + digits.slice(4)
    if (digits.length > 6) formatted = digits.slice(0, 2) + ' ' + digits.slice(2, 4) + ' ' + digits.slice(4, 6) + ' ' + digits.slice(6)
    if (digits.length > 8) formatted = digits.slice(0, 2) + ' ' + digits.slice(2, 4) + ' ' + digits.slice(4, 6) + ' ' + digits.slice(6, 8) + ' ' + digits.slice(8)
    setTelephone(formatted)
    setError('')
  }

  // Vérifier le code
  const handleVerify = async () => {
    const codeStr = code.join('')
    if (codeStr.length !== 6) {
      setError('Saisissez les 6 chiffres de votre code')
      return
    }
    const rawPhone = telephone.replace(/\s/g, '')
    if (!rawPhone || rawPhone.length < 10) {
      setError('Saisissez votre numéro de téléphone')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const res = await fetch('/api/tiers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone: rawPhone, code: codeStr }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Code invalide')
        setVerifying(false)
        return
      }

      const ti = data.tiersInfo || {}
      const sessionInfo: SessionInfo = {
        token: data.token,
        tiersPrenom: ti.prenom || 'Intervenant',
        tiersNom: ti.nom || '',
        tiersRole: ti.role || 'autre',
        beneficiairePrenom: data.beneficiairePrenom || 'Bénéficiaire',
      }
      localStorage.setItem(LS_TIERS_KEY, JSON.stringify(sessionInfo))
      setSession(sessionInfo)
    } catch {
      setError('Erreur de connexion. Réessayez.')
    }

    setVerifying(false)
  }

  // Auto-submit quand le code est complet
  useEffect(() => {
    const rawPhone = telephone.replace(/\s/g, '')
    if (code.every(c => c !== '') && rawPhone.length >= 10) {
      handleVerify()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const handleLogout = () => {
    localStorage.removeItem(LS_TIERS_KEY)
    setSession(null)
    setCode(['', '', '', '', '', ''])
    setTelephone('')
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
    const roleLabel = ROLE_LABELS[session.tiersRole] || 'Intervenant'

    return (
      <div className="fixed inset-0 flex flex-col bg-white">
        {/* Barre en-tête */}
        <div className="flex items-center justify-between px-4 py-2 bg-catchup-dark text-white">
          <div className="flex items-center gap-2">
            <span className="text-lg">&#128161;</span>
            <span className="text-sm font-semibold">Catch&apos;Up</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300">
              {session.tiersPrenom} &middot; {roleLabel}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white transition"
          >
            Quitter
          </button>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <TiersChat
            token={session.token}
            beneficiairePrenom={session.beneficiairePrenom}
          />
        </div>
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
          <p className="text-catchup-primary text-lg">Espace Intervenant</p>
          <p className="text-gray-400 text-sm mt-2">
            Entrez vos informations pour accéder à la messagerie
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Téléphone */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Votre numéro de téléphone
            </label>
            <input
              type="tel"
              value={telephone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none transition text-gray-800"
            />
          </div>

          {/* Code PIN 6 chiffres */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code de vérification (6 chiffres)
            </label>
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
            disabled={verifying || code.some(c => c === '') || telephone.replace(/\s/g, '').length < 10}
            className="w-full py-3 bg-catchup-primary text-white rounded-lg font-medium hover:bg-catchup-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? 'Vérification...' : 'Accéder à la messagerie'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Vous n&apos;avez pas reçu de code ?<br />
            Contactez le conseiller référent.
          </p>
        </div>

        {/* Lien retour */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-400 text-sm hover:text-white transition">
            &larr; Retour à Catch&apos;Up
          </a>
        </div>
      </div>
    </div>
  )
}
