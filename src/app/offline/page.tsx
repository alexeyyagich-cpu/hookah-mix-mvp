'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0A0A0F', color: '#e5e5e5' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-8xl font-bold" style={{ color: '#F59E0B' }}>!</div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Нет подключения к интернету</h1>
          <p style={{ color: '#888' }}>
            Проверьте подключение и попробуйте позже.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: '#F59E0B', color: '#0A0A0F' }}
          >
            Попробовать снова
          </button>
          <a
            href="/dashboard"
            className="px-6 py-3 rounded-xl font-semibold text-sm border text-center"
            style={{ borderColor: '#333', color: '#e5e5e5' }}
          >
            В личный кабинет
          </a>
        </div>
      </div>
    </div>
  )
}
