const FRAGILITY_KEYWORDS: Record<string, string[]> = {
  decouragement: [
    'rien ne marche', 'je suis nul', 'nulle', 'j\'y arriverai jamais',
    'à quoi bon', 'ça sert à rien', 'j\'abandonne', 'je lâche',
    'pas capable', 'trop dur', 'j\'en peux plus', 'ras le bol',
    'foutu', 'perdu', 'pas fait pour', 'pas à ma place',
    'je suis un échec', 'zéro', 'looser', 'loser',
  ],
  isolement: [
    'tout seul', 'toute seule', 'personne', 'pas d\'amis',
    'seul au monde', 'isolé', 'isolée', 'personne me comprend',
    'invisible', 'rejeté', 'rejetée', 'exclu', 'exclue',
    'abandonné', 'abandonnée',
  ],
  detresse: [
    'mourir', 'suicide', 'me tuer', 'en finir', 'plus envie',
    'plus envie de vivre', 'disparaître', 'plus la force',
    'envie de rien', 'déprimé', 'déprimée', 'dépression',
    'angoisse', 'anxiété', 'panique', 'peur de tout',
    'je pleure', 'mal-être', 'mal être',
  ],
  rupture: [
    'viré', 'virée', 'renvoyé', 'renvoyée', 'décrochage',
    'j\'ai arrêté', 'quitté', 'plus d\'école', 'sans diplôme',
    'la rue', 'sdf', 'sans domicile', 'fugue', 'fugueur',
    'famille cassée', 'parents divorcés',
  ],
}

export function detectFragility(text: string): boolean {
  const lower = text.toLowerCase()
  return Object.values(FRAGILITY_KEYWORDS)
    .flat()
    .some(kw => lower.includes(kw))
}

export type FragilityLevel = 'none' | 'low' | 'medium' | 'high'

export function getFragilityLevel(text: string): FragilityLevel {
  const lower = text.toLowerCase()
  let score = 0

  if (FRAGILITY_KEYWORDS.detresse.some(kw => lower.includes(kw))) score += 3
  if (FRAGILITY_KEYWORDS.isolement.some(kw => lower.includes(kw))) score += 2
  if (FRAGILITY_KEYWORDS.decouragement.some(kw => lower.includes(kw))) score += 1
  if (FRAGILITY_KEYWORDS.rupture.some(kw => lower.includes(kw))) score += 1

  if (score === 0) return 'none'
  if (score <= 1) return 'low'
  if (score <= 3) return 'medium'
  return 'high'
}
