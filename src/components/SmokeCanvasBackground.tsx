'use client'

import { useEffect, useRef, useCallback } from 'react'

// ============================================================================
// TUNING PARAMETERS — Adjust these to control the smoke feel
// ============================================================================

const CONFIG = {
  // Particle count (10-15 for subtle effect)
  particleCount: 12,

  // Movement speed (pixels per frame at 30fps)
  riseSpeed: { min: 0.2, max: 0.4 },

  // Horizontal drift amplitude (subtle sway)
  driftAmplitude: 0.3,
  driftFrequency: 0.0008,

  // Particle size range (pixels)
  size: { min: 150, max: 350 },

  // Opacity range (keep low for subtlety)
  opacity: { min: 0.03, max: 0.08 },

  // Rotation speed (radians per frame)
  rotationSpeed: { min: -0.001, max: 0.001 },

  // Spawn area (percentage of canvas width/height)
  spawnArea: {
    xMin: 0.3,  // 30% from left
    xMax: 0.7,  // 70% from left
    yMin: 0.6,  // Start from 60% down (near hookah)
    yMax: 1.0,  // To bottom
  },

  // Fade zones (percentage of canvas height)
  fadeInZone: 0.15,   // Fade in over top 15% of spawn area
  fadeOutZone: 0.2,   // Fade out over top 20% of canvas

  // Frame rate cap (ms between frames, 33 = ~30fps)
  frameInterval: 33,
}

// ============================================================================
// TYPES
// ============================================================================

interface SmokeParticle {
  x: number
  y: number
  size: number
  baseOpacity: number
  opacity: number
  riseSpeed: number
  driftOffset: number
  rotation: number
  rotationSpeed: number
  born: number  // timestamp for drift calculation
}

interface Props {
  /** Path to the static background image */
  imageSrc: string
  /** Force disable animation (for testing) */
  disabled?: boolean
  /** Additional className for the container */
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SmokeCanvasBackground({ imageSrc, disabled = false, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<SmokeParticle[]>([])
  const smokeTextureRef = useRef<HTMLImageElement | null>(null)
  const animationRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)
  const isActiveRef = useRef<boolean>(false)

  // -------------------------------------------------------------------------
  // Check if animation should be disabled
  // -------------------------------------------------------------------------
  const shouldDisableAnimation = useCallback((): boolean => {
    if (disabled) return true
    if (typeof window === 'undefined') return true

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true
    }

    // Disable on mobile devices
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      return true
    }

    // Disable on slow connections
    const connection = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (connection?.saveData || connection?.effectiveType === '2g') {
      return true
    }

    return false
  }, [disabled])

  // -------------------------------------------------------------------------
  // Random helper
  // -------------------------------------------------------------------------
  const random = (min: number, max: number): number => {
    return min + Math.random() * (max - min)
  }

  // -------------------------------------------------------------------------
  // Create a new smoke particle
  // -------------------------------------------------------------------------
  const createParticle = useCallback((canvasWidth: number, canvasHeight: number): SmokeParticle => {
    const { spawnArea, size, opacity, riseSpeed, rotationSpeed } = CONFIG

    return {
      x: random(canvasWidth * spawnArea.xMin, canvasWidth * spawnArea.xMax),
      y: random(canvasHeight * spawnArea.yMin, canvasHeight * spawnArea.yMax),
      size: random(size.min, size.max),
      baseOpacity: random(opacity.min, opacity.max),
      opacity: 0,  // Will fade in
      riseSpeed: random(riseSpeed.min, riseSpeed.max),
      driftOffset: random(0, Math.PI * 2),
      rotation: random(0, Math.PI * 2),
      rotationSpeed: random(rotationSpeed.min, rotationSpeed.max),
      born: Date.now(),
    }
  }, [])

  // -------------------------------------------------------------------------
  // Reset particle to bottom (object pooling - reuse instead of create)
  // -------------------------------------------------------------------------
  const resetParticle = useCallback((particle: SmokeParticle, canvasWidth: number, canvasHeight: number): void => {
    const { spawnArea, size, opacity, riseSpeed, rotationSpeed } = CONFIG

    particle.x = random(canvasWidth * spawnArea.xMin, canvasWidth * spawnArea.xMax)
    particle.y = random(canvasHeight * spawnArea.yMin, canvasHeight * spawnArea.yMax)
    particle.size = random(size.min, size.max)
    particle.baseOpacity = random(opacity.min, opacity.max)
    particle.opacity = 0
    particle.riseSpeed = random(riseSpeed.min, riseSpeed.max)
    particle.driftOffset = random(0, Math.PI * 2)
    particle.rotation = random(0, Math.PI * 2)
    particle.rotationSpeed = random(rotationSpeed.min, rotationSpeed.max)
    particle.born = Date.now()
  }, [])

  // -------------------------------------------------------------------------
  // Calculate particle opacity based on position (fade in/out zones)
  // -------------------------------------------------------------------------
  const calculateOpacity = useCallback((particle: SmokeParticle, canvasHeight: number): number => {
    const { fadeInZone, fadeOutZone, spawnArea } = CONFIG

    const spawnTop = canvasHeight * spawnArea.yMin
    const fadeInEnd = spawnTop + canvasHeight * fadeInZone
    const fadeOutStart = canvasHeight * fadeOutZone

    let multiplier = 1

    // Fade in when just spawned (near bottom of spawn area)
    if (particle.y > fadeInEnd) {
      multiplier = 1 - (particle.y - fadeInEnd) / (canvasHeight - fadeInEnd)
    }

    // Fade out when near top
    if (particle.y < fadeOutStart) {
      multiplier = particle.y / fadeOutStart
    }

    return particle.baseOpacity * Math.max(0, Math.min(1, multiplier))
  }, [])

  // -------------------------------------------------------------------------
  // Draw a single smoke particle
  // -------------------------------------------------------------------------
  const drawParticle = useCallback((
    ctx: CanvasRenderingContext2D,
    particle: SmokeParticle,
    texture: HTMLImageElement
  ): void => {
    if (particle.opacity <= 0) return

    ctx.save()
    ctx.translate(particle.x, particle.y)
    ctx.rotate(particle.rotation)
    ctx.globalAlpha = particle.opacity
    ctx.drawImage(
      texture,
      -particle.size / 2,
      -particle.size / 2,
      particle.size,
      particle.size
    )
    ctx.restore()
  }, [])

  // -------------------------------------------------------------------------
  // Animation loop
  // -------------------------------------------------------------------------
  const animate = useCallback((timestamp: number) => {
    if (!isActiveRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const texture = smokeTextureRef.current

    if (!canvas || !ctx || !texture) {
      animationRef.current = requestAnimationFrame(animate)
      return
    }

    // Frame rate limiting (~30fps)
    if (timestamp - lastFrameRef.current < CONFIG.frameInterval) {
      animationRef.current = requestAnimationFrame(animate)
      return
    }
    lastFrameRef.current = timestamp

    const { width, height } = canvas

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Set blend mode for additive-like effect
    ctx.globalCompositeOperation = 'screen'

    // Update and draw each particle
    particlesRef.current.forEach(particle => {
      // Rise upward
      particle.y -= particle.riseSpeed

      // Horizontal drift (slow sine wave)
      const time = Date.now() - particle.born
      particle.x += Math.sin(time * CONFIG.driftFrequency + particle.driftOffset) * CONFIG.driftAmplitude

      // Rotate slowly
      particle.rotation += particle.rotationSpeed

      // Update opacity based on position
      particle.opacity = calculateOpacity(particle, height)

      // Draw
      drawParticle(ctx, particle, texture)

      // Reset if particle has risen above canvas
      if (particle.y < -particle.size) {
        resetParticle(particle, width, height)
      }
    })

    // Continue animation
    animationRef.current = requestAnimationFrame(animate)
  }, [calculateOpacity, drawParticle, resetParticle])

  // -------------------------------------------------------------------------
  // Initialize canvas and particles
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (shouldDisableAnimation()) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size to match viewport (no devicePixelRatio scaling)
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Reinitialize particles on resize
      particlesRef.current = Array.from(
        { length: CONFIG.particleCount },
        () => createParticle(canvas.width, canvas.height)
      )

      // Stagger initial positions so particles aren't all at bottom
      particlesRef.current.forEach((p, i) => {
        const progress = i / CONFIG.particleCount
        p.y = canvas.height * (CONFIG.spawnArea.yMin + (1 - CONFIG.spawnArea.yMin) * (1 - progress))
      })
    }

    // Load smoke texture (generate procedurally)
    const loadTexture = () => {
      const textureDataUrl = generateSmokeTexture()
      if (!textureDataUrl) {
        // Failed to generate smoke texture, animation disabled
        return
      }

      const img = new Image()
      img.onload = () => {
        smokeTextureRef.current = img
        isActiveRef.current = true
        animationRef.current = requestAnimationFrame(animate)
      }
      img.src = textureDataUrl
    }

    resize()
    loadTexture()

    window.addEventListener('resize', resize)

    return () => {
      isActiveRef.current = false
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [shouldDisableAnimation, createParticle, animate])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const isDisabled = shouldDisableAnimation()

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Layer 0: Static background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageSrc})` }}
      />

      {/* Layer 1: Canvas smoke overlay (only if animation enabled) */}
      {!isDisabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Layer 2: Vignette overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Layer 3: Bottom cover to hide any watermarks in the source image */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '35%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(10,10,15,1) 35%)',
        }}
      />
    </div>
  )
}

// ============================================================================
// PROCEDURAL SMOKE TEXTURE GENERATION
// Creates a soft, irregular cloud shape at runtime
// ============================================================================

function generateSmokeTexture(): string {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // Seed random for consistent-ish results
  const random = (min: number, max: number) => min + Math.random() * (max - min)

  // Clear with transparency
  ctx.clearRect(0, 0, size, size)

  // Create base soft cloud with radial gradient
  const baseGradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  baseGradient.addColorStop(0, 'rgba(240, 240, 240, 0.6)')
  baseGradient.addColorStop(0.4, 'rgba(220, 220, 220, 0.4)')
  baseGradient.addColorStop(0.7, 'rgba(200, 200, 200, 0.15)')
  baseGradient.addColorStop(1, 'rgba(180, 180, 180, 0)')

  ctx.fillStyle = baseGradient
  ctx.fillRect(0, 0, size, size)

  // Add irregularity with multiple offset blobs
  const blobCount = 6
  for (let i = 0; i < blobCount; i++) {
    const offsetX = random(-25, 25)
    const offsetY = random(-25, 25)
    const blobSize = random(size / 4, size / 2.5)

    const blobGradient = ctx.createRadialGradient(
      size / 2 + offsetX,
      size / 2 + offsetY,
      0,
      size / 2 + offsetX,
      size / 2 + offsetY,
      blobSize
    )
    blobGradient.addColorStop(0, `rgba(235, 235, 235, ${random(0.2, 0.4)})`)
    blobGradient.addColorStop(0.5, `rgba(220, 220, 220, ${random(0.1, 0.2)})`)
    blobGradient.addColorStop(1, 'rgba(200, 200, 200, 0)')

    ctx.fillStyle = blobGradient
    ctx.beginPath()
    ctx.arc(size / 2 + offsetX, size / 2 + offsetY, blobSize, 0, Math.PI * 2)
    ctx.fill()
  }

  return canvas.toDataURL('image/png')
}
