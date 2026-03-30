'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-start mb-2 msg-appear">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-catchup-primary to-catchup-accent flex items-center justify-center flex-shrink-0 mr-1.5">
        <span className="text-sm">🚀</span>
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
