'use client'

import { useState, useRef, useEffect, useCallback, PointerEvent as ReactPointerEvent } from 'react'

interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AiAssistantPanelProps {
  context?: {
    beneficiairePrenom?: string
    beneficiaireAge?: number | null
    conversationResume?: string | null
  }
}

const QUICK_PROMPTS = [
  'Comment aborder ce profil ?',
  'Quelles formations suggerer ?',
  'Redige un message d\'encouragement',
  'Signaux de fragilite ?',
]

const LS_AI_HISTORY_KEY = 'catchup_conseiller_ai_history'

export default function AiAssistantPanel({ context }: AiAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<AiMessage[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(LS_AI_HISTORY_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Drag & drop du FAB ──
  // fabPos = { right, bottom } en pixels (distance depuis les bords)
  const [fabPos, setFabPos] = useState<{ right: number; bottom: number }>(() => {
    if (typeof window === 'undefined') return { right: 24, bottom: 24 }
    try {
      const saved = localStorage.getItem('catchup_fab_pos')
      return saved ? JSON.parse(saved) : { right: 24, bottom: 24 }
    } catch { return { right: 24, bottom: 24 } }
  })
  const dragRef = useRef<{ startX: number; startY: number; origRight: number; origBottom: number; moved: boolean } | null>(null)
  const fabRef = useRef<HTMLButtonElement>(null)

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      origRight: fabPos.right, origBottom: fabPos.bottom,
      moved: false,
    }
  }, [fabPos])

  const handlePointerMove = useCallback((e: ReactPointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (!dragRef.current.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return
    dragRef.current.moved = true

    const vw = window.innerWidth
    const vh = window.innerHeight
    const SIZE = 56
    const newRight = Math.max(8, Math.min(vw - SIZE - 8, dragRef.current.origRight - dx))
    const newBottom = Math.max(8, Math.min(vh - SIZE - 8, dragRef.current.origBottom - dy))
    setFabPos({ right: newRight, bottom: newBottom })
  }, [])

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current) return
    const wasDrag = dragRef.current.moved
    dragRef.current = null

    if (wasDrag) {
      // Snap to nearest horizontal edge (left or right)
      setFabPos(prev => {
        const vw = window.innerWidth
        const leftDist = vw - prev.right - 56
        const rightDist = prev.right
        const snappedRight = leftDist < rightDist ? vw - 56 - 16 : 16
        const final = { right: snappedRight, bottom: prev.bottom }
        try { localStorage.setItem('catchup_fab_pos', JSON.stringify(final)) } catch { /* */ }
        return final
      })
    } else {
      setIsOpen(true)
    }
  }, [])

  // Persister les messages dans localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try { localStorage.setItem(LS_AI_HISTORY_KEY, JSON.stringify(messages.slice(-50))) } catch { /* ignore */ }
    }
  }, [messages])

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleCopy = useCallback(async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }, [])

  const handleClear = useCallback(() => {
    setMessages([])
    setInput('')
    try { localStorage.removeItem(LS_AI_HISTORY_KEY) } catch { /* ignore */ }
  }, [])

  const handleSend = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content || isLoading) return

    const userMsg: AiMessage = { id: `user-${Date.now()}`, role: 'user', content }
    const assistantMsg: AiMessage = { id: `assistant-${Date.now()}`, role: 'assistant', content: '' }

    const updatedMessages = [...messages, userMsg]
    setMessages([...updatedMessages, assistantMsg])
    setInput('')
    setIsLoading(true)

    try {
      const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/conseiller/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: {
            prenom: context?.beneficiairePrenom ?? undefined,
            age: context?.beneficiaireAge ?? undefined,
            resumeConversation: context?.conversationResume ?? undefined,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: `Erreur : ${err.error || 'Impossible de contacter l\'IA'}` } : m
        ))
        setIsLoading(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) { setIsLoading(false); return }

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (line.startsWith('0:')) {
            try {
              const textContent = JSON.parse(line.slice(2))
              if (typeof textContent === 'string') {
                accumulated += textContent
                const current = accumulated
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: current } : m
                ))
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      console.error('[AiAssistant] Erreur:', err)
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, content: 'Erreur de connexion. Veuillez reessayer.' } : m
      ))
    }

    setIsLoading(false)
  }, [input, isLoading, messages, context])

  const contextLabel = context?.beneficiairePrenom
    ? `Aide pour ${context.beneficiairePrenom}`
    : 'Assistant conseiller'

  return (
    <>
      {/* ── FAB (Floating Action Button) — draggable ── */}
      {!isOpen && (
        <button
          ref={fabRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="fixed z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center animate-scale-in touch-none select-none cursor-grab active:cursor-grabbing"
          style={{ right: fabPos.right, bottom: fabPos.bottom, transition: dragRef.current ? 'none' : 'right 0.3s ease, bottom 0.05s ease' }}
          title="Assistant IA — glissez pour déplacer"
        >
          <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          {isLoading && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      )}

      {/* ── Popup flottant ── */}
      {isOpen && (
        <>
          {/* Backdrop mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed z-50 inset-x-3 sm:inset-x-auto top-20 sm:top-auto sm:w-[380px] sm:h-[520px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in sm:right-6 sm:bottom-24">

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
                    <p className="text-[10px] text-white/70">{contextLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={handleClear}
                      className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      title="Nouvelle conversation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    title="Fermer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 chat-scroll">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Comment puis-je aider ?</p>
                  <p className="text-xs text-gray-400">
                    Posez une question ou utilisez un raccourci
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.role === 'assistant' && !msg.content && isLoading && (
                      <div className="flex items-center gap-1.5 py-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.content && (
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="text-[10px] text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Copier"
                        >
                          {copiedId === msg.id ? (
                            <span className="text-green-600 font-medium">Copie !</span>
                          ) : (
                            <span>Copier</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            {messages.length === 0 && (
              <div className="px-3 py-2 border-t border-gray-100 flex-shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      disabled={isLoading}
                      className="px-2.5 py-1.5 text-[11px] bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Demandez conseil..."
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent focus:bg-white outline-none transition disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
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
  )
}
