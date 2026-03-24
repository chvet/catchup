'use client'

import { useChat, type Message } from 'ai/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import MessageBubble from './MessageBubble'
import ChatHeader from './ChatHeader'
import ChatInput from './ChatInput'
import SuggestionChips from './SuggestionChips'
import ProfilePanel from './ProfilePanel'
import TypingIndicator from './TypingIndicator'
import InstallBanner from './InstallBanner'
import { UserProfile, EMPTY_PROFILE } from '@/core/types'
import { extractProfileFromMessage, extractSuggestionsFromMessage, cleanMessageContent, mergeProfiles, type DynamicSuggestion } from '@/core/profile-parser'
import { calculerIndiceConfiance } from '@/core/confidence'
import { getFragilityLevel, type FragilityLevel } from '@/core/fragility-detector'
import ReferralModal from './ReferralModal'
import ReferralStatusTag from './ReferralStatusTag'
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
  const [sessionId] = useState(() => loadFromLS<string>(LS_SESSION_KEY, '') || uuidv4())
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevSuggestionRef = useRef<string>('')

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
    body: { profile, messageCount: 0, fromQuiz, fragilityLevel: currentFragility },
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

  // Persist messages in localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveToLS(LS_MESSAGES_KEY, messages)
    }
  }, [messages])

  // Polling statut referral (si un referral existe)
  useEffect(() => {
    if (!referralId) return
    const checkStatus = () => {
      fetch(`/api/referrals/${referralId}/status`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) {
            setReferralStatus(d.statut)
            if (d.priseEnCharge?.exists) {
              setReferralConseillerPrenom(d.priseEnCharge.conseiller?.prenom || null)
            }
          }
        })
        .catch(() => {})
    }
    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
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

  // Init TTS voices
  useEffect(() => { tts?.init() }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-focus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  // Suggestion → direct send
  const handleSuggestion = useCallback((text: string) => {
    append({ role: 'user', content: text })
  }, [append])

  // TTS per message
  const handleSpeak = useCallback((messageId: string, content: string) => {
    if (speakingMsgId === messageId) {
      tts?.stop()
      setSpeakingMsgId(null)
    } else {
      tts?.stop()
      setSpeakingMsgId(messageId)
      tts?.speak(cleanMessageContent(content), () => setSpeakingMsgId(null))
    }
  }, [speakingMsgId])

  const toggleTts = () => {
    setTtsEnabled(prev => {
      if (prev) tts?.stop()
      return !prev
    })
  }

  // Reset conversation : efface messages, profil, suggestions mais garde le streak et les badges
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const handleReset = useCallback(() => {
    setShowResetConfirm(true)
  }, [])
  const confirmReset = useCallback(() => {
    // Effacer les données de conversation
    localStorage.removeItem(LS_MESSAGES_KEY)
    localStorage.removeItem(LS_PROFILE_KEY)
    localStorage.removeItem(LS_SESSION_KEY)
    localStorage.removeItem(LS_QUIZ_KEY)
    localStorage.removeItem(LS_SUGGESTIONS_COUNT)
    setShowResetConfirm(false)
    // Recharger la page pour repartir de zéro proprement
    window.location.reload()
  }, [])

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
        localStorage.removeItem(LS_REFERRAL_ID)
        localStorage.removeItem(LS_BENEFICIAIRE_INFO)
      } else {
        const data = await res.json()
        alert(data.error || 'Impossible d\'annuler la demande')
      }
    } catch {
      alert('Erreur de connexion')
    }
    setCancelling(false)
  }

  const hasMessages = messages.length > 0

  return (
    <div className={`h-[100dvh] flex flex-col overflow-hidden ${rgaaMode ? 'rgaa-mode' : ''}`}>
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
      />

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
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Nouvelle conversation ?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Ta conversation actuelle sera effacée. Tes badges et ton streak sont conservés !
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 px-4 py-2.5 rounded-xl bg-catchup-primary text-white text-sm font-semibold hover:bg-catchup-primary/90 transition-colors"
              >
                Repartir à zéro
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
              <span className="text-2xl">🤔</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Annuler ta demande ?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Tu pourras toujours refaire une demande plus tard si tu changes d&apos;avis.
            </p>
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

      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat area */}
        <div className="flex-1 flex flex-col chat-bg">
          <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 md:px-6">
            {!hasMessages && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-catchup-primary to-catchup-accent flex items-center justify-center mb-5 shadow-xl">
                  <span className="text-4xl">🚀</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Hey ! Moi c&apos;est Catch&apos;Up 👋
                </h2>
                <p className="text-gray-500 text-sm mb-6 max-w-[280px] leading-relaxed">
                  Je suis là pour t&apos;aider à trouver ta voie.
                  Dis-moi ce qui te passionne !
                </p>
                <SuggestionChips onSelect={handleSuggestion} messageCount={0} />
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
              />
            ))}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {hasMessages && !isLoading && (
            <div className="px-3 pb-1 md:px-6">
              <SuggestionChips onSelect={handleSuggestion} messageCount={userMessageCount} dynamicSuggestions={dynamicSuggestions} compact />
            </div>
          )}

          {error && (
            <div className="mx-3 mb-2 md:mx-6 flex items-center justify-between gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <span className="text-red-600 text-sm font-medium">
                Oups, j&apos;ai eu un souci 😅
              </span>
              <button
                onClick={() => reload()}
                className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white active:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          <InstallBanner messageCount={userMessageCount} />

          {/* ── Carte profil bénéficiaire (visible après saisie des infos) ── */}
          {beneficiaireInfo && referralId && (
            <div className="mx-3 mb-2 md:mx-6 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-catchup-primary/20 flex items-center justify-center text-sm font-bold text-catchup-primary">
                    {beneficiaireInfo.prenom[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{beneficiaireInfo.prenom}</p>
                    <p className="text-[11px] text-gray-400">
                      {beneficiaireInfo.age} ans · Dép. {beneficiaireInfo.departement}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {referralStatus && <ReferralStatusTag statut={referralStatus} />}
                  {/* Bouton annuler — seulement si pas encore pris en charge */}
                  {referralStatus && referralStatus !== 'prise_en_charge' && referralStatus !== 'terminee' && (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-[10px] text-gray-400 hover:text-red-500 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
                      title="Annuler ma demande"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Structures suggérées (affichées après la demande) ── */}
          {showStructures && structuresSuggerees.length > 0 && (
            <div className="mx-3 mb-2 md:mx-6">
              <div className="bg-white border border-catchup-primary/20 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-catchup-primary/5 border-b border-catchup-primary/10 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    🏢 Structures proches de chez toi
                  </p>
                  <button
                    onClick={() => setShowStructures(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    Masquer
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {structuresSuggerees.map((s, idx) => (
                    <div key={idx} className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.nom}</p>
                        {s.raisons && s.raisons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {s.raisons.slice(0, 3).map((r, ri) => (
                              <span key={ri} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                                ✅ {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 shrink-0">
                        <span className={`text-sm font-bold ${
                          s.score >= 80 ? 'text-green-600' : s.score >= 50 ? 'text-amber-600' : 'text-gray-400'
                        }`}>
                          {s.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 text-center">
                    Un conseiller de la structure la plus adaptée te contactera bientôt
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Bannière de statut referral ── */}
          {referralStatus === 'prise_en_charge' && (
            <div className="mx-3 mb-2 md:mx-6">
              <a
                href="/accompagnement"
                className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
              >
                <span className="text-2xl">🤝</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">
                    {referralConseillerPrenom ? `${referralConseillerPrenom} t'accompagne !` : 'Un conseiller t\'accompagne !'}
                  </p>
                  <p className="text-xs text-green-600">Accède à ta messagerie pour discuter</p>
                </div>
                <ReferralStatusTag statut="prise_en_charge" />
                <span className="text-green-500">→</span>
              </a>
            </div>
          )}

          {referralId && referralStatus && referralStatus !== 'prise_en_charge' && referralStatus !== 'annulee' && !beneficiaireInfo && (
            <div className="mx-3 mb-2 md:mx-6 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs text-blue-700">
                  Ta demande d&apos;accompagnement a été transmise.
                </p>
                <div className="flex items-center gap-2">
                  <ReferralStatusTag statut={referralStatus} />
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-[10px] text-blue-400 hover:text-red-500 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Bouton permanent de demande de mise en relation ── */}
          {/* Visible quand : pas de referral, ou referral annulé/terminé (pour permettre une nouvelle demande) */}
          {hasMessages && (!referralId || referralStatus === 'annulee' || referralStatus === 'terminee') && (
            <div className="mx-3 mb-2 md:mx-6">
              <button
                onClick={() => {
                  setReferralUrgency('gentle')
                  setShowReferralModal(true)
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-white border border-catchup-primary/30 rounded-xl text-sm font-medium text-catchup-primary hover:bg-catchup-primary/5 active:bg-catchup-primary/10 transition-colors"
              >
                <span>🤝</span>
                <span>{referralStatus === 'annulee' || referralStatus === 'terminee' ? 'Nouvelle demande de mise en relation' : 'Parler à un conseiller'}</span>
              </button>
            </div>
          )}

          {/* Lien discret vers l'espace conseiller (sous-domaine pro) */}
          <div className="text-center py-1.5 border-t border-gray-100">
            <a
              href="https://pro.catchup.jaeprive.fr"
              className="text-[11px] text-gray-400 hover:text-catchup-primary transition-colors"
            >
              Espace professionnel
            </a>
          </div>

          <ChatInput
            input={input}
            onChange={handleInputChange}
            onSubmit={handleSubmitWithFragility}
            isLoading={isLoading}
            inputRef={inputRef}
            onAppend={append}
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
      </div>

      {/* Tag de statut referral flottant (visible seulement si la carte profil n'est pas visible = scroll) */}
      {referralId && referralStatus && !beneficiaireInfo && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40">
          <ReferralStatusTag statut={referralStatus} withLabel />
        </div>
      )}

      {/* Modale de mise en relation avec un conseiller */}
      <ReferralModal
        isOpen={showReferralModal}
        urgency={referralUrgency}
        prenomSuggested={profile.name || undefined}
        onClose={() => {
          setShowReferralModal(false)
          // Enregistrer le refus pour ne pas re-proposer pendant 10 messages
          saveToLS(LS_REFERRAL_REFUSED_AT, messages.length)
        }}
        onSubmit={async (data) => {
          try {
            const res = await fetch('/api/referrals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                conversationId,
                utilisateurId,
                prenom: data.prenom,
                moyenContact: data.moyenContact,
                typeContact: data.typeContact,
                departement: data.departement,
                age: data.age,
                genre: null,
                fragilityLevel: currentFragility,
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
    </div>
  )
}
