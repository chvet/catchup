'use client'

import { Suggestion, getSuggestions, INITIAL_SUGGESTIONS } from '@/core/suggestions'
import type { DynamicSuggestion } from '@/core/profile-parser'

interface Props {
  onSelect: (text: string) => void
  messageCount?: number
  compact?: boolean
  dynamicSuggestions?: DynamicSuggestion[] | null
}

export default function SuggestionChips({ onSelect, messageCount = 0, compact = false, dynamicSuggestions }: Props) {
  // Priorité : suggestions dynamiques de l'IA > suggestions statiques par phase
  const suggestions: Suggestion[] =
    dynamicSuggestions && dynamicSuggestions.length > 0
      ? dynamicSuggestions
      : messageCount === 0
        ? INITIAL_SUGGESTIONS
        : getSuggestions(messageCount)

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'justify-start' : 'justify-center'} ${compact ? 'max-w-lg' : ''}`}>
      {suggestions.map((s, i) => (
        <button
          key={`${s.text}-${i}`}
          onClick={() => onSelect(`${s.emoji} ${s.text}`)}
          className={`
            chip-hover inline-flex items-center gap-1.5
            bg-white border border-catchup-primary/20
            text-catchup-primary rounded-full shadow-sm
            transition-all active:scale-95
            ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
          `}
        >
          <span>{s.emoji}</span>
          <span className="font-medium">{s.text}</span>
        </button>
      ))}
    </div>
  )
}
