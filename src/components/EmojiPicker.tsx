'use client'

import dynamic from 'next/dynamic'
import { useState, useRef, useEffect } from 'react'

const Picker = dynamic(() => import('emoji-picker-react'), { ssr: false })

interface Props {
  onSelect: (emoji: string) => void
}

export default function EmojiPickerBtn({ onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-500 hover:text-catchup-primary transition-colors rounded-full hover:bg-gray-100"
        title="Emoji"
        type="button"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-16 left-2 right-2 sm:absolute sm:bottom-12 sm:left-0 sm:right-auto z-50 shadow-xl rounded-xl overflow-hidden">
          <Picker
            onEmojiClick={(emojiData) => {
              onSelect(emojiData.emoji)
              setOpen(false)
            }}
            width={typeof window !== 'undefined' && window.innerWidth < 400 ? window.innerWidth - 16 : 300}
            height={300}
            searchPlaceholder="Rechercher..."
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  )
}
