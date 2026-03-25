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
  // Priorité : suggestions dynamiques de l'IA (contextuelles)
  // On n'affiche les suggestions statiques QUE pour le premier message (INITIAL_SUGGESTIONS)
  // Après, si l'IA n'a pas fourni de suggestions, on n'en montre pas
  const allSuggestions: Suggestion[] =
    dynamicSuggestions && dynamicSuggestions.length > 0
      ? dynamicSuggestions
      : messageCount === 0
        ? INITIAL_SUGGESTIONS
        : [] // Pas de fallback statique — les suggestions doivent venir de l'IA

  // Max 3 suggestions
  const suggestions = allSuggestions.slice(0, 3)

  if (suggestions.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-nowrap pb-1 px-1">
      {suggestions.map((s, i) => (
        <button
          key={`${s.text}-${i}`}
          onClick={() => onSelect(`${s.emoji} ${s.text}`)}
          className={`
            chip-hover inline-flex items-center gap-1
            bg-white border border-catchup-primary/20
            text-catchup-primary rounded-full shadow-sm
            transition-all active:scale-95 shrink-0 whitespace-nowrap
            ${compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'}
          `}
        >
          <span>{s.emoji}</span>
          <span className="font-medium">{s.text}</span>
        </button>
      ))}
    </div>
  )
}
