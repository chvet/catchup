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
}

export default function ChatInput({ input, onChange, onSubmit, isLoading, inputRef, onAppend, onVoiceMessage }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
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
    <div className="bg-white border-t border-gray-200 px-2 py-1 safe-area-bottom">
      {/* Indicateur de transcription */}
      {transcribing && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-1 animate-fade-in">
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
        <div className="flex-1 flex items-end gap-0 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-catchup-primary focus-within:ring-2 focus-within:ring-catchup-primary/30 transition-all duration-200 min-w-0 overflow-hidden">
          {/* Emoji button inside input, left side */}
          <div className="flex items-center pl-1 pb-1.5 shrink-0">
            <EmojiPickerBtn onSelect={handleEmoji} />
          </div>

          <textarea
            ref={inputRef as React.LegacyRef<HTMLTextAreaElement>}
            value={input}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            disabled={isLoading || transcribing}
            className="flex-1 min-w-0 resize-none bg-transparent py-2 pr-1 text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '100px' }}
            autoFocus
          />

          {/* Micro inside input, right side */}
          <div className="flex items-center pr-1 pb-1.5 shrink-0">
            <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={isLoading || transcribing} />
          </div>
        </div>

        {/* Bouton envoyer */}
        <button
          type="submit"
          disabled={!input.trim() || isLoading || transcribing}
          className="p-2 rounded-full bg-catchup-primary text-white disabled:opacity-30 hover:bg-indigo-600 active:scale-95 transition-all shadow-sm disabled:shadow-none shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}
