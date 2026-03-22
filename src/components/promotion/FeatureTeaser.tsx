'use client'

interface Props {
  feature: 'ar' | 'shake' | 'location' | 'widget' | 'offline'
  compact?: boolean
}

const FEATURES = {
  ar: { icon: '📸', label: 'Filtre AR "moi en tant que..."' },
  shake: { icon: '📱', label: 'Secoue pour un métier surprise' },
  location: { icon: '📍', label: 'Formations à proximité' },
  widget: { icon: '🏠', label: 'Widget motivation' },
  offline: { icon: '✈️', label: 'Mode hors-ligne complet' },
}

export default function FeatureTeaser({ feature, compact = false }: Props) {
  const f = FEATURES[feature]

  return (
    <div className={`
      inline-flex items-center gap-2 bg-gray-50 border border-gray-200
      rounded-xl text-gray-500 cursor-default
      ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
    `}>
      <span className="text-gray-400">🔒</span>
      <span>{f.icon}</span>
      <span>{f.label}</span>
      <span className="text-[10px] text-catchup-primary font-medium ml-1">
        Dispo dans l&apos;app
      </span>
    </div>
  )
}
