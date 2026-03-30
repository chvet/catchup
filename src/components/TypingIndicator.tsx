'use client'

import { useAppBrand } from '@/hooks/useAppBrand'

export default function TypingIndicator() {
  const brandConfig = useAppBrand()

  return (
    <div className="flex items-start mb-2 msg-appear">
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mr-1.5 shadow-sm overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandConfig.logo} alt="" className="w-6 h-6 object-contain" aria-hidden="true" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full"
              style={{
                animation: 'typing-dot 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
