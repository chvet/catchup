export interface Suggestion {
  text: string
  emoji: string
}

/**
 * Pool de suggestions de départ — chaleureuses, mises en confiance
 * 3 sont tirées au hasard à chaque session
 */
const INITIAL_POOL: Suggestion[] = [
  { text: 'Salut, on se connaît un peu ?', emoji: '😊' },
  { text: "J'ai envie d'en savoir plus sur moi", emoji: '🤩' },
  { text: 'Je sais pas trop par où commencer', emoji: '😅' },
  { text: "On discute ? J'suis curieux(se)", emoji: '😄' },
  { text: "J'aimerais trouver ce qui me plaît", emoji: '🥰' },
  { text: "Dis-moi comment tu peux m'aider", emoji: '🤗' },
  { text: 'Je veux découvrir mes talents', emoji: '💪' },
  { text: "T'es là pour m'aider vraiment ?", emoji: '😁' },
  { text: "J'ai plein de questions !", emoji: '🙋' },
  { text: 'On commence tranquille ?', emoji: '😌' },
]

function shuffleAndPick(arr: Suggestion[], count: number): Suggestion[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const INITIAL_SUGGESTIONS: Suggestion[] = shuffleAndPick(INITIAL_POOL, 3)

/**
 * Suggestions contextuelles selon le stage de conversation
 */
export function getSuggestions(messageCount: number): Suggestion[] {
  if (messageCount === 0) return INITIAL_SUGGESTIONS

  if (messageCount < 6) {
    return [
      { text: 'Je kiffe créer des trucs', emoji: '😍' },
      { text: "J'aime aider les gens", emoji: '🤗' },
      { text: 'Je suis plutôt solitaire', emoji: '😌' },
      { text: "J'adore le sport", emoji: '💪' },
      { text: 'La tech me fascine', emoji: '🤩' },
      { text: 'Je suis manuel(le)', emoji: '😊' },
    ]
  }

  if (messageCount < 16) {
    return [
      { text: 'Quels métiers me correspondraient ?', emoji: '🤔' },
      { text: 'Et niveau salaire ?', emoji: '😏' },
      { text: 'Quelles études pour ça ?', emoji: '🧐' },
      { text: "C'est quoi mon profil alors ?", emoji: '😮' },
    ]
  }

  return [
    { text: 'Comment je commence concrètement ?', emoji: '😃' },
    { text: "Y'a des stages possibles ?", emoji: '🤔' },
    { text: "T'as d'autres idées de métiers ?", emoji: '😊' },
    { text: 'Je peux en parler à qui ?', emoji: '🙂' },
  ]
}
