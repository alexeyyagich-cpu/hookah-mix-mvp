'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { usePublicReservation } from '@/lib/hooks/useReservations'
import { IconCalendar } from '@/components/Icons'

export function ReservationForm({ profileId }: { profileId: string }) {
  const t = useTranslation('hookah')
  const { submitReservation, submitting, fetchSlots, occupiedSlots } = usePublicReservation(profileId)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
  ]

  const occupiedTimes = new Set(
    occupiedSlots.filter(s => s.date === date).map(s => s.time?.slice(0, 5))
  )
  const availableSlots = timeSlots.filter(ts => !occupiedTimes.has(ts))

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    setTime('')
    fetchSlots(newDate)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !date || !time) return

    const success = await submitReservation({
      guest_name: name.trim(),
      guest_phone: phone.trim() || undefined,
      guest_count: guestCount,
      reservation_date: date,
      reservation_time: time,
      notes: notes.trim() || undefined,
    })

    if (success) {
      setSubmitted(true)
      setName('')
      setPhone('')
      setDate('')
      setTime('')
      setGuestCount(2)
      setNotes('')
    }
  }

  if (submitted) {
    return (
      <div className="card p-6 mb-8 text-center">
        <div className="text-4xl mb-3">{'\u{1F4C5}'}</div>
        <h3 className="text-lg font-bold mb-1">{t.reservationSent}</h3>
        <p className="text-[var(--color-textMuted)] text-sm">{t.reservationAwaitConfirm}</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-[var(--color-primary)] hover:underline"
        >
          {t.reservationCreateAnother}
        </button>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-8">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <IconCalendar size={20} className="text-[var(--color-primary)]" />
        {t.reservationTitle}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.reservationDateLabel}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              min={today}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.reservationTimeLabel}</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              required
              disabled={!date}
            >
              <option value="">{t.reservationSelectTime}</option>
              {availableSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.reservationNameLabel}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.reservationNamePlaceholder}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.reservationGuestCount}</label>
            <input
              type="number"
              inputMode="numeric"
              value={guestCount}
              onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={20}
              step="1"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.reservationPhoneLabel}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.reservationPhonePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.reservationCommentLabel}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.reservationCommentPlaceholder}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !date || !time || submitting}
          className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t.reservationSubmitting : t.reservationSubmitBtn}
        </button>
      </form>
    </div>
  )
}
