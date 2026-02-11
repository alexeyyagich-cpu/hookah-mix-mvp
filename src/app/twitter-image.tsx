import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'

export const alt = 'Hookah Torus - Калькулятор миксов'
export const size = {
  width: 1200,
  height: 600,
}
export const contentType = 'image/png'

export default async function Image() {
  // Read the torus logo from public folder
  const torusLogoBuffer = await readFile(
    join(process.cwd(), 'public/images/torus-logo.png')
  )
  const torusLogoBase64 = `data:image/png;base64,${torusLogoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#08080f',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at 25% 50%, rgba(99, 102, 241, 0.06) 0%, transparent 50%)',
          }}
        />

        {/* Left side - Torus Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 400,
            height: 400,
            marginRight: 20,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={torusLogoBase64}
            alt="Torus"
            width={380}
            height={380}
            style={{
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Right side - Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            maxWidth: 550,
            paddingRight: 40,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 14px',
              background: 'rgba(99, 102, 241, 0.15)',
              borderRadius: 100,
              marginBottom: 20,
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            <span style={{ fontSize: 13, color: '#a5b4fc' }}>B2B платформа для кальянных</span>
          </div>

          {/* Title */}
          <span
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: 14,
            }}
          >
            Hookah Torus
          </span>

          {/* Tagline */}
          <span
            style={{
              fontSize: 20,
              color: '#94a3b8',
              marginBottom: 28,
            }}
          >
            Управляйте кальянной как профи
          </span>

          {/* Features row */}
          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            {/* Feature 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C12 2 9 5 9 8C9 10 10.5 11 12 11C13.5 11 15 10 15 8C15 5 12 2 12 2Z" fill="#ec4899" />
                <ellipse cx="12" cy="15" rx="6" ry="2.5" stroke="#ec4899" strokeWidth="2" fill="none" />
              </svg>
              <span style={{ fontSize: 12, color: '#e2e8f0' }}>Миксы</span>
            </div>

            {/* Feature 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#f59e0b" strokeWidth="2" />
                <path d="M3 9H21" stroke="#f59e0b" strokeWidth="2" />
              </svg>
              <span style={{ fontSize: 12, color: '#e2e8f0' }}>Инвентарь</span>
            </div>

            {/* Feature 3 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 20L9 14L13 18L21 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 12, color: '#e2e8f0' }}>Аналитика</span>
            </div>
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            right: 28,
            fontSize: 14,
            color: '#4b5563',
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
