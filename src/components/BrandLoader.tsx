'use client'

interface BrandLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
}

export function BrandLoader({ size = 'md', text, fullScreen = false }: BrandLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} rounded-xl overflow-hidden`}>
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/torus-logo.png"
          className="w-full h-full object-cover"
        >
          <source src="/images/logo-animated.mp4" type="video/mp4" />
        </video>
      </div>
      {text && (
        <p className="text-sm text-[var(--color-textMuted)] animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg)]">
        {content}
      </div>
    )
  }

  return content
}
