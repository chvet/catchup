/**
 * Moteur de gamification Catch'Up
 * Gère la jauge de découverte, les badges et le streak
 * Stockage : localStorage (MVP)
 */

import { UserProfile } from './types'

// === TYPES ===

export interface GameState {
  // Jauge de découverte (0-100)
  jauge: number
  jaugeActions: string[] // actions déjà comptabilisées (évite les doublons)

  // Streak
  streakActuel: number
  streakRecord: number
  dernierJourActif: string | null // format YYYY-MM-DD

  // Badges
  badges: Badge[]

  // Timestamp
  updatedAt: number
}

export interface Badge {
  code: string
  nom: string
  emoji: string
  description: string
  deblogueLe: string | null // ISO date ou null si pas débloqué
}

export interface GameEvent {
  type: 'badge_unlocked' | 'jauge_milestone' | 'streak_update'
  badge?: Badge
  jauge?: number
  streak?: number
}

// === CONSTANTES ===

const LS_GAME_KEY = 'catchup_game'

const BADGE_DEFINITIONS: Omit<Badge, 'deblogueLe'>[] = [
  { code: 'premier_pas',     nom: 'Premier pas',      emoji: '👣', description: 'Envoyer ton premier message' },
  { code: 'curieux',         nom: 'Curieux',           emoji: '🔍', description: 'Poser 3 questions à Catch\'Up' },
  { code: 'ouvert',          nom: 'Ouvert',            emoji: '💡', description: 'Partager un centre d\'intérêt' },
  { code: 'esquisse',        nom: 'Esquissé',          emoji: '✏️', description: 'Profil RIASEC avec 2+ dimensions actives' },
  { code: 'precis',          nom: 'Précis',            emoji: '🎯', description: 'Indice de confiance > 50%' },
  { code: 'complet',         nom: 'Complet',           emoji: '⭐', description: 'Indice de confiance > 75%' },
  { code: 'explorateur',     nom: 'Explorateur',       emoji: '🧭', description: 'Explorer 3+ pistes de métiers' },
  { code: 'fidele',          nom: 'Fidèle',            emoji: '🏠', description: 'Revenir 3 jours' },
]

// Actions de jauge et leurs points
const JAUGE_ACTIONS: Record<string, number> = {
  premier_message:    10,  // Briser la glace
  prenom_donne:        5,  // Lien de confiance
  cinq_messages:      10,  // Engagement
  profil_2_dims:      15,  // Le profil prend forme
  confiance_50:       15,  // Profil fiable
  piste_metier:       10,  // Projection concrète
  partage_profil:     10,  // Viralité
  retour_session:     10,  // Rétention
  email_donne:        10,  // Engagement fort
  profil_stabilise:    5,  // Objectif atteint
}

const JAUGE_MILESTONES = [20, 40, 60, 80, 100]

const JAUGE_LABELS: Record<number, string> = {
  0:   'Prêt à démarrer 🚀',
  20:  'Premiers échanges',
  40:  'Je commence à te cerner',
  60:  'Ton profil se dessine 🎯',
  80:  'Presque complet',
  100: 'Je te connais bien ! 🎉',
}

// === FONCTIONS ===

export function getJaugeLabel(jauge: number): string {
  if (jauge >= 100) return JAUGE_LABELS[100]
  if (jauge >= 80) return JAUGE_LABELS[80]
  if (jauge >= 60) return JAUGE_LABELS[60]
  if (jauge >= 40) return JAUGE_LABELS[40]
  if (jauge >= 20) return JAUGE_LABELS[20]
  return JAUGE_LABELS[0]
}

/** Charge l'état de gamification depuis le localStorage */
export function loadGameState(): GameState {
  if (typeof window === 'undefined') return createEmptyState()
  try {
    const raw = localStorage.getItem(LS_GAME_KEY)
    if (!raw) return createEmptyState()
    const state = JSON.parse(raw) as GameState
    // S'assurer que tous les badges définis existent
    return migrateState(state)
  } catch {
    return createEmptyState()
  }
}

/** Sauvegarde l'état de gamification */
export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(LS_GAME_KEY, JSON.stringify({ ...state, updatedAt: Date.now() }))
  } catch { /* quota exceeded */ }
}

/** Crée un état vide avec tous les badges définis (non débloqués) */
function createEmptyState(): GameState {
  return {
    jauge: 0,
    jaugeActions: [],
    streakActuel: 0,
    streakRecord: 0,
    dernierJourActif: null,
    badges: BADGE_DEFINITIONS.map(b => ({ ...b, deblogueLe: null })),
    updatedAt: Date.now(),
  }
}

/** Ajoute les badges manquants si de nouveaux ont été définis */
function migrateState(state: GameState): GameState {
  const existingCodes = new Set(state.badges.map(b => b.code))
  for (const def of BADGE_DEFINITIONS) {
    if (!existingCodes.has(def.code)) {
      state.badges.push({ ...def, deblogueLe: null })
    }
  }
  return state
}

/** Retourne la date du jour au format YYYY-MM-DD */
function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// === MISE À JOUR DU STREAK ===

export function updateStreak(state: GameState): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = []
  const today = getTodayStr()

  if (state.dernierJourActif === today) {
    // Déjà actif aujourd'hui — rien à faire
    return { state, events }
  }

  const newState = { ...state }

  if (!state.dernierJourActif) {
    // Premier jour
    newState.streakActuel = 1
  } else {
    const lastDate = new Date(state.dernierJourActif)
    const todayDate = new Date(today)
    const diffMs = todayDate.getTime() - lastDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 2) {
      // Dans la tolérance de 48h → le streak continue
      newState.streakActuel = state.streakActuel + 1
    } else {
      // Streak cassé → repart à 1
      newState.streakActuel = 1
    }
  }

  newState.dernierJourActif = today
  if (newState.streakActuel > newState.streakRecord) {
    newState.streakRecord = newState.streakActuel
  }

  events.push({ type: 'streak_update', streak: newState.streakActuel })

  return { state: newState, events }
}

// === MISE À JOUR DE LA JAUGE ===

export function addJaugeAction(state: GameState, actionCode: string): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = []

  if (state.jaugeActions.includes(actionCode)) {
    // Action déjà comptabilisée
    return { state, events }
  }

  const points = JAUGE_ACTIONS[actionCode]
  if (!points) return { state, events }

  const newState = { ...state }
  const oldJauge = state.jauge
  newState.jauge = Math.min(100, state.jauge + points)
  newState.jaugeActions = [...state.jaugeActions, actionCode]

  // Vérifier les paliers franchis
  for (const milestone of JAUGE_MILESTONES) {
    if (oldJauge < milestone && newState.jauge >= milestone) {
      events.push({ type: 'jauge_milestone', jauge: milestone })
    }
  }

  return { state: newState, events }
}

// === DÉBLOCAGE DES BADGES ===

export function checkBadges(
  state: GameState,
  context: {
    messageCount: number
    profile: UserProfile
    confianceScore: number
    suggestionsCount: number
    sessionCount: number
  }
): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = []
  const newBadges = [...state.badges]
  const now = new Date().toISOString()

  const unlock = (code: string) => {
    const badge = newBadges.find(b => b.code === code)
    if (badge && !badge.deblogueLe) {
      badge.deblogueLe = now
      events.push({ type: 'badge_unlocked', badge: { ...badge } })
    }
  }

  // Premier pas : 1er message envoyé
  if (context.messageCount >= 1) unlock('premier_pas')

  // Curieux : 3+ messages utilisateur
  if (context.messageCount >= 3) unlock('curieux')

  // Ouvert : au moins 1 centre d'intérêt détecté
  if (context.profile.interests.length > 0) unlock('ouvert')

  // Esquissé : 2+ dimensions RIASEC > 20
  const activeDims = (['R', 'I', 'A', 'S', 'E', 'C'] as const).filter(k => context.profile[k] > 20)
  if (activeDims.length >= 2) unlock('esquisse')

  // Précis : confiance > 50%
  if (context.confianceScore > 50) unlock('precis')

  // Complet : confiance > 75%
  if (context.confianceScore > 75) unlock('complet')

  // Explorateur : 3+ suggestions de métiers (via profile.suggestion changé 3+ fois)
  if (context.suggestionsCount >= 3) unlock('explorateur')

  // Fidèle : streak de 3+ jours OU sessionCount >= 3
  if (state.streakActuel >= 3 || context.sessionCount >= 3) unlock('fidele')

  return { state: { ...state, badges: newBadges }, events }
}

// === ÉVALUER TOUTES LES ACTIONS DE JAUGE ===

export function evaluateJaugeActions(
  state: GameState,
  context: {
    messageCount: number
    profile: UserProfile
    confianceScore: number
    hasShared: boolean
    isReturning: boolean
  }
): { state: GameState; events: GameEvent[] } {
  let currentState = { ...state }
  let allEvents: GameEvent[] = []

  const tryAction = (code: string, condition: boolean) => {
    if (condition) {
      const { state: s, events: e } = addJaugeAction(currentState, code)
      currentState = s
      allEvents = [...allEvents, ...e]
    }
  }

  tryAction('premier_message', context.messageCount >= 1)
  tryAction('prenom_donne', !!context.profile.name)
  tryAction('cinq_messages', context.messageCount >= 5)

  const activeDims = (['R', 'I', 'A', 'S', 'E', 'C'] as const).filter(k => context.profile[k] > 20)
  tryAction('profil_2_dims', activeDims.length >= 2)
  tryAction('confiance_50', context.confianceScore >= 50)
  tryAction('piste_metier', !!context.profile.suggestion)
  tryAction('partage_profil', context.hasShared)
  tryAction('retour_session', context.isReturning)
  tryAction('profil_stabilise', context.confianceScore >= 75)

  return { state: currentState, events: allEvents }
}

// === UTILITAIRES ===

export function getUnlockedBadges(state: GameState): Badge[] {
  return state.badges.filter(b => b.deblogueLe !== null)
}

export function getLockedBadges(state: GameState): Badge[] {
  return state.badges.filter(b => b.deblogueLe === null)
}
