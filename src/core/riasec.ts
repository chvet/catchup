import { UserProfile, RIASEC_LABELS, RIASEC_COLORS, RIASEC_ICONS } from './types'

export type RiasecDimension = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

export interface DimensionInfo {
  key: RiasecDimension
  label: string
  color: string
  icon: string
  score: number
}

export function getDimensionInfo(key: RiasecDimension, score: number): DimensionInfo {
  return {
    key,
    label: RIASEC_LABELS[key],
    color: RIASEC_COLORS[key],
    icon: RIASEC_ICONS[key],
    score,
  }
}

export function getAllDimensions(profile: UserProfile): DimensionInfo[] {
  const keys: RiasecDimension[] = ['R', 'I', 'A', 'S', 'E', 'C']
  return keys.map(k => getDimensionInfo(k, profile[k]))
}

export function getTopDimensions(profile: UserProfile, count = 3): DimensionInfo[] {
  return getAllDimensions(profile)
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
}

export function getProfileSummary(profile: UserProfile): string {
  const top = getTopDimensions(profile, 2)
  if (top.length === 0) return 'Profil en cours de découverte...'

  const labels = top.map(d => d.label).join(' & ')
  return `Profil dominant : ${labels}`
}
