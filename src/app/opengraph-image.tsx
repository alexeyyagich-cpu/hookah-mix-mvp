import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Hookah Torus - Калькулятор миксов и управление кальянной'
export const size = {
  width: 1200,
  height: 630,
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
        {/* Animated smoke-like background elements */}
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
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '20%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
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
            marginBottom: 30,
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <span style={{ fontSize: 16, color: '#a5b4fc' }}>B2B платформа для кальянных</span>
        </div>

        {/* Logo + Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 20,
          }}
        >
          {/* Torus Logo - Smoke rings */}
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 50px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            {/* Smoke icon SVG */}
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C12 2 9 5 9 8C9 10 10.5 11 12 11C13.5 11 15 10 15 8C15 5 12 2 12 2Z"
                fill="white"
                opacity="0.9"
              />
              <ellipse cx="12" cy="15" rx="7" ry="3" stroke="white" strokeWidth="2" fill="none" opacity="0.7" />
              <ellipse cx="12" cy="19" rx="5" ry="2" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
              <ellipse cx="12" cy="22" rx="3" ry="1" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              Hookah Torus
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            marginBottom: 50,
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Управляйте кальянной как профи
        </div>

        {/* Features grid */}
        <div
          style={{
            display: 'flex',
            gap: 20,
          }}
        >
          {/* Feature 1: Mix Calculator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 24px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 9 5 9 8C9 10 10.5 11 12 11C13.5 11 15 10 15 8C15 5 12 2 12 2Z" fill="#ec4899" />
              <ellipse cx="12" cy="15" rx="6" ry="2.5" stroke="#ec4899" strokeWidth="2" fill="none" />
              <ellipse cx="12" cy="19" rx="4" ry="1.5" stroke="#ec4899" strokeWidth="1.5" fill="none" opacity="0.6" />
            </svg>
            <span style={{ fontSize: 18, color: '#e2e8f0', fontWeight: 500 }}>Миксы</span>
          </div>

          {/* Feature 2: Inventory */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 24px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#f59e0b" strokeWidth="2" />
              <path d="M3 9H21" stroke="#f59e0b" strokeWidth="2" />
              <path d="M9 9V19" stroke="#f59e0b" strokeWidth="2" opacity="0.5" />
            </svg>
            <span style={{ fontSize: 18, color: '#e2e8f0', fontWeight: 500 }}>Инвентарь</span>
          </div>

          {/* Feature 3: Analytics */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 24px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 20L9 14L13 18L21 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 10H21V14" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 18, color: '#e2e8f0', fontWeight: 500 }}>Аналитика</span>
          </div>

          {/* Feature 4: Guests */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 24px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="7" r="3" stroke="#6366f1" strokeWidth="2" />
              <path d="M3 19C3 15.6863 5.68629 13 9 13" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="9" r="2.5" stroke="#6366f1" strokeWidth="2" opacity="0.6" />
              <path d="M13 19C13 16.2386 14.7909 14 17 14" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </svg>
            <span style={{ fontSize: 18, color: '#e2e8f0', fontWeight: 500 }}>Гости</span>
          </div>
        </div>

        {/* Bottom stats */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>-30%</span>
            <span style={{ fontSize: 14, color: '#64748b' }}>расхода табака</span>
          </div>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>2x</span>
            <span style={{ fontSize: 14, color: '#64748b' }}>быстрее обслуживание</span>
          </div>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ fontSize: 16, color: '#64748b' }}>hookah-torus.com</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
