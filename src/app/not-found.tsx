import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-8xl font-bold text-[var(--color-primary)]">404</div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Страница не найдена</h1>
          <p className="text-[var(--color-textMuted)]">
            Такой страницы не существует или она была удалена.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn btn-primary px-6 py-3">
            На главную
          </Link>
          <Link href="/dashboard" className="btn btn-secondary px-6 py-3">
            В личный кабинет
          </Link>
        </div>
      </div>
    </div>
  )
}
