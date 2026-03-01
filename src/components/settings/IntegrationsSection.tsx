'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useReady2Order } from '@/lib/hooks/useReady2Order'
import { useTelegram } from '@/lib/hooks/useTelegram'
import { useLocale, useTranslation } from '@/lib/i18n'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import Link from 'next/link'

export default function IntegrationsSection() {
  const { canUsePOS } = useSubscription()
  const {
    connection: r2oConnection,
    loading: r2oLoading,
    error: r2oError,
    syncing: r2oSyncing,
    syncResult: r2oSyncResult,
    connect: r2oConnect,
    disconnect: r2oDisconnect,
    sync: r2oSync,
    refresh: r2oRefresh,
  } = useReady2Order()
  const {
    connection: telegramConnection,
    loading: telegramLoading,
    connectLink: telegramConnectLink,
    updateSettings: updateTelegramSettings,
    disconnect: disconnectTelegram,
  } = useTelegram()
  const { locale } = useLocale()
  const ts = useTranslation('settings')
  const tc = useTranslation('common')
  const searchParams = useSearchParams()

  const [confirmDisconnect, setConfirmDisconnect] = useState<'r2o' | 'telegram' | null>(null)

  // Handle r2o callback redirect
  useEffect(() => {
    const r2oStatus = searchParams.get('r2o')
    if (r2oStatus === 'connected') {
      r2oRefresh()
      window.history.replaceState({}, '', '/settings')
    } else if (r2oStatus === 'error') {
      window.history.replaceState({}, '', '/settings')
    }
  }, [searchParams, r2oRefresh])

  return (
    <>
      {/* POS (ready2order) — brand color #00b341 intentionally not theme-variable */}
      <div id="integrations" className="card p-6 space-y-5 scroll-mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00b341] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{ts.posTitle}</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.posDesc}
            </p>
          </div>
        </div>

        {!canUsePOS ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bgHover)]">
            <svg className="w-5 h-5 text-[var(--color-textMuted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-medium">{ts.posProOnly}</p>
              <p className="text-xs text-[var(--color-textMuted)]">
                {ts.posProUpgrade}
              </p>
            </div>
            <Link href="/pricing" className="btn btn-primary btn-sm ml-auto">
              {tc.upgrade}
            </Link>
          </div>
        ) : r2oLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : r2oConnection ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-success)]/10">
              <span className="text-[var(--color-success)]">✓</span>
              <span className="text-sm">
                {ts.posConnected}
                {r2oConnection.last_sync_at && (
                  <span className="text-[var(--color-textMuted)]">
                    {' '}· {ts.lastSync}: {new Date(r2oConnection.last_sync_at).toLocaleString(locale)}
                  </span>
                )}
              </span>
            </div>

            {r2oError && (
              <div className="p-3 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                {r2oError}
              </div>
            )}

            {r2oSyncResult && (
              <div className="p-3 rounded-xl bg-[var(--color-primary)]/10 text-sm">
                {ts.synced(r2oSyncResult.synced, r2oSyncResult.total)}
                {r2oSyncResult.errors > 0 && (
                  <span className="text-[var(--color-danger)]"> {ts.syncErrors(r2oSyncResult.errors)}</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={r2oSync}
                disabled={r2oSyncing}
                className="btn btn-primary disabled:opacity-50"
              >
                {r2oSyncing ? ts.syncing : ts.sync}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDisconnect('r2o')}
                className="text-sm text-[var(--color-danger)] hover:underline"
              >
                {ts.disconnectPos}
              </button>
            </div>

            {!r2oConnection.webhook_registered && (
              <p className="text-xs text-[var(--color-warning)]">
                {ts.webhooksNotRegistered}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.posConnectDesc}
            </p>

            {r2oError && (
              <div className="p-3 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                {r2oError}
              </div>
            )}

            <button
              type="button"
              onClick={r2oConnect}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00b341] text-white font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {ts.connectPos}
            </button>
          </div>
        )}
      </div>

      {/* Telegram Integration — brand color #0088cc intentionally not theme-variable */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0088cc] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-3.083 11.783-3.083 11.783-.145.58-.515.748-.845.748-.511 0-.753-.342-1.258-.788l-3.255-2.548-.961.926c-.144.138-.264.254-.529.254-.294 0-.345-.108-.483-.365l-1.088-3.575-3.13-.972c-.567-.164-.575-.565.152-.851l12.178-4.688c.467-.182.9.114.751.676z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{ts.telegram}</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.telegramDesc}
            </p>
          </div>
        </div>

        {telegramLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : telegramConnection ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-success)]/10">
              <span className="text-[var(--color-success)]">✓</span>
              <span className="text-sm">
                {ts.telegramConnected(telegramConnection.telegram_username || String(telegramConnection.telegram_user_id))}
              </span>
            </div>

            {/* Notification toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.telegramLowStock}</span>
                <button
                  type="button"
                  onClick={() => updateTelegramSettings({
                    low_stock_alerts: !telegramConnection.low_stock_alerts
                  })}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    telegramConnection.low_stock_alerts ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    telegramConnection.low_stock_alerts ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.telegramSessions}</span>
                <button
                  type="button"
                  onClick={() => updateTelegramSettings({
                    session_reminders: !telegramConnection.session_reminders
                  })}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    telegramConnection.session_reminders ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    telegramConnection.session_reminders ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.telegramDaily}</span>
                <button
                  type="button"
                  onClick={() => updateTelegramSettings({
                    daily_summary: !telegramConnection.daily_summary
                  })}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    telegramConnection.daily_summary ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    telegramConnection.daily_summary ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setConfirmDisconnect('telegram')}
              className="text-sm text-[var(--color-danger)] hover:underline"
            >
              {ts.disconnectTelegram}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.telegramConnectDesc}
            </p>

            {telegramConnectLink ? (
              <a
                href={telegramConnectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0088cc] text-white font-medium hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-3.083 11.783-3.083 11.783-.145.58-.515.748-.845.748-.511 0-.753-.342-1.258-.788l-3.255-2.548-.961.926c-.144.138-.264.254-.529.254-.294 0-.345-.108-.483-.365l-1.088-3.575-3.13-.972c-.567-.164-.575-.565.152-.851l12.178-4.688c.467-.182.9.114.751.676z"/>
                </svg>
                {ts.connectTelegram}
              </a>
            ) : (
              <p className="text-sm text-[var(--color-textMuted)] italic">
                {ts.telegramNotConfigured}
              </p>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDisconnect}
        title={confirmDisconnect === 'r2o' ? ts.disconnectPos : ts.disconnectTelegram}
        message={ts.disconnectWarning}
        danger
        onConfirm={async () => {
          if (confirmDisconnect === 'r2o') await r2oDisconnect()
          else if (confirmDisconnect === 'telegram') await disconnectTelegram()
          setConfirmDisconnect(null)
        }}
        onCancel={() => setConfirmDisconnect(null)}
      />
    </>
  )
}
