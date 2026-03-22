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
    body: { profile, messageCount: 0, fromQuiz },
    onFinish: (message) => {
      const extracted = extractProfileFromMessage(message.content)
      if (extracted) {
        setProfile(prev => mergeProfiles(prev, extracted))
        // Compter les suggestions de métier distinctes
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
      setTimeout(() => inputRef.current?.focus(), 100)
    },
  })

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveToLS(LS_MESSAGES_KEY, messages)
    }
  }, [messages])

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

          <ChatInput
            input={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
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
    </div>
  )
}
