'use client'

import Link from 'next/link'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card p-8 sm:p-12 text-center animate-fadeInUp">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bgHover)] flex items-center justify-center text-[var(--color-textMuted)]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-[var(--color-textMuted)] text-sm mb-4 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        action.href ? (
          <Link href={action.href} className="btn btn-primary mt-2">
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className="btn btn-primary mt-2">
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
