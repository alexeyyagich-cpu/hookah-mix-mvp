'use client'

import { useTranslation } from '@/lib/i18n'

// Cart item type
export interface CartItem {
  name: string
  type: 'bar' | 'hookah'
  quantity: number
  details: string | null
}

interface CartOverlayProps {
  cart: CartItem[]
  onClose: () => void
  onRemoveItem: (index: number) => void
  onSubmit: () => void
  submitting: boolean
  guestName: string
  onGuestNameChange: (name: string) => void
  orderNotes: string
  onOrderNotesChange: (notes: string) => void
  orderError: string | null
}

export function CartOverlay({
  cart,
  onClose,
  onRemoveItem,
  onSubmit,
  submitting,
  guestName,
  onGuestNameChange,
  orderNotes,
  onOrderNotesChange,
  orderError,
}: CartOverlayProps) {
  const t = useTranslation('hookah')

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[var(--color-bgCard)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">{t.cartSummary}</h3>

          {/* Cart items */}
          <div className="space-y-3 mb-6">
            {cart.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-[var(--color-textMuted)]">
                    {item.type === 'hookah' ? t.hookahRequest : ''}{item.details ? ` \u2014 ${item.details}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{'\u00D7'}{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(i)}
                    className="text-[var(--color-error)] hover:brightness-110 text-sm"
                  >
                    {t.removeFromCart}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Guest name */}
          <div className="mb-4">
            <label className="block text-sm text-[var(--color-textMuted)] mb-1">{t.guestNameLabel}</label>
            <input
              type="text"
              value={guestName}
              onChange={e => onGuestNameChange(e.target.value)}
              placeholder={t.guestNamePlaceholder}
              className="input w-full"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm text-[var(--color-textMuted)] mb-1">{t.orderNotesLabel}</label>
            <textarea
              value={orderNotes}
              onChange={e => onOrderNotesChange(e.target.value)}
              className="input w-full min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          {orderError && (
            <div role="alert" className="mb-4 p-3 rounded-xl bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">{orderError}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
            >
              {t.backToMenu}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || cart.length === 0}
              className="btn btn-primary flex-1 disabled:opacity-50"
            >
              {submitting ? t.orderSending : t.orderConfirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
