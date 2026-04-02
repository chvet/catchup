'use client'

import { useChat, type Message } from 'ai/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { v4 as uuidv4 } from 'uuid'
import MessageBubble from './MessageBubble'
import ChatHeader from './ChatHeader'
import ChatInput from './ChatInput'
import SuggestionChips from './SuggestionChips'
import ProfilePanel from './ProfilePanel'
import TypingIndicator from './TypingIndicator'
// InstallBanner désactivé pour le moment — sera réactivé quand l'app native existera
import { UserProfile, EMPTY_PROFILE } from '@/core/types'
import { extractProfileFromMessage, extractSuggestionsFromMessage, cleanMessageContent, mergeProfiles, type DynamicSuggestion } from '@/core/profile-parser'
import { calculerIndiceConfiance } from '@/core/confidence'
import { getFragilityLevel, type FragilityLevel } from '@/core/fragility-detector'
import ReferralStatusTag from './ReferralStatusTag'
import AccompagnementChat from './AccompagnementChat'
import { useAppBrand } from '@/hooks/useAppBrand'

// Lazy-load heavy modal components (only shown on user action)
const ReferralModal = dynamic(() => import('./ReferralModal'), { ssr: false })
const FichesSearchOverlay = dynamic(() => import('./FichesSearchOverlay'), { ssr: false })
import {
  loadGameState, saveGameState, updateStreak,
  evaluateJaugeActions, checkBadges,
  type GameState, type GameEvent,
} from '@/core/gamification'
import { WebTTSAdapter } from '@/platform/web/web-tts'

const tts = typeof window !== 'undefined' ? new WebTTSAdapter() : null

const LS_MESSAGES_KEY = 'catchup_messages'
const LS_PROFILE_KEY = 'catchup_profil'
const LS_SESSION_KEY = 'catchup_session_id'
const LS_QUIZ_KEY = 'catchup_quiz'
const LS_SUGGESTIONS_COUNT = 'catchup_suggestions_count'
const LS_CONVERSATION_ID = 'catchup_conversation_id'
const LS_USER_ID = 'catchup_utilisateur_id'
const LS_REFERRAL_ID = 'catchup_referral_id'
const LS_REFERRAL_REFUSED_AT = 'catchup_referral_refused_at'
const LS_BENEFICIAIRE_INFO = 'catchup_beneficiaire_info'
const LS_STRUCTURE_SLUG = 'catchup_structure_slug'
const LS_CAMPAGNE_ID = 'catchup_campagne_id'
const LS_USER_PRENOM = 'catchup_user_prenom'

interface StructureInfo {
  nom: string
  slug: string
  type: string
}

interface BeneficiaireInfo {
  prenom: string
  age: number
  departement: string
  typeContact: string
  moyenContact: string
}

interface StructureSuggestion {
  nom: string
  score: number
  type?: string
  departements?: string[]
  raisons?: string[]
}

function loadFromLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded — silently ignore */ }
}

export default function ChatApp() {
  const brandConfig = useAppBrand()
  const [sessionId] = useState(() => loadFromLS<string>(LS_SESSION_KEY, '') || uuidv4())
  const [savedPrenom] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(LS_USER_PRENOM) || ''
  })
  const [profile, setProfile] = useState<UserProfile>(() => loadFromLS<UserProfile>(LS_PROFILE_KEY, { ...EMPTY_PROFILE }))
  const [showProfile, setShowProfile] = useState(false)
  const [dynamicSuggestions, setDynamicSuggestions] = useState<DynamicSuggestion[] | null>(null)
  const [rgaaMode, setRgaaMode] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [fromQuiz, setFromQuiz] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [badgeNotif, setBadgeNotif] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState(() => loadFromLS<string>(LS_CONVERSATION_ID, ''))
  const [utilisateurId, setUtilisateurId] = useState(() => loadFromLS<string>(LS_USER_ID, ''))
  const [currentFragility, setCurrentFragility] = useState<FragilityLevel>('none')
  const [referralId, setReferralId] = useState(() => loadFromLS<string>(LS_REFERRAL_ID, ''))
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [referralUrgency, setReferralUrgency] = useState<'immediate' | 'gentle'>('gentle')
  const [referralStatus, setReferralStatus] = useState<string | null>(null)
  const [referralConseillerPrenom, setReferralConseillerPrenom] = useState<string | null>(null)
  const [beneficiaireInfo, setBeneficiaireInfo] = useState<BeneficiaireInfo | null>(() => loadFromLS<BeneficiaireInfo | null>(LS_BENEFICIAIRE_INFO, null))
  const [structuresSuggerees, setStructuresSuggerees] = useState<StructureSuggestion[]>([])
  const [showStructures, setShowStructures] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [structureInfo, setStructureInfo] = useState<StructureInfo | null>(null)
  const [campagneId, setCampagneId] = useState<string | null>(null)
  const [showFichesSearch, setShowFichesSearch] = useState(false)

  // ── Données vocales par message (audioUrl + durée + transcription) ──
  const voiceDataMap = useRef<Map<string, { audioUrl: string; duration: number; transcription?: string }>>(new Map())

  // ── Authentification bénéficiaire ──
  const LS_USER_TOKEN = 'catchup_user_token'
  interface AuthUser { prenom: string; email: string; telephone?: string; age?: number | null; departement?: string; utilisateurId: string; token: string }
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')
  const [authPrenom, setAuthPrenom] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [showAuthProfile, setShowAuthProfile] = useState(false)

  // ── Bulle IA flottante (visible quand accompagnement actif) ──
  const [showIaBubble, setShowIaBubble] = useState(false)
  const [conseillerUnread, setConseillerUnread] = useState(false)

  // Session accompagnement (token + infos conseiller)
  interface AccompSessionInfo {
    token: string
    referralId: string
    conseillerId?: string
    conseillerPrenom: string
    structureNom: string
    beneficiairePrenom?: string
  }
  const [accompSession, setAccompSession] = useState<AccompSessionInfo | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem('catchup_accompagnement')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  // Inline PIN verification state
  const [pinEmail, setPinEmail] = useState('')
  const [pinCode, setPinCode] = useState(['', '', '', '', '', ''])
  const [pinError, setPinError] = useState('')
  const [pinVerifying, setPinVerifying] = useState(false)
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevSuggestionRef = useRef<string>('')

  // Détection du slug structure dans l'URL ou localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Chercher ?s=SLUG et ?c=CAMPAGNE_ID dans l'URL
    const params = new URLSearchParams(window.location.search)
    let slug = params.get('s') || ''
    const cParam = params.get('c') || ''

    // 2. Si trouvé, persister dans localStorage et nettoyer l'URL
    if (cParam) {
      localStorage.setItem(LS_CAMPAGNE_ID, cParam)
      setCampagneId(cParam)
    } else {
      const savedCampagne = localStorage.getItem(LS_CAMPAGNE_ID) || ''
      if (savedCampagne) setCampagneId(savedCampagne)
    }

    if (slug) {
      localStorage.setItem(LS_STRUCTURE_SLUG, slug)
      const url = new URL(window.location.href)
      url.searchParams.delete('s')
      url.searchParams.delete('c')
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    } else {
      // 3. Sinon, vérifier localStorage (retour sans param)
      slug = localStorage.getItem(LS_STRUCTURE_SLUG) || ''
    }

    // 4. Si on a un slug, fetch les infos de la structure
    if (slug) {
      fetch(`/api/structures/${encodeURIComponent(slug)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.nom) {
            setStructureInfo({ nom: data.nom, slug: data.slug, type: data.type })
          }
        })
        .catch(() => { /* structure non trouvée — on continue sans */ })
    }
  }, [])

  // Charger l'état de gamification au montage
  useEffect(() => {
    const gs = loadGameState()
    // Mettre à jour le streak
    const { state: streakState } = updateStreak(gs)
    setGameState(streakState)
    saveGameState(streakState)
  }, [])

  // Persist sessionId on first render
  useEffect(() => { saveToLS(LS_SESSION_KEY, sessionId) }, [sessionId])

  // Persist profile whenever it changes
  useEffect(() => { saveToLS(LS_PROFILE_KEY, profile) }, [profile])

  const { messages, input, handleInputChange, handleSubmit, isLoading, append, error, reload } = useChat({
    api: '/api/chat',
    id: sessionId,
    initialMessages: loadFromLS<Message[]>(LS_MESSAGES_KEY, []),
    body: { profile, messageCount: 0, fromQuiz, fragilityLevel: currentFragility, userName: savedPrenom || profile.name || undefined },
    onFinish: (message) => {
      const extracted = extractProfileFromMessage(message.content)
      if (extracted) {
        setProfile(prev => mergeProfiles(prev, extracted))
        if (extracted.suggestion && extracted.suggestion !== prevSuggestionRef.current) {
          prevSuggestionRef.current = extracted.suggestion
          const count = loadFromLS<number>(LS_SUGGESTIONS_COUNT, 0) + 1
          saveToLS(LS_SUGGESTIONS_COUNT, count)
        }
      }
      const suggestions = extractSuggestionsFromMessage(message.content)
      if (suggestions && suggestions.length > 0) {
        setDynamicSuggestions(suggestions)
      }
      if (ttsEnabled && message.role === 'assistant') {
        setSpeakingMsgId(message.id)
        tts?.speak(cleanMessageContent(message.content), () => setSpeakingMsgId(null))
      }

      // Persister le message IA en DB
      persistMessage({ role: 'assistant', contenu: cleanMessageContent(message.content), contenuBrut: message.content })

      // Détecter le tag <!--REFERRAL_TRIGGER:--> dans la réponse IA
      const triggerMatch = message.content.match(/<!--REFERRAL_TRIGGER:(.*?)-->/)
      if (triggerMatch && !referralId) {
        try {
          const triggerData = JSON.parse(triggerMatch[1])
          const refusedAt = loadFromLS<number>(LS_REFERRAL_REFUSED_AT, 0)
          const messagesSinceRefusal = refusedAt > 0 ? messages.length - refusedAt : 999
          // Ne pas re-proposer si refus récent (< 10 messages)
          if (messagesSinceRefusal >= 10) {
            setReferralUrgency(triggerData.level === 'high' ? 'immediate' : 'gentle')
            setShowReferralModal(true)
          }
        } catch { /* ignore parse error */ }
      }

      setTimeout(() => inputRef.current?.focus(), 100)
    },
  })

  // Persister un message en DB (fire-and-forget)
  const persistMessage = useCallback((msg: { role: string; contenu: string; contenuBrut?: string }) => {
    fetch('/api/messages/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        conversationId: conversationId || undefined,
        utilisateurId: utilisateurId || undefined,
        message: msg,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          if (d.conversationId && !conversationId) {
            setConversationId(d.conversationId)
            saveToLS(LS_CONVERSATION_ID, d.conversationId)
          }
          if (d.utilisateurId && !utilisateurId) {
            setUtilisateurId(d.utilisateurId)
            saveToLS(LS_USER_ID, d.utilisateurId)
          }
          // Mettre à jour le niveau de fragilité si détecté
          if (d.fragility?.level && d.fragility.level !== 'none') {
            setCurrentFragility(d.fragility.level)
          }
        }
      })
      .catch(() => {})
  }, [sessionId, conversationId, utilisateurId])

  // Détecter la fragilité côté client et persister le message user
  const handleSubmitWithFragility = useCallback((e: React.FormEvent) => {
    // Détecter la fragilité AVANT l'envoi
    if (input.trim()) {
      const frag = getFragilityLevel(input)
      if (frag !== 'none') {
        setCurrentFragility(frag)
      }
      // Persister le message user en DB
      persistMessage({ role: 'user', contenu: input.trim() })
    }
    handleSubmit(e)
  }, [input, handleSubmit, persistMessage])

  // Handler pour les messages vocaux (audio + transcription → AI)
  const handleVoiceMessage = useCallback((blob: Blob, duration: number, transcription: string) => {
    const audioUrl = URL.createObjectURL(blob)
    const text = transcription || '[Message vocal]'
    const msgContent = transcription ? `🎤 ${transcription}` : '🎤 [Message vocal]'

    // Stocker les données audio associées au contenu du message
    voiceDataMap.current.set(msgContent, { audioUrl, duration, transcription })

    // Persister en DB
    persistMessage({ role: 'user', contenu: text })

    // Détecter la fragilité
    if (transcription) {
      const frag = getFragilityLevel(transcription)
      if (frag !== 'none') setCurrentFragility(frag)
    }

    // Envoyer au chat AI comme message texte
    append({ role: 'user', content: msgContent })
  }, [append, persistMessage])

  // Persist messages in localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveToLS(LS_MESSAGES_KEY, messages)
    }
  }, [messages])

  // Polling statut referral (si un referral existe) — toutes les 5s pour réactivité
  useEffect(() => {
    if (!referralId) return
    let prevStatut = referralStatus
    const checkStatus = () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      fetch(`/api/referrals/${referralId}/status`, { signal: controller.signal })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) {
            setReferralStatus(d.statut)
            if (d.priseEnCharge?.exists) {
              setReferralConseillerPrenom(d.priseEnCharge.conseiller?.prenom || null)
            }
            // Quand le statut passe à prise_en_charge, réinitialiser la session conseiller
            if (d.statut === 'prise_en_charge' && prevStatut !== 'prise_en_charge') {
              // Supprimer l'ancienne session accompagnement pour repartir proprement
              localStorage.removeItem('catchup_accompagnement')
              setAccompSession(null)
              // Force scroll pour que le bénéficiaire voie le changement
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
            prevStatut = d.statut
          }
        })
        .catch(() => {})
        .finally(() => clearTimeout(timeout))
    }
    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralId])

  // === GAMIFICATION : évaluer jauge + badges à chaque changement de messages/profil ===
  const userMessageCount = messages.filter(m => m.role === 'user').length

  useEffect(() => {
    if (!gameState) return
    if (userMessageCount === 0) return

    const confianceScore = calculerIndiceConfiance(profile, userMessageCount).scoreGlobal
    const suggestionsCount = loadFromLS<number>(LS_SUGGESTIONS_COUNT, 0)
    const isReturning = (gameState.streakActuel ?? 0) >= 2

    // Évaluer les actions de jauge
    const { state: afterJauge, events: jaugeEvents } = evaluateJaugeActions(gameState, {
      messageCount: userMessageCount,
      profile,
      confianceScore,
      hasShared: false,
      isReturning,
    })

    // Vérifier les badges
    const { state: afterBadges, events: badgeEvents } = checkBadges(afterJauge, {
      messageCount: userMessageCount,
      profile,
      confianceScore,
      suggestionsCount,
      sessionCount: afterJauge.streakActuel,
    })

    // Notifier les nouveaux badges
    const allEvents: GameEvent[] = [...jaugeEvents, ...badgeEvents]
    const newBadge = allEvents.find(e => e.type === 'badge_unlocked')
    if (newBadge?.badge) {
      setBadgeNotif(`${newBadge.badge.emoji} ${newBadge.badge.nom}`)
      setTimeout(() => setBadgeNotif(null), 3000)
    }

    // Sauvegarder si changement
    if (afterBadges.jauge !== gameState.jauge ||
        afterBadges.badges !== gameState.badges ||
        afterBadges.jaugeActions.length !== gameState.jaugeActions.length) {
      setGameState(afterBadges)
      saveGameState(afterBadges)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userMessageCount, profile.R, profile.I, profile.A, profile.S, profile.E, profile.C, profile.suggestion, profile.interests.length])

  // Intégration quiz → chat
  const quizHandled = useRef(false)
  useEffect(() => {
    if (quizHandled.current) return
    if (typeof window === 'undefined') return
    const quizRaw = localStorage.getItem(LS_QUIZ_KEY)
    if (!quizRaw) return
    if (messages.length > 0) {
      localStorage.removeItem(LS_QUIZ_KEY)
      return
    }
    quizHandled.current = true
    try {
      const quiz = JSON.parse(quizRaw)
      if (quiz.scores) {
        setProfile(prev => ({
          ...prev,
          R: quiz.scores.R ?? prev.R,
          I: quiz.scores.I ?? prev.I,
          A: quiz.scores.A ?? prev.A,
          S: quiz.scores.S ?? prev.S,
          E: quiz.scores.E ?? prev.E,
          C: quiz.scores.C ?? prev.C,
          updatedAt: Date.now(),
        }))
      }
      setFromQuiz(true)
      const top = quiz.topDimensions ? quiz.topDimensions.join('-') : ''
      const msg = top
        ? `🎯 J'ai fait le mini-quiz et mon profil c'est ${top} ! Qu'est-ce que ça veut dire pour moi ?`
        : `🎯 J'ai fait le mini-quiz ! Qu'est-ce que tu peux me dire sur mon profil ?`
      localStorage.removeItem(LS_QUIZ_KEY)
      append({ role: 'user', content: msg })
    } catch {
      localStorage.removeItem(LS_QUIZ_KEY)
    }
  }, [messages.length, append])

  // Init TTS voices + déverrouillage mobile au premier tap
  useEffect(() => {
    tts?.init()
    const unlockHandler = () => {
      tts?.unlock()
      document.removeEventListener('touchstart', unlockHandler)
      document.removeEventListener('click', unlockHandler)
    }
    document.addEventListener('touchstart', unlockHandler, { once: true })
    document.addEventListener('click', unlockHandler, { once: true })
    return () => {
      document.removeEventListener('touchstart', unlockHandler)
      document.removeEventListener('click', unlockHandler)
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-focus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  // ── Restore session from token on mount ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('catchup_user_token')
    if (!token) return
    fetch('/api/beneficiaire/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore', token }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.ok) {
          setAuthUser({ prenom: data.prenom, email: data.email, telephone: data.telephone, age: data.age, departement: data.departement, utilisateurId: data.utilisateurId, token })
          if (data.utilisateurId) { setUtilisateurId(data.utilisateurId); saveToLS(LS_USER_ID, data.utilisateurId) }
          if (data.prenom) { try { localStorage.setItem(LS_USER_PRENOM, data.prenom) } catch {} }
          if (data.referral) { setReferralId(data.referral.id); saveToLS(LS_REFERRAL_ID, data.referral.id); setReferralStatus(data.referral.statut) }
          if (data.conversationId) { setConversationId(data.conversationId); saveToLS(LS_CONVERSATION_ID, data.conversationId) }
        } else {
          // Token invalid, clear it
          localStorage.removeItem('catchup_user_token')
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auth handlers ──
  const handleAuthSubmit = useCallback(async () => {
    setAuthError('')
    if (authMode === 'signup') {
      if (!authPrenom.trim()) { setAuthError('Entre ton prenom'); return }
      if (!authEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail.trim())) { setAuthError('Email invalide'); return }
      if (authPassword.length < 12) { setAuthError('Mot de passe : 12 caracteres minimum'); return }
    } else {
      if (!authEmail.trim()) { setAuthError('Entre ton email'); return }
      if (!authPassword) { setAuthError('Entre ton mot de passe'); return }
    }

    setAuthLoading(true)
    try {
      const payload = authMode === 'signup'
        ? { action: 'signup', prenom: authPrenom.trim(), email: authEmail.trim(), password: authPassword, utilisateurId: utilisateurId || undefined, conversationId: conversationId || undefined }
        : { action: 'login', email: authEmail.trim(), password: authPassword }
      const res = await fetch('/api/beneficiaire/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setAuthError(data.error || 'Erreur'); setAuthLoading(false); return }

      // Save token
      localStorage.setItem('catchup_user_token', data.token)
      setAuthUser({ prenom: data.prenom, email: data.email, telephone: data.telephone, age: data.age, departement: data.departement, utilisateurId: data.utilisateurId, token: data.token })

      // Link IDs
      if (data.utilisateurId) { setUtilisateurId(data.utilisateurId); saveToLS(LS_USER_ID, data.utilisateurId) }
      if (data.prenom) { setProfile(prev => ({ ...prev, name: data.prenom })); try { localStorage.setItem(LS_USER_PRENOM, data.prenom) } catch {} }
      if (data.conversationId) { setConversationId(data.conversationId); saveToLS(LS_CONVERSATION_ID, data.conversationId) }
      if (data.referral) { setReferralId(data.referral.id); saveToLS(LS_REFERRAL_ID, data.referral.id); setReferralStatus(data.referral.statut) }

      // If login restored messages, reload to apply them
      if (authMode === 'login' && data.messages && data.messages.length > 0) {
        saveToLS(LS_MESSAGES_KEY, data.messages)
        if (data.profile) {
          const restored = loadFromLS(LS_PROFILE_KEY, { ...EMPTY_PROFILE })
          setProfile({ ...restored, R: data.profile.R ?? 0, I: data.profile.I ?? 0, A: data.profile.A ?? 0, S: data.profile.S ?? 0, E: data.profile.E ?? 0, C: data.profile.C ?? 0 })
        }
        window.location.reload()
      }

      // Close modal
      setShowAuthModal(false)
      setAuthEmail('')
      setAuthPassword('')
      setAuthPrenom('')
    } catch {
      setAuthError('Erreur de connexion')
    }
    setAuthLoading(false)
  }, [authMode, authPrenom, authEmail, authPassword, utilisateurId, conversationId])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('catchup_user_token')
    setAuthUser(null)
    setShowAuthProfile(false)
  }, [])

  // Suggestion → direct send
  const handleSuggestion = useCallback((text: string) => {
    append({ role: 'user', content: text })
  }, [append])

  // TTS per message — unlock à chaque clic pour mobile
  const handleSpeak = useCallback((messageId: string, content: string) => {
    // Toujours unlock au clic (user gesture requis sur mobile)
    tts?.unlock()

    if (speakingMsgId === messageId) {
      tts?.stop()
      setSpeakingMsgId(null)
    } else {
      tts?.stop()
      setSpeakingMsgId(messageId)
      // Petit délai après unlock pour laisser iOS traiter
      setTimeout(() => {
        tts?.speak(cleanMessageContent(content), () => setSpeakingMsgId(null))
      }, 150)
    }
  }, [speakingMsgId])

  const toggleTts = () => {
    setTtsEnabled(prev => {
      if (prev) {
        tts?.stop()
        setSpeakingMsgId(null)
      }
      return !prev
    })
  }

  // Arrêter l'audio si ttsEnabled passe à false (sécurité)
  useEffect(() => {
    if (!ttsEnabled) {
      tts?.stop()
      setSpeakingMsgId(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsEnabled])

  // Reset conversation : efface messages, profil, suggestions mais garde le streak et les badges
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const handleReset = useCallback(() => {
    setShowResetConfirm(true)
  }, [])
  const [resetting, setResetting] = useState(false)
  const confirmReset = useCallback(async () => {
    setResetting(true)
    try {
      // Si un accompagnement est en cours, rompre proprement
      if (referralId && (referralStatus === 'prise_en_charge' || referralStatus === 'en_attente' || referralStatus === 'nouvelle')) {
        await fetch(`/api/referrals/${referralId}/rupture`, { method: 'POST' })
      }
    } catch {
      // On continue le reset même si l'appel échoue
    }
    // Effacer TOUTES les données de conversation, referral et accompagnement
    localStorage.removeItem(LS_MESSAGES_KEY)
    localStorage.removeItem(LS_PROFILE_KEY)
    localStorage.removeItem(LS_SESSION_KEY)
    localStorage.removeItem(LS_QUIZ_KEY)
    localStorage.removeItem(LS_SUGGESTIONS_COUNT)
    localStorage.removeItem(LS_REFERRAL_ID)
    localStorage.removeItem(LS_CONVERSATION_ID)
    localStorage.removeItem(LS_USER_ID)
    localStorage.removeItem(LS_USER_PRENOM)
    localStorage.removeItem(LS_BENEFICIAIRE_INFO)
    localStorage.removeItem(LS_REFERRAL_REFUSED_AT)
    localStorage.removeItem('catchup_accompagnement')
    localStorage.removeItem('catchup_user_token')
    setShowResetConfirm(false)
    // Recharger la page pour repartir de zéro proprement
    window.location.reload()
  }, [referralId, referralStatus])

  const handleCancelReferral = async () => {
    if (!referralId) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/referrals/${referralId}/cancel`, { method: 'POST' })
      if (res.ok) {
        // Réinitialiser tout l'état referral
        setReferralId('')
        setReferralStatus(null)
        setReferralConseillerPrenom(null)
        setBeneficiaireInfo(null)
        setStructuresSuggerees([])
        setShowStructures(false)
        setShowCancelConfirm(false)
        setShowIaBubble(false)
        localStorage.removeItem(LS_REFERRAL_ID)
        localStorage.removeItem(LS_BENEFICIAIRE_INFO)
        localStorage.removeItem('catchup_accompagnement')
      } else {
        const data = await res.json()
        alert(data.error || 'Impossible d\'annuler la demande')
      }
    } catch {
      alert('Erreur de connexion')
    }
    setCancelling(false)
  }

  // ── Inline PIN verification handlers ──
  const handlePinCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...pinCode]
    newCode[index] = value.slice(-1)
    setPinCode(newCode)
    setPinError('')
    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pinCode[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus()
    }
  }

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setPinCode(pasted.split(''))
      pinInputRefs.current[5]?.focus()
    }
  }

  const handlePinVerify = useCallback(async () => {
    const codeStr = pinCode.join('')
    if (codeStr.length !== 6) { setPinError('Saisissez les 6 chiffres'); return }
    if (!pinEmail.trim()) { setPinError('Saisissez votre email ou téléphone'); return }

    setPinVerifying(true)
    setPinError('')
    try {
      const res = await fetch('/api/accompagnement/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pinEmail.trim(), code: codeStr }),
      })
      const data = await res.json()
      if (!res.ok) { setPinError(data.error || 'Code invalide'); setPinVerifying(false); return }

      const ci = data.conseillerInfo || data.conseiller || {}
      const benefPrenomStored = localStorage.getItem('catchup_user_prenom') || ''
      const sessionInfo: AccompSessionInfo = {
        token: data.token,
        referralId: data.referralId,
        conseillerId: data.conseillerId || '',
        conseillerPrenom: ci.prenom || 'Conseiller',
        structureNom: ci.structureNom || '',
        beneficiairePrenom: benefPrenomStored || undefined,
      }
      localStorage.setItem('catchup_accompagnement', JSON.stringify(sessionInfo))
      setAccompSession(sessionInfo)
    } catch {
      setPinError('Erreur de connexion. Réessayez.')
    }
    setPinVerifying(false)
  }, [pinCode, pinEmail])

  // Auto-submit PIN when all 6 digits entered
  useEffect(() => {
    if (pinCode.every(c => c !== '') && pinEmail.trim()) {
      handlePinVerify()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinCode])

  // Callback when AccompagnementChat receives a new message from conseiller
  const handleConseillerNewMessage = useCallback(() => {
    // Notification can trigger a sound or visual cue if needed
  }, [])

  const hasMessages = messages.length > 0

  return (
    <div className={`h-[100dvh] w-full max-w-[100vw] flex flex-col overflow-hidden overflow-x-hidden ${rgaaMode ? 'rgaa-mode' : ''}`}>
      <ChatHeader
        profile={profile}
        streak={gameState?.streakActuel ?? 0}
        hasMessages={hasMessages}
        onToggleProfile={() => setShowProfile(!showProfile)}
        onToggleRgaa={() => setRgaaMode(!rgaaMode)}
        onToggleTts={toggleTts}
        onReset={handleReset}
        rgaaMode={rgaaMode}
        ttsEnabled={ttsEnabled}
        authPrenom={authUser?.prenom || null}
        onAuthClick={() => {
          if (authUser) {
            setShowAuthProfile(prev => !prev)
          } else {
            setAuthPrenom(savedPrenom || profile.name || '')
            setShowAuthModal(true)
          }
        }}
      />

      {/* Bandeau accompagnement actif */}
      {referralStatus === 'prise_en_charge' && (
        <div className="flex items-center justify-between px-3 py-2 bg-green-50 border-b border-green-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-green-800">
              Accompagnement avec {referralConseillerPrenom || 'ton conseiller'}
            </span>
          </div>
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="px-2 py-1 text-[10px] text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all"
            title="Quitter l'accompagnement"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bandeau nom de la structure partenaire */}
      {structureInfo && referralStatus !== 'prise_en_charge' && (
        <div className="bg-catchup-primary/5 border-b border-catchup-primary/10 px-3 py-1 text-center">
          <p className="text-[11px] md:text-xs font-medium text-catchup-primary truncate">
            {structureInfo.nom}
          </p>
        </div>
      )}

      {/* Notification badge débloqué */}
      {badgeNotif && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-amber-200">
            <span className="text-sm font-semibold text-amber-700">Nouveau badge : {badgeNotif}</span>
          </div>
        </div>
      )}

      {/* Modale de confirmation reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Tu es sur(e) ?</h3>
            {referralStatus === 'prise_en_charge' ? (
              <div className="text-sm text-gray-500 mb-5 space-y-2">
                <p className="font-semibold text-red-600">
                  Ton accompagnement avec {referralConseillerPrenom || 'ton conseiller'} sera d&eacute;finitivement rompu.
                </p>
                <ul className="text-left text-xs space-y-1 text-gray-500 mt-2">
                  <li>&#x2022; Ton conseiller recevra un message de cl&ocirc;ture</li>
                  <li>&#x2022; Ton historique de conversation sera effac&eacute;</li>
                  <li>&#x2022; Ton profil et tes r&eacute;ponses au quiz seront r&eacute;initialis&eacute;s</li>
                </ul>
                <p className="text-xs mt-2">
                  Tu pourras refaire une demande d&apos;accompagnement plus tard.
                </p>
              </div>
            ) : referralStatus === 'en_attente' ? (
              <div className="text-sm text-gray-500 mb-5 space-y-2">
                <p className="font-semibold text-amber-600">
                  Ta demande d&apos;accompagnement sera annul&eacute;e.
                </p>
                <ul className="text-left text-xs space-y-1 text-gray-500 mt-2">
                  <li>&#x2022; Ta demande en attente sera supprim&eacute;e</li>
                  <li>&#x2022; Ton historique de conversation sera effac&eacute;</li>
                  <li>&#x2022; Ton profil sera r&eacute;initialis&eacute;</li>
                </ul>
                <p className="text-xs mt-2">Tu pourras refaire une demande plus tard.</p>
              </div>
            ) : (
              <div className="text-sm text-gray-500 mb-5 space-y-2">
                <p>Tout sera effac&eacute; et tu repartiras de z&eacute;ro :</p>
                <ul className="text-left text-xs space-y-1 text-gray-500">
                  <li>&#x2022; Ton historique de conversation</li>
                  <li>&#x2022; Ton profil et tes r&eacute;ponses au quiz</li>
                </ul>
                {!authUser && (
                  <p className="text-xs text-catchup-primary font-medium mt-2">
                    Inscris-toi d&apos;abord pour sauvegarder ta conversation !
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              {!authUser && (
                <button
                  onClick={() => { setShowResetConfirm(false); setAuthPrenom(savedPrenom || profile.name || ''); setShowAuthModal(true) }}
                  className="w-full px-4 py-2.5 rounded-xl bg-catchup-primary text-white text-sm font-semibold hover:bg-catchup-primary/90 transition-colors"
                >
                  💾 M&apos;inscrire d&apos;abord
                </button>
              )}
              <button
                onClick={confirmReset}
                disabled={resetting}
                className="w-full px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resetting ? 'Fermeture en cours...' : referralStatus === 'prise_en_charge' ? 'Rompre et repartir à zéro' : 'Repartir à zéro'}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation d'annulation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-2xl">{referralStatus === 'prise_en_charge' ? '⚠️' : '🤔'}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {referralStatus === 'prise_en_charge' ? 'Quitter ton accompagnement ?' : 'Annuler ta demande ?'}
            </h3>
            {referralStatus === 'prise_en_charge' ? (
              <div className="text-sm text-gray-500 mb-5 space-y-2">
                <p className="font-semibold text-red-600">
                  Ton accompagnement avec {referralConseillerPrenom || 'ton conseiller'} sera d&eacute;finitivement arr&ecirc;t&eacute;.
                </p>
                <ul className="text-left text-xs space-y-1 text-gray-500">
                  <li>&#x2022; Ton conseiller sera inform&eacute;</li>
                  <li>&#x2022; Tu ne pourras plus &eacute;changer avec lui</li>
                  <li>&#x2022; Tu pourras refaire une demande plus tard</li>
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-5">
                Ta demande sera annul&eacute;e. Tu pourras en refaire une plus tard si tu changes d&apos;avis.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Non, garder
              </button>
              <button
                onClick={handleCancelReferral}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {cancelling ? 'Annulation...' : 'Oui, annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden overflow-x-hidden relative w-full max-w-full min-w-0">
        {/* ── Accompagnement actif : chat conseiller en principal ── */}
        {referralStatus === 'prise_en_charge' ? (
          <div className="flex-1 flex flex-col">
            {accompSession && accompSession.referralId === referralId ? (
              <AccompagnementChat
                key={accompSession.referralId}
                token={accompSession.token}
                referralId={accompSession.referralId}
                conseillerId={accompSession.conseillerId}
                conseillerPrenom={accompSession.conseillerPrenom}
                structureNom={accompSession.structureNom}
                beneficiairePrenom={accompSession.beneficiairePrenom}
                onNewMessage={handleConseillerNewMessage}
                embedded
              />
            ) : (
              /* ── Formulaire PIN inline ── */
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-sm">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-3">
                      <span className="text-3xl">🔑</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Accéder au chat conseiller</h3>
                    <p className="text-sm text-gray-500">
                      Saisissez le code reçu par SMS ou email pour discuter avec votre conseiller.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                    {/* Email / téléphone */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Votre email ou téléphone</label>
                      <input
                        type="text"
                        value={pinEmail}
                        onChange={e => { setPinEmail(e.target.value); setPinError('') }}
                        placeholder="exemple@email.com ou 0612345678"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm text-gray-800"
                      />
                    </div>

                    {/* Code PIN 6 chiffres */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Code de vérification (6 chiffres)</label>
                      <div className="flex gap-2 justify-center" onPaste={handlePinPaste}>
                        {pinCode.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => { pinInputRefs.current[i] = el }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handlePinCodeChange(i, e.target.value)}
                            onKeyDown={e => handlePinKeyDown(i, e)}
                            className="w-10 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-gray-800"
                          />
                        ))}
                      </div>
                    </div>

                    {pinError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5 mb-3">
                        {pinError}
                      </div>
                    )}

                    <button
                      onClick={handlePinVerify}
                      disabled={pinVerifying || pinCode.some(c => c === '') || !pinEmail.trim()}
                      className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {pinVerifying ? 'Vérification...' : 'Accéder au chat'}
                    </button>

                    <p className="text-center text-[11px] text-gray-400 mt-3">
                      Vous n&apos;avez pas reçu de code ? Contactez votre structure.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── Mode IA : chat normal ── */}
            <div className="flex-1 flex flex-col chat-bg min-w-0 w-full max-w-full" style={{ overflowX: 'clip', overflowY: 'hidden' }}>
              <div className="flex-1 overflow-y-auto chat-scroll px-2 py-3 md:px-6 w-full max-w-full relative" style={{ overflowX: 'clip' }}>
                {/* Bouton haut-parleur sticky dans la zone de restitution */}
                <div className="sticky top-0 z-10 flex justify-end pointer-events-none" style={{ marginBottom: '-32px' }}>
                  <button
                    onClick={toggleTts}
                    className={`pointer-events-auto p-1.5 rounded-full shadow border transition-all duration-200 ${
                      ttsEnabled
                        ? 'bg-catchup-primary text-white border-catchup-primary shadow-catchup-primary/30'
                        : 'bg-white/90 text-gray-400 border-gray-200 hover:text-gray-600'
                    }`}
                    title={ttsEnabled ? 'Désactiver la voix' : 'Activer la voix'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {ttsEnabled ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M11 5L6 9H2v6h4l5 4V5z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      )}
                    </svg>
                  </button>
                </div>
                {!hasMessages && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="mb-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo-catchup.png?v=3"
                        alt="Catch'Up"
                        className="h-28 md:h-36 object-contain mx-auto"
                      />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      {(() => {
                        const hour = new Date().getHours()
                        const greeting = hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour'
                        const prenom = savedPrenom || profile.name
                        if (structureInfo) {
                          return <>{greeting}{prenom ? ` ${prenom}` : ''} ! Bienvenue sur {brandConfig.appName} 😊</>
                        }
                        return <>{greeting}{prenom ? ` ${prenom}` : ''} ! Moi c&apos;est {brandConfig.appName} 😊</>
                      })()}
                    </h2>
                    <p className="text-gray-500 text-sm mb-6 max-w-[280px] leading-relaxed">
                      Je suis là pour t&apos;aider à trouver ta voie.
                      Dis-moi ce qui te passionne !
                    </p>
                    <div className="w-full flex justify-center px-4">
                      <SuggestionChips onSelect={handleSuggestion} messageCount={0} />
                    </div>
                    {/* Bouton parler à un conseiller dès l'accueil */}
                    {(!referralId || referralStatus === 'annulee' || referralStatus === 'terminee' || referralStatus === 'rupture') && (
                      <button
                        onClick={() => { setReferralUrgency('gentle'); setShowReferralModal(true) }}
                        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-catchup-primary to-catchup-secondary text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      >
                        <span className="text-base">🙋</span>
                        <span>Parler à un conseiller</span>
                      </button>
                    )}
                    {/* Statut demande en attente — visible sur le welcome screen */}
                    {(referralStatus === 'en_attente' || referralStatus === 'nouvelle') && (
                      <div className="mt-6 w-full max-w-xs">
                        <div className="rounded-2xl px-4 py-3 shadow-sm bg-white text-gray-800 border border-amber-100">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-500 inline-block animate-spin" style={{ animationDuration: '2s' }}>⏳</span>
                            <p className="text-sm leading-relaxed">
                              Ta demande est en cours de traitement. Un conseiller te contactera bient&ocirc;t 😊
                            </p>
                          </div>
                          <button
                            onClick={() => setShowCancelConfirm(true)}
                            className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Annuler ma demande
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={{
                      ...msg,
                      content: cleanMessageContent(msg.content),
                    }}
                    isSpeaking={speakingMsgId === msg.id}
                    onSpeak={() => handleSpeak(msg.id, msg.content)}
                    rgaaMode={rgaaMode}
                    voiceData={voiceDataMap.current.get(msg.content)}
                    genre={profile.genre}
                  />
                ))}

                {isLoading && <TypingIndicator />}

                {(referralStatus === 'en_attente' || referralStatus === 'nouvelle') && (
                  <div className="flex mb-2.5 msg-appear justify-start">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5 shadow-sm overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/favicon-catchup.png?v=3" alt="Catch'Up" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="max-w-[85%] md:max-w-[65%]">
                      <div className="msg-bubble rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm bg-white text-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 inline-block animate-spin" style={{ animationDuration: '2s' }}>⏳</span>
                          <p className="text-[15px] leading-relaxed">
                            Ta demande est en cours de traitement. Un conseiller te contactera bient&ocirc;t 😊
                          </p>
                        </div>
                        <button
                          onClick={() => setShowCancelConfirm(true)}
                          className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Annuler ma demande
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Suggestions compactes (1 ligne, scroll horizontal) ── */}
              {hasMessages && !isLoading && (
                <div className="px-2 md:px-6 max-h-[48px] shrink-0" style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
                  <SuggestionChips onSelect={handleSuggestion} messageCount={userMessageCount} dynamicSuggestions={dynamicSuggestions} compact />
                </div>
              )}

              {error && (
                <div className="mx-3 mb-1 md:mx-6 flex items-center justify-between gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <span className="text-red-600 text-xs">Oups, souci 😅</span>
                  <button onClick={() => reload()} className="shrink-0 rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white">Réessayer</button>
                </div>
              )}

              {/* ── Barre compacte : bouton mise en relation ── */}
              {(!referralId || referralStatus === 'annulee' || referralStatus === 'terminee' || referralStatus === 'rupture') ? (
                <div className="mx-3 md:mx-6 shrink-0">
                  <button
                    onClick={() => { setReferralUrgency('gentle'); setShowReferralModal(true) }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-catchup-primary to-catchup-secondary text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    <span className="text-base">🙋</span>
                    <span>Parler à un conseiller</span>
                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              ) : null}

              <ChatInput
                input={input}
                onChange={handleInputChange}
                onSubmit={handleSubmitWithFragility}
                isLoading={isLoading}
                inputRef={inputRef}
                onAppend={append}
                onVoiceMessage={handleVoiceMessage}
              />
            </div>

            {/* Profile panel */}
            {showProfile && (
              <ProfilePanel
                profile={profile}
                messageCount={userMessageCount}
                gameState={gameState}
                onClose={() => setShowProfile(false)}
              />
            )}
          </>
        )}
      </div>

      {/* Tag de statut referral flottant (visible seulement si la carte profil n'est pas visible = scroll) */}
      {referralId && referralStatus && !beneficiaireInfo && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
          <ReferralStatusTag statut={referralStatus} withLabel />
          {(referralStatus === 'en_attente' || referralStatus === 'nouvelle') && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-2 py-1 text-[10px] text-gray-400 hover:text-red-500 bg-white border border-gray-200 rounded-full shadow-sm hover:border-red-200 transition-all"
            >
              Annuler
            </button>
          )}
        </div>
      )}

      {/* Modale inscription / connexion bénéficiaire */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-catchup-primary/10 flex items-center justify-center">
                <span className="text-2xl">{authMode === 'signup' ? '📝' : '🔑'}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {authMode === 'signup' ? 'Creer mon compte' : 'Me connecter'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {authMode === 'signup' ? 'Pour sauvegarder ta conversation et ton profil' : 'Retrouve ta conversation et ton profil'}
              </p>
            </div>

            <div className="space-y-3">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prenom</label>
                  <input
                    type="text"
                    value={authPrenom}
                    onChange={e => { setAuthPrenom(e.target.value); setAuthError('') }}
                    placeholder="Ton prenom"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none transition text-sm text-gray-800"
                    autoFocus
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={e => { setAuthEmail(e.target.value); setAuthError('') }}
                  placeholder="ton@email.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none transition text-sm text-gray-800"
                  autoFocus={authMode === 'login'}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={e => { setAuthPassword(e.target.value); setAuthError('') }}
                  placeholder={authMode === 'signup' ? '12 caracteres minimum' : 'Ton mot de passe'}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none transition text-sm text-gray-800"
                  onKeyDown={e => { if (e.key === 'Enter') handleAuthSubmit() }}
                />
                {authMode === 'signup' && (
                  <p className={`text-[11px] mt-1 ${authPassword.length >= 12 ? 'text-green-600' : authPassword.length > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {authPassword.length >= 12 ? '\u2713 Mot de passe valide' : `${authPassword.length}/12 caracteres minimum`}
                  </p>
                )}
              </div>
            </div>

            {authError && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5">
                {authError}
              </div>
            )}

            <button
              onClick={handleAuthSubmit}
              disabled={authLoading}
              className="w-full mt-4 py-2.5 bg-catchup-primary text-white rounded-xl text-sm font-semibold hover:bg-catchup-primary/90 disabled:opacity-50 transition-colors"
            >
              {authLoading ? '...' : authMode === 'signup' ? 'Creer mon compte' : 'Me connecter'}
            </button>

            <div className="mt-3 text-center">
              <button
                onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setAuthError('') }}
                className="text-xs text-catchup-primary hover:underline"
              >
                {authMode === 'signup' ? 'J\u2019ai deja un compte' : 'Creer un compte'}
              </button>
            </div>

            <button
              onClick={() => { setShowAuthModal(false); setAuthError('') }}
              className="w-full mt-2 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Mini profil connecté */}
      {showAuthProfile && authUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-14 pr-3" onClick={() => setShowAuthProfile(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-64" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-catchup-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-catchup-primary">{authUser.prenom.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{authUser.prenom}</p>
                <p className="text-[11px] text-gray-400 truncate">{authUser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[11px] text-green-700 font-medium">Connecte</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              Se deconnecter
            </button>
          </div>
        </div>
      )}

      {/* Overlay de recherche de fiches métiers */}
      <FichesSearchOverlay
        isOpen={showFichesSearch}
        onClose={() => setShowFichesSearch(false)}
        onInterested={(nomMetier) => {
          append({ role: 'user', content: `Le metier "${nomMetier}" m'interesse ! Tu peux m'en dire plus ?` })
        }}
      />

      {/* Modale de mise en relation avec un conseiller */}
      <ReferralModal
        isOpen={showReferralModal}
        urgency={referralUrgency}
        prenomSuggested={beneficiaireInfo?.prenom || profile.name || authUser?.prenom || undefined}
        emailSuggested={beneficiaireInfo?.typeContact === 'email' ? beneficiaireInfo.moyenContact : authUser?.email || undefined}
        telephoneSuggested={beneficiaireInfo?.typeContact === 'telephone' ? beneficiaireInfo.moyenContact : authUser?.telephone || undefined}
        ageSuggested={beneficiaireInfo?.age || authUser?.age || undefined}
        departementSuggested={beneficiaireInfo?.departement || authUser?.departement || undefined}
        structureSlug={structureInfo?.slug}
        onClose={() => {
          setShowReferralModal(false)
          // Enregistrer le refus pour ne pas re-proposer pendant 10 messages
          saveToLS(LS_REFERRAL_REFUSED_AT, messages.length)
        }}
        onSubmit={async (data) => {
          try {
            // Générer les IDs si pas encore de conversation
            let cId = conversationId
            let uId = utilisateurId
            if (!cId) {
              cId = crypto.randomUUID()
              setConversationId(cId)
              saveToLS(LS_CONVERSATION_ID, cId)
            }
            if (!uId) {
              uId = crypto.randomUUID()
              setUtilisateurId(uId)
              saveToLS(LS_USER_ID, uId)
            }
            const res = await fetch('/api/referrals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                conversationId: cId,
                utilisateurId: uId,
                prenom: data.prenom,
                moyenContact: data.moyenContact,
                typeContact: data.typeContact,
                departement: data.departement,
                age: data.age,
                genre: null,
                fragilityLevel: currentFragility,
                structureSlug: structureInfo?.slug || undefined,
                campagneId: campagneId || undefined,
              }),
            })
            if (res.ok) {
              const result = await res.json()

              // 1. Sauvegarder le referral
              setReferralId(result.referralId)
              saveToLS(LS_REFERRAL_ID, result.referralId)
              setReferralStatus('en_attente')
              setShowReferralModal(false)

              // 2. Injecter le prénom dans le profil → l'IA l'utilisera
              setProfile(prev => ({ ...prev, name: data.prenom }))
              // Persister le prénom pour les futures conversations (pas effacé au reset)
              try { localStorage.setItem(LS_USER_PRENOM, data.prenom) } catch { /* ignore */ }

              // 3. Sauvegarder les infos du bénéficiaire
              const info: BeneficiaireInfo = {
                prenom: data.prenom,
                age: data.age,
                departement: data.departement,
                typeContact: data.typeContact,
                moyenContact: data.moyenContact,
              }
              setBeneficiaireInfo(info)
              saveToLS(LS_BENEFICIAIRE_INFO, info)

              // 4. Afficher les structures suggérées
              if (result.structuresSuggerees && result.structuresSuggerees.length > 0) {
                setStructuresSuggerees(result.structuresSuggerees)
                setShowStructures(true)
              }
            }
          } catch { /* ignore */ }
        }}
      />

      {/* ── Bulle flottante IA (visible uniquement pendant un accompagnement actif) ── */}
      {referralStatus === 'prise_en_charge' && (
        <>
          {/* FAB (Floating Action Button) */}
          {!showIaBubble && (
            <button
              onClick={() => setShowIaBubble(true)}
              className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center animate-scale-in"
              title="Assistant IA"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </button>
          )}

          {/* Popup IA flottant */}
          {showIaBubble && (
            <>
              {/* Backdrop mobile */}
              <div
                className="fixed inset-0 bg-black/20 z-40 sm:hidden"
                onClick={() => setShowIaBubble(false)}
              />

              <div className="fixed z-50 bottom-6 right-6 sm:bottom-6 sm:right-6 inset-x-3 sm:inset-x-auto top-20 sm:top-auto sm:w-[380px] sm:h-[520px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Assistant IA</h3>
                        <p className="text-[10px] text-white/70">Ton assistant orientation</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowIaBubble(false)}
                      className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      title="Réduire"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Messages IA dans la bulle */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 chat-scroll bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Comment puis-je t&apos;aider ?</p>
                      <p className="text-xs text-gray-400">
                        Pose-moi une question sur ton orientation
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}>
                          <div className="whitespace-pre-wrap">{cleanMessageContent(msg.content)}</div>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md px-3 py-2 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-1.5 py-1">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions rapides */}
                {!hasMessages && (
                  <div className="px-3 py-2 border-t border-gray-100 flex-shrink-0">
                    <div className="flex flex-wrap gap-1.5">
                      <SuggestionChips onSelect={handleSuggestion} messageCount={0} compact />
                    </div>
                  </div>
                )}

                {/* Input IA dans la bulle */}
                <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmitWithFragility(e as any)}
                      placeholder="Demande-moi..."
                      disabled={isLoading}
                      className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent focus:bg-white outline-none transition disabled:opacity-50"
                    />
                    <button
                      onClick={(e) => handleSubmitWithFragility(e as any)}
                      disabled={!input.trim() || isLoading}
                      className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-30 transition-colors"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
