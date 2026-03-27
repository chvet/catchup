'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AiAssistantPanelProps {
  beneficiairePrenom: string
  beneficiaireAge?: number | null
  conversationResume?: string | null
  isOpen: boolean
  onClose: () => void
}

const QUICK_PROMPTS = [
  'Comment aborder ce profil ?',
  'Quelles formations suggérer ?',
  'Rédige un message d\'encouragement',
  'Signaux de fragilité ?',
]

export default function AiAssistantPanel({
  beneficiairePrenom,
  beneficiaireAge,
  conversationResume,
  isOpen,
  onClose,
}: AiAssistantPanelProps) {
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
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
      // Fallback
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
  }, [])

  const handleSend = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content || isLoading) return

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    }

    const assistantMsg: AiMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
    }

    const updatedMessages = [...messages, userMsg]
    setMessages([...updatedMessages, assistantMsg])
    setInput('')
    setIsLoading(true)

    try {
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/conseiller/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: {
            prenom: beneficiairePrenom,
            age: beneficiaireAge ?? undefined,
            resumeConversation: conversationResume ?? undefined,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, content: `Erreur : ${err.error || 'Impossible de contacter l\'IA'}` }
              : m
          )
        )
        setIsLoading(false)
        return
      }

      // Parse streaming response (AI SDK data stream format)
      const reader = res.body?.getReader()
      if (!reader) {
        setIsLoading(false)
        return
      }

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        // AI SDK data stream format: lines like '0:"text"\n'
        const lines = chunk.split('\n')
        for (const line of lines) {
          // Text delta lines start with '0:'
          if (line.startsWith('0:')) {
            try {
              const textContent = JSON.parse(line.slice(2))
              if (typeof textContent === 'string') {
                accumulated += textContent
                const currentAccumulated = accumulated
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMsg.id
                      ? { ...m, content: currentAccumulated }
                      : m
                  )
                )
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    } catch (err) {
      console.error('[AiAssistant] Erreur:', err)
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: 'Erreur de connexion. Veuillez réessayer.' }
            : m
        )
      )
    }

    setIsLoading(false)
  }, [input, isLoading, messages, beneficiairePrenom, beneficiaireAge, conversationResume])

  return (
    <>
      {/* Backdrop mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full z-50
          md:relative md:z-auto md:h-auto
          bg-white border-l border-gray-200 shadow-xl
          flex flex-col
          transition-transform duration-300 ease-in-out
          w-full md:w-[350px] md:min-w-[350px] md:max-w-[350px]
          ${isOpen ? 'translate-x-0' : 'translate-x-full md:hidden'}
        `}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg" role="img" aria-label="robot">&#129302;</span>
              <h3 className="text-sm font-semibold text-gray-800">Assistant IA</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Effacer la conversation"
              >
                <span role="img" aria-label="effacer">&#128465;&#65039;</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Fermer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Aide pour accompagner {beneficiairePrenom}
          </p>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2" role="img" aria-label="ampoule">&#128161;</p>
              <p className="text-sm text-gray-400">
                Posez une question ou utilisez un raccourci ci-dessous
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-md'
                    : 'bg-gray-100 text-gray-800 rounded-tl-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content || (isLoading && msg.role === 'assistant' ? '' : '')}</div>

                {/* Loading indicator for empty assistant message */}
                {msg.role === 'assistant' && !msg.content && isLoading && (
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}

                {/* Copy button for assistant messages */}
                {msg.role === 'assistant' && msg.content && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Copier"
                    >
                      {copiedId === msg.id ? (
                        <span className="text-green-600 font-medium">Copi&eacute; !</span>
                      ) : (
                        <>
                          <span role="img" aria-label="copier">&#128203;</span>
                          <span>Copier</span>
                        </>
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
        <div className="px-3 py-2 border-t border-gray-100 flex-shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1.5 text-[11px] bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-3 pb-3 pt-1 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Demandez conseil..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-3.5 py-2 bg-indigo-600 text-white rounded-full text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
  )
}
