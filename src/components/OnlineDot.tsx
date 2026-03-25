'use client'

/**
 * A green/gray dot indicating online/offline status.
 * Green dot pulses subtly when online.
 */
export default function OnlineDot({
  online,
  showLabel,
  className = '',
}: {
  online: boolean
  showLabel?: boolean
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          online
            ? 'bg-green-500 animate-[pulse-dot_2s_ease-in-out_infinite]'
            : 'bg-gray-300'
        }`}
      />
      {showLabel && (
        <span className={`text-xs ${online ? 'text-green-600' : 'text-gray-400'}`}>
          {online ? 'En ligne' : 'Hors ligne'}
        </span>
      )}
    </span>
  )
}
