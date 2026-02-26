'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { IconLock } from '@/components/Icons'

export function AccessDenied() {
  const t = useTranslation('common')
  const router = useRouter()

  return (
    <div className="card p-8 sm:p-12 text-center animate-fadeInUp">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-danger)]/10 flex items-center justify-center text-[var(--color-danger)]">
        <IconLock size={32} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{t.accessDenied.title}</h3>
      <p className="text-[var(--color-textMuted)] text-sm mb-6 max-w-md mx-auto">
        {t.accessDenied.description}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary"
        >
          {t.accessDenied.goBack}
        </button>
        <Link href="/dashboard" className="btn btn-primary">
          {t.accessDenied.goDashboard}
        </Link>
      </div>
    </div>
  )
}
