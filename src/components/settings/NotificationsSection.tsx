'use client'

import { useAuth } from '@/lib/AuthContext'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'
import { useEmailSettings } from '@/lib/hooks/useEmailSettings'
import { useTranslation } from '@/lib/i18n'
import { LOW_STOCK_THRESHOLD } from '@/lib/constants'

export default function NotificationsSection() {
  const { user } = useAuth()
  const ts = useTranslation('settings')
  const tc = useTranslation('common')

  const { settings: notificationSettings, updateSettings: updateNotificationSettings } = useNotificationSettings()
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    loading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotifications()
  const {
    settings: emailSettings,
    loading: emailLoading,
    isConfigured: emailConfigured,
    updateSettings: updateEmailSettings,
  } = useEmailSettings()

  return (
    <>
      {/* Notification Settings */}
      <div id="notifications" className="card p-6 space-y-5 scroll-mt-4">
        <h2 className="text-lg font-semibold">{ts.notifications}</h2>

        <div className="space-y-4">
          {/* Low Stock Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{ts.lowStockNotifications}</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                {ts.lowStockDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateNotificationSettings({
                low_stock_enabled: !notificationSettings?.low_stock_enabled
              })}
              aria-label={ts.lowStockNotifications}
              aria-pressed={!!notificationSettings?.low_stock_enabled}
              className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
                notificationSettings?.low_stock_enabled
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[var(--color-border)]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notificationSettings?.low_stock_enabled ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Threshold Slider */}
          <div className={notificationSettings?.low_stock_enabled ? '' : 'opacity-50 pointer-events-none'}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">{ts.warningThreshold}</label>
              <span className="text-sm font-bold text-[var(--color-primary)]">
                {notificationSettings?.low_stock_threshold || LOW_STOCK_THRESHOLD}{tc.grams}
              </span>
            </div>
            <input
              type="range"
              aria-label={ts.warningThreshold}
              min={10}
              max={200}
              step={10}
              value={notificationSettings?.low_stock_threshold || LOW_STOCK_THRESHOLD}
              onChange={(e) => updateNotificationSettings({
                low_stock_threshold: parseInt(e.target.value)
              })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--color-textMuted)] mt-1">
              <span>10{tc.grams}</span>
              <span>200{tc.grams}</span>
            </div>
          </div>

          {/* Push Notifications */}
          {pushSupported && (
            <>
              <hr className="border-[var(--color-border)]" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{ts.pushNotifications}</h3>
                  <p className="text-sm text-[var(--color-textMuted)]">
                    {pushPermission === 'denied'
                      ? ts.pushBlocked
                      : ts.pushDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => pushSubscribed ? unsubscribePush() : subscribePush()}
                  disabled={pushLoading || pushPermission === 'denied'}
                  aria-label={ts.pushNotifications}
                  aria-pressed={pushSubscribed}
                  className={`relative shrink-0 w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    pushSubscribed
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      pushSubscribed ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
              {pushSubscribed && (
                <p className="text-xs text-[var(--color-success)] flex items-center gap-1">
                  <span>✓</span> {ts.pushEnabled}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{ts.emailNotifications}</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.emailNotifDesc}
            </p>
          </div>
        </div>

        {emailLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !emailConfigured ? (
          <p className="text-sm text-[var(--color-textMuted)] italic">
            {ts.emailNotConfigured}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Master toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{ts.emailNotifications}</h3>
                <p className="text-sm text-[var(--color-textMuted)]">
                  {ts.emailToggleDesc(user?.email || '')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateEmailSettings({
                  email_notifications_enabled: !emailSettings?.email_notifications_enabled
                })}
                aria-label={ts.emailNotifications}
                aria-pressed={!!emailSettings?.email_notifications_enabled}
                className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
                  emailSettings?.email_notifications_enabled
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-border)]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.email_notifications_enabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Individual toggles */}
            <div className={emailSettings?.email_notifications_enabled ? 'space-y-3 pt-2' : 'space-y-3 pt-2 opacity-50 pointer-events-none'}>
              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.lowStockEmail}</span>
                <button
                  type="button"
                  onClick={() => updateEmailSettings({
                    low_stock_email: !emailSettings?.low_stock_email
                  })}
                  aria-label={ts.lowStockEmail}
                  aria-pressed={!!emailSettings?.low_stock_email}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    emailSettings?.low_stock_email ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.low_stock_email ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.orderUpdatesEmail}</span>
                <button
                  type="button"
                  onClick={() => updateEmailSettings({
                    order_updates_email: !emailSettings?.order_updates_email
                  })}
                  aria-label={ts.orderUpdatesEmail}
                  aria-pressed={!!emailSettings?.order_updates_email}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    emailSettings?.order_updates_email ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.order_updates_email ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.dailySummaryEmail}</span>
                <button
                  type="button"
                  onClick={() => updateEmailSettings({
                    daily_summary_email: !emailSettings?.daily_summary_email
                  })}
                  aria-label={ts.dailySummaryEmail}
                  aria-pressed={!!emailSettings?.daily_summary_email}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    emailSettings?.daily_summary_email ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.daily_summary_email ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
