'use client'

import { useRef, useEffect } from 'react'
import EmojiPickerBtn from './EmojiPicker'
import VoiceRecorder from './VoiceRecorder'
import FileAttachment from './FileAttachment'

interface Props {
  input: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  onAppend: (msg: { role: 'user'; content: string }) => void
}

export default function ChatInput({ input, onChange, onSubmit, isLoading, inputRef, onAppend }: Props) {
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
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
    // Trigger onChange with synthetic event
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

  const handleVoiceResult = (text: string) => {
    if (text.trim()) {
      onAppend({ role: 'user', content: text.trim() })
    }
  }

  const handleFile = (file: File, preview: string) => {
    const msg = preview
      ? `📎 [Image: ${file.name}]`
      : `📎 [Fichier: ${file.name}]`
    onAppend({ role: 'user', content: msg })
  }

  return (
    <div className="bg-white border-t border-gray-200 px-2 py-2 safe-area-bottom">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex items-end gap-1 max-w-3xl mx-auto"
      >
        <EmojiPickerBtn onSelect={handleEmoji} />
        <FileAttachment onFile={handleFile} />

        <div className="flex-1 relative">
          <textarea
            ref={inputRef as React.LegacyRef<HTMLTextAreaElement>}
            value={input}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Écris ton message..."
            rows={1}
            disabled={isLoading}
            className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-catchup-primary focus:ring-1 focus:ring-catchup-primary/30 transition-all disabled:opacity-50"
            style={{ maxHeight: '120px' }}
            autoFocus
          />
        </div>

        <VoiceRecorder onResult={handleVoiceResult} />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-full bg-catchup-primary text-white disabled:opacity-30 hover:bg-indigo-600 active:scale-95 transition-all shadow-sm disabled:shadow-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}
