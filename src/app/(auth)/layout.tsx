import Link from 'next/link'
import { IconSmoke } from '@/components/Icons'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <IconSmoke size={18} color="var(--color-bg)" />
            </div>
            Hookah Mix
          </Link>
          <Link href="/mix" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
            Калькулятор миксов
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-[var(--color-textMuted)]">
        <p>Hookah Mix — сервис для кальянных заведений</p>
      </footer>
    </div>
  )
}
