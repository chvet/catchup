// Algorithme de matching bénéficiaire ↔ structure
// cf. spec 16-matching.md

// === TYPES ===

export interface MatchingCriteria {
  age: number | null
  genre: string | null
  departement: string | null
  situation: string | null
  riasecDominant: string[]
  urgence: 'normale' | 'haute' | 'critique'
  fragilite: 'none' | 'low' | 'medium' | 'high'
  preferenceStructure?: 'privee' | 'publique' | 'indifferent' | null
}

export interface StructureData {
  id: string
  nom: string
  departements: string[]
  regions: string[]
  ageMin: number
  ageMax: number
  specialites: string[]
  genrePreference: string | null
  capaciteMax: number
  casActifs: number
  actif: boolean
  statut?: 'public' | 'prive_non_lucratif' | 'lucratif'
}

export interface TarifInfo {
  id: string
  libelle: string
  montantCentimes: number
}

export interface MatchingResult {
  structureId: string
  structureNom: string
  score: number
  raisons: string[]
  tauxRemplissage: number
  statut: string
  tarifs?: TarifInfo[]
}

// === MAPPING DÉPARTEMENTS → RÉGIONS ===

const DEPARTEMENTS_PAR_REGION: Record<string, string[]> = {
  'ile-de-france': ['75', '77', '78', '91', '92', '93', '94', '95'],
  'auvergne-rhone-alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  'nouvelle-aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  'occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  'hauts-de-france': ['02', '59', '60', '62', '80'],
  'provence-alpes-cote-d-azur': ['04', '05', '06', '13', '83', '84'],
  'grand-est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  'pays-de-la-loire': ['44', '49', '53', '72', '85'],
  'bretagne': ['22', '29', '35', '56'],
  'normandie': ['14', '27', '50', '61', '76'],
  'bourgogne-franche-comte': ['21', '25', '39', '58', '70', '71', '89', '90'],
  'centre-val-de-loire': ['18', '28', '36', '37', '41', '45'],
  'corse': ['2A', '2B'],
  'guadeloupe': ['971'],
  'martinique': ['972'],
  'guyane': ['973'],
  'la-reunion': ['974'],
  'mayotte': ['976'],
}

// Inverse : département → région
const REGION_PAR_DEPARTEMENT: Record<string, string> = {}
for (const [region, deps] of Object.entries(DEPARTEMENTS_PAR_REGION)) {
  for (const dep of deps) {
    REGION_PAR_DEPARTEMENT[dep] = region
  }
}

// === SPÉCIALITÉS ===

const SPECIALITES_PAR_SITUATION: Record<string, string[]> = {
  decrocheur: ['decrochage', 'insertion'],
  recherche: ['insertion', 'reconversion'],
  lyceen: ['orientation'],
  etudiant: ['orientation'],
  handicap: ['handicap'],
}

const SPECIALITES_PAR_RIASEC: Record<string, string[]> = {
  R: ['insertion', 'reconversion'],
  I: ['orientation'],
  A: ['orientation'],
  S: ['insertion', 'orientation'],
  E: ['insertion', 'reconversion'],
  C: ['insertion'],
}

// === FONCTIONS UTILITAIRES ===

function memeRegion(dep1: string, dep2OrRegions: string[]): boolean {
  const region1 = REGION_PAR_DEPARTEMENT[dep1]
  if (!region1) return false

  for (const item of dep2OrRegions) {
    // Si c'est un nom de région
    if (DEPARTEMENTS_PAR_REGION[item]) {
      if (item === region1) return true
    }
    // Si c'est un département
    if (REGION_PAR_DEPARTEMENT[item] === region1) return true
  }
  return false
}

function calculerScoreSpecialite(
  criteria: MatchingCriteria,
  specialites: string[]
): { points: number; raison: string | null } {
  if (specialites.length === 0) return { points: 10, raison: null }

  let points = 0
  const raisons: string[] = []

  // Par situation
  if (criteria.situation) {
    const specsSituation = SPECIALITES_PAR_SITUATION[criteria.situation] || []
    const match = specsSituation.some(s => specialites.includes(s))
    if (match) {
      points += 12
      raisons.push(`spécialité ${criteria.situation}`)
    }
  }

  // Par RIASEC dominant
  for (const dim of criteria.riasecDominant.slice(0, 2)) {
    const specsRiasec = SPECIALITES_PAR_RIASEC[dim] || []
    if (specsRiasec.some(s => specialites.includes(s))) {
      points += 2
    }
  }

  // Par fragilité
  if (criteria.fragilite === 'high') {
    if (specialites.includes('decrochage') || specialites.includes('insertion')) {
      points += 5
      raisons.push('accompagnement renforcé')
    }
  } else if (criteria.fragilite === 'medium') {
    points += 3
  }

  return {
    points: Math.min(20, points || 10),
    raison: raisons.length > 0 ? raisons.join(', ') : null,
  }
}

// === ALGORITHME PRINCIPAL ===

export function matcherStructures(
  criteria: MatchingCriteria,
  structures: StructureData[]
): MatchingResult[] {
  const resultats: MatchingResult[] = []

  for (const s of structures) {
    if (!s.actif) continue

    // === FILTRE PRÉFÉRENCE GRATUIT/PAYANT ===
    const sStatut = s.statut || 'public'
    if (criteria.preferenceStructure === 'privee' && sStatut !== 'lucratif') continue
    if (criteria.preferenceStructure === 'publique' && sStatut === 'lucratif') continue

    // === FILTRES ÉLIMINATOIRES ===

    // Géo : département doit matcher (sauf si pas de localisation connue)
    if (criteria.departement) {
      const dansDepart = s.departements.includes(criteria.departement)
      const dansRegion = memeRegion(criteria.departement, s.regions.length > 0 ? s.regions : s.departements)
      if (!dansDepart && !dansRegion) continue
    }

    // Âge : tolérance de ±2 ans
    if (criteria.age !== null) {
      if (criteria.age < s.ageMin - 2 || criteria.age > s.ageMax + 2) continue
    }

    // Urgence critique : ignorer le critère de capacité
    if (criteria.urgence !== 'critique') {
      if (s.casActifs >= s.capaciteMax) continue
    }

    // === SCORING ===
    let score = 0
    const raisons: string[] = []

    // 1. Géolocalisation (40 pts)
    if (criteria.departement) {
      if (s.departements.includes(criteria.departement)) {
        score += 40
        raisons.push('département couvert')
      } else {
        score += 25
        raisons.push('même région')
      }
    } else {
      score += 20 // pas de localisation → score neutre
    }

    // 2. Âge (25 pts)
    if (criteria.age !== null) {
      if (criteria.age >= s.ageMin && criteria.age <= s.ageMax) {
        score += 25
        raisons.push('tranche d\'âge')
      } else {
        const ecart = Math.min(
          Math.abs(criteria.age - s.ageMin),
          Math.abs(criteria.age - s.ageMax)
        )
        score += Math.max(0, 25 - ecart * 5)
        raisons.push('âge proche')
      }
    } else {
      score += 12
    }

    // 3. Spécialité (20 pts)
    const scoreSpec = calculerScoreSpecialite(criteria, s.specialites)
    score += scoreSpec.points
    if (scoreSpec.raison) raisons.push(scoreSpec.raison)

    // 4. Capacité (10 pts)
    const tauxRemplissage = s.casActifs / s.capaciteMax
    score += Math.round(10 * (1 - tauxRemplissage))
    if (tauxRemplissage < 0.5) raisons.push('bonne disponibilité')

    // 5. Genre (5 pts)
    if (!s.genrePreference || s.genrePreference === criteria.genre) {
      score += 5
    }

    resultats.push({
      structureId: s.id,
      structureNom: s.nom,
      score: Math.min(100, score),
      raisons,
      tauxRemplissage: Math.round(tauxRemplissage * 100),
      statut: sStatut,
    })
  }

  // Trier par score décroissant, puis par capacité restante
  return resultats.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.tauxRemplissage - b.tauxRemplissage
  })
}

// === UTILITAIRES EXPORTÉS ===

export function getRegionForDepartement(dep: string): string | null {
  return REGION_PAR_DEPARTEMENT[dep] || null
}

export function getDepartementsForRegion(region: string): string[] {
  return DEPARTEMENTS_PAR_REGION[region] || []
}

export function getMatchScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

export function getMatchScoreEmoji(score: number): string {
  if (score >= 80) return '🟢'
  if (score >= 50) return '🟡'
  if (score > 0) return '🔴'
  return '⚪'
}
