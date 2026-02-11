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
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            opacity: 0.1,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '5%',
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '10%',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          {/* Torus icon */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
              boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
            }}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: 'white' }}
            >
              <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="12" cy="12" r="3" fill="white" />
            </svg>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.02em',
              }}
            >
              Hookah Torus
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#a5b4fc',
            marginBottom: 50,
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Калькулятор миксов и управление кальянной
        </div>

        {/* Features row */}
        <div
          style={{
            display: 'flex',
            gap: 40,
          }}
        >
          {[
            { icon: '🎯', label: 'AI Рекомендации' },
            { icon: '📊', label: 'Аналитика' },
            { icon: '📦', label: 'Инвентарь' },
            { icon: '👥', label: 'Гости' },
          ].map((feature, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 30px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span style={{ fontSize: 36, marginBottom: 8 }}>{feature.icon}</span>
              <span style={{ fontSize: 18, color: '#e2e8f0' }}>{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 20,
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
