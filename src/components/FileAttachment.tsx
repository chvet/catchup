'use client'

import { useRef, useState } from 'react'

interface Props {
  onFile: (file: File, preview: string) => void
}

export default function FileAttachment({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        const url = reader.result as string
        setPreview(url)
        onFile(file, url)
        setTimeout(() => setPreview(null), 3000)
      }
      reader.readAsDataURL(file)
    } else {
      onFile(file, '')
      setPreview(null)
    }

    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="relative">
      <button
        onClick={() => inputRef.current?.click()}
        className="p-2 text-gray-500 hover:text-catchup-primary transition-colors rounded-full hover:bg-gray-100"
        title="Joindre un fichier"
        type="button"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleChange}
        className="hidden"
      />
      {preview && (
        <div className="absolute bottom-12 left-0 z-50 p-1 bg-white rounded-lg shadow-xl border">
          <img src={preview} alt="Aperçu" className="w-20 h-20 object-cover rounded" />
        </div>
      )}
    </div>
  )
}
