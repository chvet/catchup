'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  QUIZ_QUESTIONS,
  QUIZ_RESULTS,
  DIMENSION_LABELS,
  DIMENSION_EMOJIS,
  computeScores,
  getTopTwo,
  getResultKey,
  PRIORITY_ORDER,
  type RIASECDimension,
  type QuizChoice,
} from '@/core/quiz-data'
import { RIASEC_COLORS } from '@/core/types'

type Step = 'splash' | 'q1' | 'q2' | 'q3' | 'result'
const STEPS: Step[] = ['splash', 'q1', 'q2', 'q3', 'result']

function getQuestionIndex(step: Step): number {
  if (step === 'q1') return 0
  if (step === 'q2') return 1
  if (step === 'q3') return 2
  return -1
}

// --- Splash Screen ---

function SplashScreen({ onStart }: { onStart: () => void }) {
  const [visible, setVisible] = useState(false)
  const [counter] = useState(() => {
    // Compteur "realiste" simule cote client
    const base = 12847
    const daysSinceEpoch = Math.floor(Date.now() / 86400000)
    return base + (daysSinceEpoch % 500) * 7
  })

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div
        className={`transition-all duration-700 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="text-6xl mb-6" aria-hidden="true">
          {'\u{1F680}'}
        </div>

        <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
          Decouvre qui tu es
          <br />
          en 30 secondes
        </h1>

        <p className="text-white/70 text-lg mb-10">
          3 questions, 0 prise de tete
        </p>

        <button
          onClick={onStart}
          className="
            bg-white text-catchup-primary font-bold text-lg
            px-10 py-4 rounded-2xl shadow-lg
            animate-pulse-soft
            active:scale-95 transition-transform
            focus:outline-none focus:ring-4 focus:ring-white/30
          "
          aria-label="Commencer le quiz"
        >
          C&apos;est parti !&nbsp;&rarr;
        </button>

        <p className="text-white/50 text-sm mt-8">
          Deja{' '}
          <span className="font-semibold text-white/70">
            {counter.toLocaleString('fr-FR')}
          </span>{' '}
          jeunes l&apos;ont fait
        </p>
      </div>
    </div>
  )
}

// --- Question Screen ---

function QuestionScreen({
  questionIndex,
  onAnswer,
}: {
  questionIndex: number
  onAnswer: (choice: 0 | 1) => void
}) {
  const q = QUIZ_QUESTIONS[questionIndex]
  const [selected, setSelected] = useState<0 | 1 | null>(null)
  const [entering, setEntering] = useState(true)

  useEffect(() => {
    setSelected(null)
    setEntering(true)
    const t = setTimeout(() => setEntering(false), 50)
    return () => clearTimeout(t)
  }, [questionIndex])

  const handleChoice = useCallback(
    (choice: 0 | 1) => {
      if (selected !== null) return
      setSelected(choice)
      // Petite pause pour l'animation
      setTimeout(() => onAnswer(choice), 400)
    },
    [selected, onAnswer]
  )

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === '1') handleChoice(0)
      if (e.key === 'ArrowRight' || e.key === '2') handleChoice(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleChoice])

  const renderCard = (choice: QuizChoice, side: 0 | 1) => {
    const isSelected = selected === side
    const isOther = selected !== null && selected !== side

    return (
      <button
        onClick={() => handleChoice(side)}
        disabled={selected !== null}
        className={`
          flex-1 flex flex-col items-center justify-center
          bg-white/10 backdrop-blur-sm
          border-2 border-white/20
          rounded-3xl p-6 min-h-[200px]
          transition-all duration-300 ease-out
          ${isSelected ? 'scale-105 border-white/80 bg-white/20 shadow-2xl' : ''}
          ${isOther ? 'scale-90 opacity-30' : ''}
          ${selected === null ? 'hover:bg-white/15 hover:border-white/40 hover:scale-[1.02] active:scale-95' : ''}
          focus:outline-none focus:ring-4 focus:ring-white/30
        `}
        aria-label={choice.label}
      >
        <span className="text-5xl mb-4" aria-hidden="true">
          {choice.emoji}
        </span>
        <span className="text-white font-semibold text-base leading-snug text-center">
          {choice.label}
        </span>
      </button>
    )
  }

  return (
    <div
      className={`
        flex flex-col items-center justify-center min-h-screen px-5
        transition-all duration-300 ease-out
        ${entering ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
      `}
    >
      {/* Progress dots */}
      <div className="flex items-center gap-3 mb-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${i <= questionIndex ? 'bg-white scale-100' : 'bg-white/30 scale-75'}
            `}
          />
        ))}
        <span className="text-white/50 text-sm ml-3">
          {questionIndex + 1}/3
        </span>
      </div>

      {/* Question */}
      <h2 className="text-2xl font-bold text-white text-center mb-10 mt-4">
        {q.question}
      </h2>

      {/* Cards */}
      <div className="flex gap-4 w-full max-w-md">
        {renderCard(q.left, 0)}
        {renderCard(q.right, 1)}
      </div>

      <p className="text-white/40 text-sm mt-8">
        Tape sur ton choix
      </p>
    </div>
  )
}

// --- Result Screen ---

function ResultScreen({
  answers,
  onDiscover,
  onRetry,
}: {
  answers: (0 | 1)[]
  onDiscover: () => void
  onRetry: () => void
}) {
  const scores = computeScores(answers)
  const topTwo = getTopTwo(scores)
  const resultKey = getResultKey(topTwo)
  const result = QUIZ_RESULTS[resultKey]

  const [animating, setAnimating] = useState(true)
  const [barWidths, setBarWidths] = useState<Record<string, number>>({})
  const [shared, setShared] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimating(false), 100)
    return () => clearTimeout(t)
  }, [])

  // Animer les barres apres apparition
  useEffect(() => {
    const t = setTimeout(() => {
      const maxScore = 55 // max possible
      const widths: Record<string, number> = {}
      for (const dim of PRIORITY_ORDER) {
        widths[dim] = Math.round((scores[dim] / maxScore) * 100)
      }
      setBarWidths(widths)
    }, 300)
    return () => clearTimeout(t)
  }, [scores])

  // Trier les dimensions par score (top deux en premier)
  const sortedDims = [...PRIORITY_ORDER].sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a]
    return PRIORITY_ORDER.indexOf(a) - PRIORITY_ORDER.indexOf(b)
  })

  const handleShare = async () => {
    const shareText = `Mon profil Catch'Up : ${result?.title} ${result?.emoji}\nEt toi t'es quoi ? \u{1F440}\ncatchup.jaeprive.fr/quiz`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mon profil Catch'Up",
          text: shareText,
          url: 'https://catchup.jaeprive.fr/quiz',
        })
      } catch {
        // L'utilisateur a annule
      }
    } else {
      // Fallback : copier le lien
      try {
        await navigator.clipboard.writeText(shareText)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } catch {
        // Pas de clipboard
      }
    }
  }

  if (!result) return null

  return (
    <div
      className={`
        flex flex-col items-center min-h-screen px-5 py-10
        transition-all duration-500 ease-out
        ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
      `}
    >
      {/* Header */}
      <p className="text-white/60 text-lg mb-2 mt-4">Tu es plutot...</p>

      {/* Profile emoji + title */}
      <div className="text-5xl mb-3 animate-bounce-once" aria-hidden="true">
        {result.emoji}
      </div>
      <h2 className="text-3xl font-bold text-white mb-6 text-center">
        {result.title}
      </h2>

      {/* Description */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 max-w-md w-full mb-8">
        <p className="text-white/90 text-base leading-relaxed text-center">
          {result.description}
        </p>
      </div>

      {/* RIASEC Bars - top 2 */}
      <div className="w-full max-w-md space-y-3 mb-10">
        {sortedDims.slice(0, 2).map((dim) => (
          <div key={dim} className="flex items-center gap-3">
            <span className="text-xl w-7" aria-hidden="true">
              {DIMENSION_EMOJIS[dim]}
            </span>
            <span className="text-white/80 text-sm w-28 truncate">
              {DIMENSION_LABELS[dim]}
            </span>
            <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${barWidths[dim] || 0}%`,
                  backgroundColor: RIASEC_COLORS[dim],
                }}
              />
            </div>
            <span className="text-white/60 text-sm w-8 text-right">
              {scores[dim]}
            </span>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="w-full max-w-md space-y-3">
        <button
          onClick={onDiscover}
          className="
            w-full bg-white text-catchup-primary font-bold text-lg
            px-6 py-4 rounded-2xl shadow-lg
            animate-pulse-soft
            active:scale-95 transition-transform
            focus:outline-none focus:ring-4 focus:ring-white/30
          "
        >
          {'\u{1F680}'} Decouvre tes metiers &rarr;
        </button>

        <button
          onClick={handleShare}
          className="
            w-full bg-white/10 border-2 border-white/20 text-white font-semibold text-base
            px-6 py-3.5 rounded-2xl
            hover:bg-white/15 active:scale-95 transition-all
            focus:outline-none focus:ring-4 focus:ring-white/30
          "
        >
          {shared ? '\u2705 Copie !' : '\u{1F4F1} Partage ton resultat'}
        </button>

        <button
          onClick={onRetry}
          className="
            w-full text-white/50 font-medium text-sm
            py-3
            hover:text-white/70 active:scale-95 transition-all
            focus:outline-none focus:ring-2 focus:ring-white/20
          "
        >
          {'\u{1F504}'} Refaire le test
        </button>
      </div>
    </div>
  )
}

// === Main Quiz Page ===

function QuizPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>('splash')
  const [answers, setAnswers] = useState<(0 | 1)[]>([])

  // Stocker ref et src en localStorage
  useEffect(() => {
    const ref = searchParams.get('ref')
    const src = searchParams.get('src')
    if (ref) localStorage.setItem('catchup_ref', ref)
    if (src) localStorage.setItem('catchup_src', src)
  }, [searchParams])

  const handleStart = useCallback(() => {
    setStep('q1')
  }, [])

  const handleAnswer = useCallback(
    (choice: 0 | 1) => {
      const newAnswers = [...answers, choice]
      setAnswers(newAnswers)

      const currentIndex = STEPS.indexOf(step)
      const nextStep = STEPS[currentIndex + 1]
      if (nextStep) {
        setStep(nextStep)
      }
    },
    [answers, step]
  )

  const handleDiscover = useCallback(() => {
    // Sauvegarder le profil quiz en localStorage
    const scores = computeScores(answers)
    const topTwo = getTopTwo(scores)
    const quizData = {
      source: 'quiz',
      scores: {
        R: scores.R,
        I: scores.I,
        A: scores.A,
        S: scores.S,
        E: scores.E,
        C: scores.C,
      },
      topDimensions: [DIMENSION_LABELS[topTwo[0]], DIMENSION_LABELS[topTwo[1]]],
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('catchup_quiz', JSON.stringify(quizData))
    router.push('/')
  }, [answers, router])

  const handleRetry = useCallback(() => {
    setAnswers([])
    setStep('splash')
  }, [])

  const qIndex = getQuestionIndex(step)

  return (
    <main className="min-h-screen bg-gradient-to-br from-catchup-primary via-purple-600 to-catchup-secondary overflow-hidden select-none">
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-catchup-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {step === 'splash' && <SplashScreen onStart={handleStart} />}

        {qIndex >= 0 && (
          <QuestionScreen
            key={qIndex}
            questionIndex={qIndex}
            onAnswer={handleAnswer}
          />
        )}

        {step === 'result' && (
          <ResultScreen
            answers={answers}
            onDiscover={handleDiscover}
            onRetry={handleRetry}
          />
        )}
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
        @keyframes bounce-once {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out forwards;
        }
      `}</style>
    </main>
  )
}

export default function QuizPage() {
  return (
    <Suspense>
      <QuizPageInner />
    </Suspense>
  )
}
