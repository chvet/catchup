import { UserProfile } from './types'

// === Indice de confiance du profil RIASEC ===
// Cf. spec 06-profil-riasec.md, section "Indice de confiance du profil"

export interface IndiceConfiance {
  scoreGlobal: number          // 0-1
  niveau: 'debut' | 'emergent' | 'precis' | 'fiable'
  volume: number               // 0-1
  stabilite: number            // 0-1
  differenciation: number      // 0-1
  coherence: number            // 0-1
  label: string                // French label for the user
  emoji: string                // visual indicator
}

export interface SeuilAction {
  action: string
  seuil: number               // 0-1
  atteint: boolean
}

// --- Volume conversationnel (poids 30%) ---
function calculerScoreVolume(messageCount: number): number {
  if (messageCount < 3) return 0
  if (messageCount < 6) return 0.25
  if (messageCount < 10) return 0.50
  if (messageCount < 16) return 0.75
  return 1.0
}

// --- Stabilite temporelle (poids 35%) ---
// MVP: sans historique, on utilise messageCount comme proxy
// Plus de messages = plus de stabilite probable
function calculerScoreStabilite(messageCount: number, historique?: UserProfile[]): number {
  // Si on a un historique de snapshots, on l'utilise
  if (historique && historique.length >= 3) {
    return calculerStabiliteDepuisHistorique(historique)
  }

  // MVP fallback: proxy basé sur messageCount
  if (messageCount < 3) return 0
  if (messageCount < 6) return 0.20
  if (messageCount < 10) return 0.40
  if (messageCount < 14) return 0.65
  if (messageCount < 18) return 0.80
  return 0.90
}

function calculerStabiliteDepuisHistorique(historique: UserProfile[]): number {
  // On compare les 5 derniers snapshots (ou moins s'il y en a moins)
  const derniers = historique.slice(-5)
  if (derniers.length < 2) return 0.20

  const dimensions: Array<'R' | 'I' | 'A' | 'S' | 'E' | 'C'> = ['R', 'I', 'A', 'S', 'E', 'C']

  // Extraire le top 2 de chaque snapshot
  const tops = derniers.map(p => {
    const sorted = dimensions
      .map(d => ({ key: d, score: p[d] }))
      .sort((a, b) => b.score - a.score)
    return [sorted[0].key, sorted[1].key]
  })

  // Verifier si le top 2 est stable
  const dernierTop = tops[tops.length - 1]
  let changementsTop = 0
  for (let i = 0; i < tops.length - 1; i++) {
    if (tops[i][0] !== dernierTop[0] || tops[i][1] !== dernierTop[1]) {
      changementsTop++
    }
  }

  // Calculer la variation max des scores entre snapshots consecutifs
  let variationMax = 0
  for (let i = 1; i < derniers.length; i++) {
    for (const d of dimensions) {
      const diff = Math.abs(derniers[i][d] - derniers[i - 1][d])
      if (diff > variationMax) variationMax = diff
    }
  }

  // Score basé sur les changements de top 2 et la variation
  if (changementsTop === 0 && variationMax <= 5) return 1.0
  if (changementsTop === 0 && variationMax <= 10) return 0.75
  if (changementsTop <= 1) return 0.50
  return 0.10
}

// --- Differenciation du profil (poids 20%) ---
function calculerScoreDifferenciation(profile: UserProfile): number {
  const scores = [profile.R, profile.I, profile.A, profile.S, profile.E, profile.C]
  const moyenne = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - moyenne, 2), 0) / scores.length
  const ecartType = Math.sqrt(variance)

  if (ecartType < 5) return 0.10
  if (ecartType < 15) return 0.40
  if (ecartType < 25) return 0.75
  return 1.0
}

// --- Coherence des signaux (poids 15%) ---
// MVP: default 0.5, sera enrichi plus tard via le champ coherence_signaux de l'IA
function calculerScoreCoherence(): number {
  return 0.5
}

// === Fonction principale ===
export function calculerIndiceConfiance(
  profile: UserProfile,
  messageCount: number,
  historique?: UserProfile[]
): IndiceConfiance {
  const volume = calculerScoreVolume(messageCount)
  const stabilite = calculerScoreStabilite(messageCount, historique)
  const differenciation = calculerScoreDifferenciation(profile)
  const coherence = calculerScoreCoherence()

  const scoreGlobal = 0.30 * volume + 0.35 * stabilite + 0.20 * differenciation + 0.15 * coherence

  const niveau: IndiceConfiance['niveau'] =
    scoreGlobal < 0.25 ? 'debut'
    : scoreGlobal < 0.50 ? 'emergent'
    : scoreGlobal < 0.75 ? 'precis'
    : 'fiable'

  const { label, emoji } = getNiveauLabel(niveau)

  return {
    scoreGlobal,
    niveau,
    volume,
    stabilite,
    differenciation,
    coherence,
    label,
    emoji,
  }
}

// === Labels en francais ===
export function getNiveauLabel(niveau: IndiceConfiance['niveau']): { label: string; emoji: string } {
  switch (niveau) {
    case 'debut':
      return { label: 'On commence à peine', emoji: '😊' }
    case 'emergent':
      return { label: 'Je commence à te cerner', emoji: '🔍' }
    case 'precis':
      return { label: 'Ton profil se précise', emoji: '🎯' }
    case 'fiable':
      return { label: 'Je te connais bien !', emoji: '✨' }
  }
}

// === Seuils declencheurs ===
export function getSeuilAtteint(scoreGlobal: number): SeuilAction[] {
  const seuils: SeuilAction[] = [
    {
      action: 'Afficher les barres RIASEC',
      seuil: 0.10,
      atteint: scoreGlobal >= 0.10,
    },
    {
      action: 'Proposer la sauvegarde email',
      seuil: 0.30,
      atteint: scoreGlobal >= 0.30,
    },
    {
      action: 'Proposer des pistes métiers',
      seuil: 0.40,
      atteint: scoreGlobal >= 0.40,
    },
    {
      action: 'Afficher le bouton Partager',
      seuil: 0.50,
      atteint: scoreGlobal >= 0.50,
    },
    {
      action: 'Proposer la mise en relation conseiller',
      seuil: 0.50,
      atteint: scoreGlobal >= 0.50,
    },
  ]

  return seuils
}

// === Helpers exportés pour tests ===
export const _internal = {
  calculerScoreVolume,
  calculerScoreStabilite,
  calculerScoreDifferenciation,
  calculerScoreCoherence,
  calculerStabiliteDepuisHistorique,
}
