'use client'

import { use, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'
import type { StaffProfile } from '@/types/database'

const PRESET_AMOUNTS = [5, 10, 15, 20]

export default function TipPageClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const t = useTranslation('tip')
  const { locale } = useLocale()
  const [staff, setStaff] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number>(5)
  const [customAmount, setCustomAmount] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [payerName, setPayerName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchStaff = async () => {
      if (!isSupabaseConfigured) {
        setError(t.serviceNotConfigured)
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('staff_profiles')
        .select('id, profile_id, org_member_id, display_name, photo_url, tip_slug, is_tip_enabled, created_at, updated_at')
        .eq('tip_slug', slug)
        .eq('is_tip_enabled', true)
        .single()

      if (fetchError || !data) {
        setError('not_found')
      } else {
        setStaff(data)
      }
      setLoading(false)
    }

    fetchStaff()
  }, [slug, t.serviceNotConfigured])

  const finalAmount = useCustom ? parseFloat(customAmount) || 0 : selectedAmount

  const handleSubmit = async () => {
    if (finalAmount <= 0 || finalAmount > 500 || !staff) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/tip/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffProfileId: staff.id,
          amount: finalAmount,
          currency: 'EUR',
          payerName: payerName.trim() || null,
          message: message.trim() || null,
          slug,
        }),
      })

      const data = await res.json()

      if (data.url && typeof data.url === 'string' && data.url.startsWith('https://')) {
        window.location.href = data.url
      } else if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || t.paymentFailed)
      }
    } catch {
      setError(t.connectionError)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error === 'not_found' || !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-white mb-2">{t.staffNotFound}</h1>
          <p className="text-gray-400">{t.staffNotFoundDesc}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">{t.thankYou}</h1>
          <p className="text-gray-400">{t.tipReceived(finalAmount, staff.display_name)}</p>
        </div>
      </div>
    )
  }

  if (error && error !== 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-2">{t.error}</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Staff info */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl font-bold text-white mb-3">
            {(staff.display_name?.[0] || '?').toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-white">{staff.display_name}</h1>
          <p className="text-gray-400 text-sm mt-1">{t.leaveTip}</p>
        </div>

        {/* Amount selection */}
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 p-5 mb-4">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => { setSelectedAmount(amount); setUseCustom(false) }}
                className={`py-3 rounded-xl text-lg font-bold transition-all ${
                  !useCustom && selectedAmount === amount
                    ? 'bg-amber-400 text-gray-900 shadow-lg shadow-amber-400/30'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {formatCurrency(amount, locale)}
              </button>
            ))}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`w-full text-left text-sm mb-2 ${useCustom ? 'text-amber-400' : 'text-gray-400'}`}
            >
              {t.customAmount}
            </button>
            {useCustom && (
              <input
                type="number"
                inputMode="decimal"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0"
                min="1"
                max="500"
                step="1"
                autoFocus
                aria-label={t.customAmount}
                className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-lg font-bold focus:border-amber-400 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Optional fields */}
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 p-5 mb-4 space-y-3">
          <input
            type="text"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder={t.namePlaceholder}
            aria-label={t.namePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:border-amber-400 focus:outline-none placeholder-gray-500"
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.messagePlaceholder}
            aria-label={t.messagePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:border-amber-400 focus:outline-none placeholder-gray-500"
          />
        </div>

        {/* Pay button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || finalAmount <= 0}
          className="w-full py-4 rounded-2xl text-lg font-bold transition-all disabled:opacity-50 bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 hover:shadow-lg hover:shadow-amber-400/30"
        >
          {submitting ? t.processing : `${t.tipBtn} ${finalAmount > 0 ? formatCurrency(finalAmount, locale) : ''}`}
        </button>

        {/* Powered by */}
        <p className="text-center text-xs text-gray-600 mt-4">
          {t.poweredBy}
        </p>
      </div>
    </div>
  )
}
