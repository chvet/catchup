'use client'

import VoiceMessage from './VoiceMessage'

interface VoiceData {
  audioUrl: string
  duration: number
  transcription?: string
}

interface Props {
  message: { id: string; role: string; content: string; [key: string]: unknown }
  isSpeaking: boolean
  onSpeak: () => void
  rgaaMode: boolean
  voiceData?: VoiceData
  genre?: 'M' | 'F' | null
}

const AVATAR_BY_GENRE: Record<string, string> = {
  M: '/avatar-homme.svg',
  F: '/avatar-femme.svg',
}

export default function MessageBubble({ message, isSpeaking, onSpeak, rgaaMode, voiceData, genre }: Props) {
  const isUser = message.role === 'user'
  const msgDate = message.createdAt ? new Date(message.createdAt as string | number | Date) : new Date()
  const time = msgDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex mb-2.5 msg-appear w-full max-w-full overflow-hidden ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5 shadow-sm overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon-catchup.png" alt="Catch'Up" className="w-6 h-6 object-contain" />
        </div>
      )}

      <div className="max-w-[85%] md:max-w-[65%] group relative min-w-0">
        <div
          className={`msg-bubble rounded-2xl px-3.5 py-2.5 shadow-sm ${
            isUser
              ? 'bg-catchup-primary text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm'
          } ${rgaaMode ? 'border-2 border-gray-700 !text-base !leading-relaxed' : ''}`}
        >
          {voiceData ? (
            <VoiceMessage
              audioUrl={voiceData.audioUrl}
              duration={voiceData.duration}
              transcription={voiceData.transcription}
            />
          ) : (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap chat-message">
              {message.content}
            </p>
          )}
          <div className={`flex items-center mt-0.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isUser ? 'text-white/50' : 'text-gray-400'}`}>
              {time}
            </span>
            {isUser && (
              <svg className="w-3.5 h-3.5 ml-0.5 text-white/50" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M12.354 4.354a.5.5 0 00-.708-.708L5 10.293 2.354 7.646a.5.5 0 10-.708.708l3 3a.5.5 0 00.708 0l7-7z"/>
              </svg>
            )}
          </div>
        </div>

        {!isUser && (
          <button
            onClick={onSpeak}
            className={`absolute -right-9 top-1.5 p-1.5 rounded-full transition-all duration-200
              focus-visible:ring-2 focus-visible:ring-catchup-primary focus-visible:outline-none
              ${isSpeaking
                ? 'opacity-100 bg-catchup-primary text-white shadow-md'
                : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-catchup-primary hover:bg-white hover:shadow-sm'
              }`}
            title={isSpeaking ? 'Arrêter' : 'Écouter'}
            aria-label={isSpeaking ? 'Arrêter la lecture' : 'Écouter le message'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSpeaking ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M11 5L6 9H2v6h4l5 4V5z" />
              )}
            </svg>
          </button>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 ml-1.5 mt-0.5 shadow-sm overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={genre ? AVATAR_BY_GENRE[genre] || '/avatar-neutre.svg' : '/avatar-neutre.svg'} alt="Vous" className="w-8 h-8" />
        </div>
      )}
    </div>
  )
}
