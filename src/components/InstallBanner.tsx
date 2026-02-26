'use client'

import { useState, useEffect } from 'react'
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt'
import { useTranslation } from '@/lib/i18n'
import { IconClose } from '@/components/Icons'

const DISMISSED_KEY = 'pwa-install-dismissed'

export function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt()
  const tc = useTranslation('common')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (canInstall && localStorage.getItem(DISMISSED_KEY) !== 'true') {
        setVisible(true)
      }
    } catch { /* Safari private browsing */ }
  }, [canInstall])

  if (!visible) return null

  const handleDismiss = () => {
    setVisible(false)
    try { localStorage.setItem(DISMISSED_KEY, 'true') } catch { /* Safari private browsing */ }
    dismiss()
  }

  const handleInstall = async () => {
    await install()
    setVisible(false)
  }

  return (
    <div className="mx-4 mt-4 lg:mx-0 p-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)]/20 to-purple-500/20 border border-[var(--color-primary)]/30 flex items-center gap-3 animate-fadeInUp">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{tc.installApp}</div>
        <div className="text-xs text-[var(--color-textMuted)]">
          {tc.installAppDesc}
        </div>
      </div>
      <button type="button" onClick={handleInstall} className="btn btn-primary text-sm px-4 py-2 flex-shrink-0">
        {tc.install}
      </button>
      <button type="button" onClick={handleDismiss} className="p-1.5 rounded-lg hover:bg-[var(--color-bgHover)] text-[var(--color-textMuted)] flex-shrink-0" aria-label={tc.close}>
        <IconClose size={16} />
      </button>
    </div>
  )
}
