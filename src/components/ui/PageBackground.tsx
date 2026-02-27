'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface PageBackgroundProps {
  image: string
  position?: string
}

export function PageBackground({ image, position = 'center' }: PageBackgroundProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setContainer(document.getElementById('page-background'))
    return () => setContainer(null)
  }, [])

  if (!container) return null

  return createPortal(
    <div
      className="absolute inset-0 opacity-[0.15]"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: position,
        backgroundAttachment: 'fixed',
      }}
    />,
    container
  )
}
