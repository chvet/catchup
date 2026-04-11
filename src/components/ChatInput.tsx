'use client'

import { useRef, useEffect, useState } from 'react'
import EmojiPickerBtn from './EmojiPicker'
import VoiceRecorder from './VoiceRecorder'
import FileAttachment from './FileAttachment'

interface Props {
  input: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (e: any) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  onAppend: (msg: { role: 'user'; content: string }) => void
  onVoiceMessage?: (blob: Blob, duration: number, transcription: string) => void
  onFocus?: () => void
  onBlur?: () => void
  confidentialMode?: boolean
  onToggleConfidential?: () => void
  lang?: string
}

export default function ChatInput({ input, onChange, onSubmit, isLoading, inputRef, onAppend, onVoiceMessage, onFocus, onBlur, confidentialMode, onToggleConfidential, lang }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [showConfidentialPopup, setShowConfidentialPopup] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 100) + 'px'
  }, [input, inputRef])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        formRef.current?.requestSubmit()
      }
    }
  }

  const handleEmoji = (emoji: string) => {
    const el = inputRef.current
    if (!el) return
    const start = el.selectionStart ?? input.length
    const end = el.selectionEnd ?? input.length
    const newValue = input.slice(0, start) + emoji + input.slice(end)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set
    nativeInputValueSetter?.call(el, newValue)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length
      el.focus()
    }, 10)
  }

  const handleVoiceRecorded = async (blob: Blob, duration: number) => {
    setTranscribing(true)

    try {
      // Transcrire via l'API Whisper
      const formData = new FormData()
      formData.append('file', blob, `voice.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`)

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.text?.trim() || ''

        if (text) {
          // Si un handler de message vocal est fourni, l'utiliser
          if (onVoiceMessage) {
            onVoiceMessage(blob, duration, text)
          } else {
            // Sinon, envoyer comme message texte classique
            onAppend({ role: 'user', content: `🎤 ${text}` })
          }
        } else {
          // Transcription vide — envoyer quand même comme message vocal si handler disponible
          if (onVoiceMessage) {
            onVoiceMessage(blob, duration, '')
          }
        }
      } else {
        // Erreur de transcription — envoyer quand même l'audio si possible
        if (onVoiceMessage) {
          onVoiceMessage(blob, duration, '')
        } else {
          onAppend({ role: 'user', content: '🎤 [Message vocal]' })
        }
      }
    } catch {
      // Erreur réseau — envoyer quand même
      if (onVoiceMessage) {
        onVoiceMessage(blob, duration, '')
      } else {
        onAppend({ role: 'user', content: '🎤 [Message vocal]' })
      }
    }

    setTranscribing(false)
  }

  const handleFile = (file: File, preview: string) => {
    const msg = preview
      ? `📎 [Image: ${file.name}]`
      : `📎 [Fichier: ${file.name}]`
    onAppend({ role: 'user', content: msg })
  }

  return (
    <div className={`border-t px-2 py-1 safe-area-bottom transition-colors ${confidentialMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Indicateur de transcription */}
      {transcribing && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-1 animate-fade-in" role="status" aria-live="polite">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-catchup-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-catchup-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-catchup-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-500">Transcription en cours...</span>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex items-end gap-1 max-w-3xl mx-auto"
      >
        {/* Pièce jointe à gauche (hors input) */}
        <FileAttachment onFile={handleFile} />

        {/* Zone de saisie : [emoji | texte | micro] */}
        <div className="flex-1 flex items-end gap-0 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-catchup-primary focus-within:ring-2 focus-within:ring-catchup-primary/30 transition-all duration-200 min-w-0 overflow-hidden shadow-sm">
          {/* Emoji button inside input, left side */}
          <div className="flex items-center pl-1 pb-1.5 shrink-0">
            <EmojiPickerBtn onSelect={handleEmoji} />
          </div>

          <label htmlFor="chat-input" className="sr-only">Votre message</label>
          <textarea
            id="chat-input"
            ref={inputRef as React.LegacyRef<HTMLTextAreaElement>}
            value={input}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            dir="auto"
            lang={lang || 'fr'}
            disabled={isLoading || transcribing}
            className="flex-1 min-w-0 resize-none bg-transparent py-2 px-1 text-[16px] text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '100px' }}
            autoFocus
            aria-describedby="chat-input-hint"
            onFocus={() => {
              onFocus?.()
              // Scroll l'input en vue quand le clavier s'ouvre (WebView Android)
              setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
              }, 300)
            }}
            onBlur={() => { setTimeout(() => onBlur?.(), 150) }}
          />
          <span id="chat-input-hint" className="sr-only">Appuyez sur Entrée pour envoyer, Maj+Entrée pour un saut de ligne</span>

          {/* Cadenas confidentiel inside input */}
          {onToggleConfidential && (
            <div className="flex items-center pb-1.5 shrink-0 relative">
              <button
                type="button"
                onClick={() => {
                  if (!confidentialMode) {
                    setShowConfidentialPopup(true)
                    setTimeout(() => setShowConfidentialPopup(false), 4000)
                  }
                  onToggleConfidential()
                }}
                className={`p-1.5 rounded-full transition-all ${
                  confidentialMode
                    ? 'text-pink-600 bg-pink-100'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title={confidentialMode ? 'D\u00e9sactiver le mode confidentiel' : 'Activer le mode confidentiel'}
              >
                <svg className="w-5 h-5" fill={confidentialMode ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </button>
              {showConfidentialPopup && (
                <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-xl z-50 animate-fade-in">
                  <p className="font-semibold mb-1">🔒 Mode confidentiel activ&eacute;</p>
                  <p className="text-gray-300 leading-relaxed">Vos prochains messages seront visibles uniquement par vous. Le conseiller verra qu&apos;un &eacute;change confidentiel a eu lieu, mais pas son contenu.</p>
                  <div className="absolute bottom-0 right-4 translate-y-1/2 w-2.5 h-2.5 bg-gray-800 rotate-45" />
                </div>
              )}
            </div>
          )}

          {/* Micro inside input, right side */}
          <div className="flex items-center pr-1 pb-1.5 shrink-0">
            <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={isLoading || transcribing} />
          </div>
        </div>

        {/* Bouton envoyer */}
        <button
          type="submit"
          disabled={!input.trim() || isLoading || transcribing}
          className="p-2.5 rounded-full bg-catchup-primary text-white disabled:opacity-30 hover:bg-indigo-600 active:scale-95 transition-all shadow-sm disabled:shadow-none shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Envoyer le message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}
