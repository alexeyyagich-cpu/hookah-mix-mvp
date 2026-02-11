import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Hookah Torus - Калькулятор миксов'
export const size = {
  width: 1200,
  height: 600,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0a0a1a 0%, #12122a 40%, #1a1a3a 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            right: -100,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            background: 'rgba(99, 102, 241, 0.15)',
            borderRadius: 100,
            marginBottom: 24,
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <span style={{ fontSize: 14, color: '#a5b4fc' }}>B2B платформа для кальянных</span>
        </div>

        {/* Logo + Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 16,
          }}
        >
          {/* Torus Logo */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 50px rgba(99, 102, 241, 0.4)',
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C12 2 9 5 9 8C9 10 10.5 11 12 11C13.5 11 15 10 15 8C15 5 12 2 12 2Z"
                fill="white"
                opacity="0.9"
              />
              <ellipse cx="12" cy="15" rx="7" ry="3" stroke="white" strokeWidth="2" fill="none" opacity="0.7" />
              <ellipse cx="12" cy="19" rx="5" ry="2" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
            </svg>
          </div>

          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.03em',
            }}
          >
            Hookah Torus
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: '#94a3b8',
            marginBottom: 40,
            textAlign: 'center',
          }}
        >
          Управляйте кальянной как профи
        </div>

        {/* Features row */}
        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          {/* Feature 1: Mix Calculator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 9 5 9 8C9 10 10.5 11 12 11C13.5 11 15 10 15 8C15 5 12 2 12 2Z" fill="#ec4899" />
              <ellipse cx="12" cy="15" rx="6" ry="2.5" stroke="#ec4899" strokeWidth="2" fill="none" />
            </svg>
            <span style={{ fontSize: 16, color: '#e2e8f0', fontWeight: 500 }}>Миксы</span>
          </div>

          {/* Feature 2: Inventory */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#f59e0b" strokeWidth="2" />
              <path d="M3 9H21" stroke="#f59e0b" strokeWidth="2" />
            </svg>
            <span style={{ fontSize: 16, color: '#e2e8f0', fontWeight: 500 }}>Инвентарь</span>
          </div>

          {/* Feature 3: Analytics */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 20L9 14L13 18L21 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 10H21V14" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 16, color: '#e2e8f0', fontWeight: 500 }}>Аналитика</span>
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            fontSize: 16,
            color: '#64748b',
          }}
        >
          hookah-torus.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
