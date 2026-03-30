'use client'

import { useState, useEffect, useRef } from 'react'
import { UserProfile, RIASEC_LABELS, RIASEC_COLORS, RIASEC_ICONS } from '@/core/types'
import { hasSignificantProfile } from '@/core/profile-parser'
import { getAllDimensions, getProfileSummary } from '@/core/riasec'
import { calculerIndiceConfiance, type IndiceConfiance } from '@/core/confidence'
import { type GameState, getJaugeLabel, getUnlockedBadges, getLockedBadges } from '@/core/gamification'

interface Props {
  profile: UserProfile
  messageCount?: number
  gameState?: GameState | null
  onClose: () => void
}

// Couleurs des 4 segments de la barre de confiance
const SEGMENT_COLORS = {
  debut:    { active: 'bg-gray-300',      inactive: 'bg-gray-100' },
  emergent: { active: 'bg-yellow-400',    inactive: 'bg-gray-100' },
  precis:   { active: 'bg-emerald-300',   inactive: 'bg-gray-100' },
  fiable:   { active: 'bg-emerald-500',   inactive: 'bg-gray-100' },
}

const NIVEAU_INDEX: Record<IndiceConfiance['niveau'], number> = {
  debut: 0,
  emergent: 1,
  precis: 2,
  fiable: 3,
}

function ConfidenceBar({ confiance }: { confiance: IndiceConfiance }) {
  const niveauIdx = NIVEAU_INDEX[confiance.niveau]
  const segments: Array<{ key: IndiceConfiance['niveau']; colors: typeof SEGMENT_COLORS['debut'] }> = [
    { key: 'debut',    colors: SEGMENT_COLORS.debut },
    { key: 'emergent', colors: SEGMENT_COLORS.emergent },
    { key: 'precis',   colors: SEGMENT_COLORS.precis },
    { key: 'fiable',   colors: SEGMENT_COLORS.fiable },
  ]

  return (
    <div className="flex gap-1.5">
      {segments.map((seg, i) => (
        <div
          key={seg.key}
          className={`h-2 flex-1 rounded-full transition-all duration-700 ease-out ${
            i <= niveauIdx ? seg.colors.active : seg.colors.inactive
          }`}
        />
      ))}
    </div>
  )
}

function ConfidenceIndicator({ confiance, animate }: { confiance: IndiceConfiance; animate: boolean }) {
  return (
    <div className={`transition-all duration-500 ${animate ? 'animate-bounce-once' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{confiance.emoji}</span>
        <span className="text-sm font-semibold text-gray-800">{confiance.label}</span>
      </div>
      <ConfidenceBar confiance={confiance} />
      <p className="text-xs text-gray-400 mt-1.5">
        Plus on discute, plus c&apos;est précis 😊
      </p>
    </div>
  )
}

// === JAUGE DE DÉCOUVERTE ===
function DiscoveryGauge({ jauge }: { jauge: number }) {
  const label = getJaugeLabel(jauge)

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-700">Découverte de soi</span>
        <span className="text-xs text-gray-400">{jauge}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-catchup-primary to-catchup-secondary transition-all duration-1000 ease-out"
          style={{ width: `${jauge}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-1">{label}</p>
    </div>
  )
}

// === BADGES ===
function BadgesSection({ gameState }: { gameState: GameState }) {
  const unlocked = getUnlockedBadges(gameState)
  const locked = getLockedBadges(gameState)

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Mes badges</h3>
      <div className="flex flex-wrap gap-2">
        {unlocked.map(b => (
          <div
            key={b.code}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-full"
            title={b.description}
          >
            <span className="text-sm">{b.emoji}</span>
            <span className="text-[11px] font-medium text-amber-800">{b.nom}</span>
          </div>
        ))}
        {locked.map(b => (
          <div
            key={b.code}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-full opacity-40"
            title="Badge verrouillé"
          >
            <span className="text-sm grayscale">🔒</span>
            <span className="text-[11px] font-medium text-gray-400">???</span>
          </div>
        ))}
      </div>
      {unlocked.length === 0 && (
        <p className="text-[11px] text-gray-400 mt-1">Continue la conversation pour débloquer des badges !</p>
      )}
    </div>
  )
}

// === STREAK RECORD ===
function StreakRecord({ gameState }: { gameState: GameState }) {
  if (gameState.streakRecord < 2) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl">
      <span className="text-lg" aria-hidden="true">🔥</span>
      <div>
        <span className="text-xs font-semibold text-orange-700">
          Série actuelle : {gameState.streakActuel} jour{gameState.streakActuel > 1 ? 's' : ''}
        </span>
        <p className="text-[10px] text-orange-400">
          Record : {gameState.streakRecord} jours
        </p>
      </div>
    </div>
  )
}

export default function ProfilePanel({ profile, messageCount = 0, gameState, onClose }: Props) {
  const hasProfile = hasSignificantProfile(profile)
  const dimensions = getAllDimensions(profile)
  const maxScore = Math.max(...dimensions.map(d => d.score), 1)

  // Calcul de l'indice de confiance
  const confiance = calculerIndiceConfiance(profile, messageCount)

  // Detecter un changement de niveau pour animer
  const prevNiveauRef = useRef<IndiceConfiance['niveau'] | null>(null)
  const [animateLevel, setAnimateLevel] = useState(false)

  useEffect(() => {
    if (prevNiveauRef.current !== null && prevNiveauRef.current !== confiance.niveau) {
      setAnimateLevel(true)
      const timer = setTimeout(() => setAnimateLevel(false), 800)
      return () => clearTimeout(timer)
    }
    prevNiveauRef.current = confiance.niveau
  }, [confiance.niveau])

  return (
    <div className="absolute inset-y-0 right-0 w-80 md:w-96 bg-white shadow-2xl z-40 slide-in-right flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-catchup-primary to-indigo-600 text-white px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Mon profil</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {profile.name && (
          <p className="text-white/90 text-sm">{profile.name}</p>
        )}
        <p className="text-white/70 text-xs mt-1">
          {hasProfile ? getProfileSummary(profile) : 'Continue la conversation pour découvrir ton profil !'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Jauge de découverte */}
        {gameState && <DiscoveryGauge jauge={gameState.jauge} />}

        {/* Indice de confiance */}
        <ConfidenceIndicator confiance={confiance} animate={animateLevel} />

        {/* Streak record */}
        {gameState && <StreakRecord gameState={gameState} />}

        {/* RIASEC bars */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Dimensions d&apos;orientation</h3>
          <div className="space-y-3">
            {dimensions.map(dim => (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                    <span>{RIASEC_ICONS[dim.key]}</span>
                    <span>{RIASEC_LABELS[dim.key]}</span>
                  </span>
                  <span className="text-xs text-gray-400">{dim.score}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${maxScore > 0 ? (dim.score / 100) * 100 : 0}%`,
                      backgroundColor: RIASEC_COLORS[dim.key],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traits */}
        {profile.traits.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Traits de personnalité</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.traits.map((trait, i) => (
                <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-100">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {profile.interests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Centres d&apos;intérêt</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest, i) => (
                <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {profile.strengths.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Points forts</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.strengths.map((s, i) => (
                <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggestion */}
        {profile.suggestion && (
          <div className="bg-gradient-to-br from-catchup-primary/5 to-indigo-50 rounded-xl p-4 border border-catchup-primary/10">
            <h3 className="text-sm font-semibold text-catchup-primary mb-1">💡 Piste suggérée</h3>
            <p className="text-sm text-gray-700">{profile.suggestion}</p>
          </div>
        )}

        {/* Badges */}
        {gameState && <BadgesSection gameState={gameState} />}

        {/* Empty state */}
        {!hasProfile && !gameState && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-sm text-gray-500">
              Ton profil se remplit au fur et à mesure de notre conversation.
              Plus on discute, plus je te connais !
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-300 text-center mt-4 px-2">
          Ce profil est une estimation basée sur notre conversation. Pour un bilan complet, parle avec un conseiller 😊
        </p>
      </div>
    </div>
  )
}
