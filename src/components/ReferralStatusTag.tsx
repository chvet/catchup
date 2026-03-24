'use client'

// Tag visuel du statut d'une demande de mise en relation
// Affiché dans l'espace bénéficiaire pour suivre la progression

const STATUT_CONFIG: Record<string, {
  bg: string
  text: string
  border: string
  label: string
  icon: string
  pulse?: boolean
}> = {
  en_attente: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'En attente',
    icon: '⏳',
    pulse: true,
  },
  nouvelle: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Envoyée',
    icon: '📨',
    pulse: true,
  },
  prise_en_charge: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Pris en charge',
    icon: '✅',
  },
  terminee: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
    label: 'Terminé',
    icon: '✔️',
  },
  annulee: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
    label: 'Annulée',
    icon: '🚫',
  },
  abandonnee: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    label: 'Annulé',
    icon: '❌',
  },
}

interface Props {
  statut: string
  withLabel?: boolean // Affiche le label long (pour le tag flottant en haut)
}

export default function ReferralStatusTag({ statut, withLabel = false }: Props) {
  const config = STATUT_CONFIG[statut] || STATUT_CONFIG.en_attente

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        ${config.bg} ${config.text} ${config.border} border
        ${config.pulse ? 'animate-pulse' : ''}
        shadow-sm
      `}
    >
      <span>{config.icon}</span>
      {withLabel ? (
        <span>Demande : {config.label}</span>
      ) : (
        <span>{config.label}</span>
      )}
    </span>
  )
}
