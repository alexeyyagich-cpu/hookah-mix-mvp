'use client'

import { useState, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'
import { IconClose, IconScan } from '@/components/Icons'
import { matchTobaccoCatalog } from '@/lib/utils/invoiceExtractor'
import type { ExtractedItem, ExtractedInvoice } from '@/lib/utils/invoiceExtractor'

type Step = 'upload' | 'processing' | 'review' | 'done'

interface InvoiceScanModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (items: ExtractedItem[]) => Promise<void>
}

export function InvoiceScanModal({ isOpen, onClose, onImport }: InvoiceScanModalProps) {
  const t = useTranslation('hookah')
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [items, setItems] = useState<ExtractedItem[]>([])
  const [invoice, setInvoice] = useState<ExtractedInvoice | null>(null)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)

  if (!isOpen) return null

  const handleImage = async (file: File) => {
    setError('')
    setStep('processing')

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch('/api/ocr/extract', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || t.ocrFailed)
        setStep('upload')
        return
      }

      const data: ExtractedInvoice = await res.json()

      if (!data.items || data.items.length === 0) {
        setError(t.ocrNoItems)
        setStep('upload')
        return
      }

      // Match against catalog
      const matched = matchTobaccoCatalog(data.items)
      setItems(matched)
      setInvoice(data)
      setStep('review')
    } catch {
      setError(t.ocrFailed)
      setStep('upload')
    }
  }

  const handleImport = async () => {
    setImporting(true)
    await onImport(items)
    setImporting(false)
    setStep('done')
  }

  const updateItem = (index: number, field: keyof ExtractedItem, value: string | number) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    setStep('upload')
    setItems([])
    setInvoice(null)
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="button" tabIndex={-1} aria-label="Close" onClick={handleClose} onKeyDown={(e) => e.key === 'Escape' && handleClose()}>
      <div
        className="bg-[var(--color-bgCard)] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <IconScan size={20} />
            {t.ocrTitle}
          </h2>
          <button type="button" onClick={handleClose} className="btn btn-ghost p-2" aria-label="Close"><IconClose size={18} /></button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
              {error}
            </div>
          )}

          {/* Upload */}
          {step === 'upload' && (
            <div
              className="border-2 border-dashed border-[var(--color-border)] rounded-2xl p-12 text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleImage(file)
                }}
              />
              <IconScan size={40} className="mx-auto mb-3 text-[var(--color-textMuted)]" />
              <p className="font-medium">{t.ocrUpload}</p>
              <p className="text-sm text-[var(--color-textMuted)] mt-1">{t.ocrFormats}</p>
            </div>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-[var(--color-textMuted)]">{t.ocrProcessing}</p>
            </div>
          )}

          {/* Review */}
          {step === 'review' && (
            <div className="space-y-3">
              {invoice?.supplier && (
                <p className="text-sm text-[var(--color-textMuted)]">
                  {t.ocrSupplier}: <strong>{invoice.supplier}</strong>
                </p>
              )}
              <p className="text-sm">{items.length} {t.ocrItemsFound}</p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl flex items-center justify-between ${
                      item.matched
                        ? 'bg-[var(--color-success)]/10 border border-[var(--color-success)]/30'
                        : 'bg-[var(--color-bgHover)]'
                    }`}
                  >
                    <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                      <input
                        value={item.brand}
                        onChange={e => updateItem(i, 'brand', e.target.value)}
                        className="input text-sm"
                        placeholder={t.importColBrand}
                      />
                      <input
                        value={item.flavor}
                        onChange={e => updateItem(i, 'flavor', e.target.value)}
                        className="input text-sm"
                        placeholder={t.importColFlavor}
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        value={item.packageGrams}
                        onChange={e => updateItem(i, 'packageGrams', parseFloat(e.target.value) || 0)}
                        className="input text-sm w-20"
                        placeholder="g"
                        min="0"
                        step="1"
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        value={item.price}
                        onChange={e => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                        className="input text-sm w-20"
                        placeholder="€"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <button type="button" onClick={() => removeItem(i)} className="btn btn-ghost p-1 ml-2 text-[var(--color-danger)]" aria-label="Remove">
                      <IconClose size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep('upload')} className="btn btn-ghost flex-1">
                  {t.importBack}
                </button>
                <button type="button" onClick={handleImport} disabled={importing || items.length === 0} className="btn btn-primary flex-1">
                  {importing ? t.importImporting : t.ocrAddToInventory}
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-lg font-semibold mb-2">{t.ocrDone}</h3>
              <p className="text-sm text-[var(--color-textMuted)] mb-4">
                {items.length} {t.importItemsAdded}
              </p>
              <button type="button" onClick={handleClose} className="btn btn-primary">
                {t.importClose}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
