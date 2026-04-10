'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-start mb-2 msg-appear" role="status" aria-label="L'assistant est en train d'écrire">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mr-1 sm:mr-1.5 shadow-sm overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon-catchup.png?v=3" alt="Catch'Up" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
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
