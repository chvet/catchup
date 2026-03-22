export interface Suggestion {
  text: string
  emoji: string
}

/**
 * Suggestions de départ engageantes pour les jeunes
 */
export const INITIAL_SUGGESTIONS: Suggestion[] = [
  { text: 'Je sais pas quoi faire plus tard', emoji: '🤷' },
  { text: "J'ai une passion mais est-ce un métier ?", emoji: '💡' },
  { text: 'Je veux changer de voie', emoji: '🔄' },
  { text: 'Aide-moi à me connaître', emoji: '🪞' },
  { text: "J'ai peur de me tromper", emoji: '😰' },
  { text: "C'est quoi les métiers d'avenir ?", emoji: '🔮' },
]

/**
 * Suggestions contextuelles selon le stage de conversation
 */
export function getSuggestions(messageCount: number): Suggestion[] {
  if (messageCount === 0) return INITIAL_SUGGESTIONS

  if (messageCount < 6) {
    return [
      { text: 'Je kiffe créer des trucs', emoji: '🎨' },
      { text: "J'aime aider les gens", emoji: '🤝' },
      { text: 'Je suis plutôt solitaire', emoji: '🧘' },
      { text: "J'adore le sport", emoji: '⚽' },
      { text: 'La tech me fascine', emoji: '💻' },
      { text: 'Je suis manuel(le)', emoji: '🔧' },
    ]
  }

  if (messageCount < 16) {
    return [
      { text: 'Quels métiers me correspondraient ?', emoji: '🎯' },
      { text: 'Et niveau salaire ?', emoji: '💶' },
      { text: 'Quelles études pour ça ?', emoji: '📚' },
      { text: "C'est quoi mon profil alors ?", emoji: '📊' },
    ]
  }

  return [
    { text: 'Comment je commence concrètement ?', emoji: '🚀' },
    { text: "Y'a des stages possibles ?", emoji: '🏢' },
    { text: "T'as d'autres idées de métiers ?", emoji: '💡' },
    { text: 'Je peux en parler à qui ?', emoji: '🗣️' },
  ]
}
