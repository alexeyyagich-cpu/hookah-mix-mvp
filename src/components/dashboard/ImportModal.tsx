'use client'

import { useState, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'
import { IconClose, IconExport } from '@/components/Icons'
import { parseFile, autoMapColumns, validateImportRow } from '@/lib/utils/importParser'
import type { ParseResult, ColumnMapping, ImportRow } from '@/lib/utils/importParser'

type Step = 'upload' | 'mapping' | 'preview' | 'done'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (rows: ImportRow[]) => Promise<void>
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const t = useTranslation('hookah')
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({
    brand: '', flavor: '', quantity_grams: '', purchase_price: '', package_grams: '',
  })
  const [validRows, setValidRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleFileSelect = async (file: File) => {
    setError('')
    const result = await parseFile(file)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.rows.length === 0) {
      setError(t.importNoData)
      return
    }
    setParseResult(result)
    setMapping(autoMapColumns(result.headers))
    setStep('mapping')
  }

  const handleMappingDone = () => {
    if (!parseResult) return
    if (!mapping.brand || !mapping.flavor) {
      setError(t.importRequiredFields)
      return
    }
    const rows = parseResult.rows
      .map(row => validateImportRow(row, mapping))
      .filter((r): r is ImportRow => r !== null)

    if (rows.length === 0) {
      setError(t.importNoValidRows)
      return
    }

    setValidRows(rows)
    setError('')
    setStep('preview')
  }

  const handleImport = async () => {
    setImporting(true)
    await onImport(validRows)
    setImporting(false)
    setStep('done')
  }

  const reset = () => {
    setStep('upload')
    setParseResult(null)
    setValidRows([])
    setError('')
    setMapping({ brand: '', flavor: '', quantity_grams: '', purchase_price: '', package_grams: '' })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const columnLabels: Record<keyof ColumnMapping, string> = {
    brand: t.importColBrand,
    flavor: t.importColFlavor,
    quantity_grams: t.importColQuantity,
    purchase_price: t.importColPrice,
    package_grams: t.importColPackage,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="bg-[var(--color-bgCard)] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <IconExport size={20} />
            {t.importTitle}
          </h2>
          <button onClick={handleClose} className="btn btn-ghost p-2"><IconClose size={18} /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm">
            {(['upload', 'mapping', 'preview', 'done'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-[var(--color-primary)] text-white' :
                  (['upload', 'mapping', 'preview', 'done'].indexOf(step) > i ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-bgHover)]')
                }`}>
                  {i + 1}
                </span>
                {i < 3 && <span className="w-8 h-0.5 bg-[var(--color-border)]" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div
              className="border-2 border-dashed border-[var(--color-border)] rounded-2xl p-12 text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
              onDrop={e => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) handleFileSelect(file)
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
              <IconExport size={40} className="mx-auto mb-3 text-[var(--color-textMuted)]" />
              <p className="font-medium">{t.importDragDrop}</p>
              <p className="text-sm text-[var(--color-textMuted)] mt-1">{t.importFormats}</p>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && parseResult && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-textMuted)]">
                {t.importMapColumns} ({parseResult.rows.length} {t.importRows})
              </p>
              {(Object.keys(columnLabels) as (keyof ColumnMapping)[]).map(col => (
                <div key={col} className="flex items-center gap-3">
                  <label className="text-sm font-medium w-32">{columnLabels[col]}</label>
                  <select
                    value={mapping[col]}
                    onChange={e => setMapping(prev => ({ ...prev, [col]: e.target.value }))}
                    className="input flex-1"
                  >
                    <option value="">— {t.importSkip} —</option>
                    {parseResult.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
              <button onClick={handleMappingDone} className="btn btn-primary w-full">
                {t.importNext}
              </button>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-textMuted)]">
                {validRows.length} {t.importValidRows}
              </p>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-bgHover)] sticky top-0">
                    <tr>
                      <th className="p-2 text-left">{t.importColBrand}</th>
                      <th className="p-2 text-left">{t.importColFlavor}</th>
                      <th className="p-2 text-right">{t.importColQuantity}</th>
                      <th className="p-2 text-right">{t.importColPrice}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-t border-[var(--color-border)]">
                        <td className="p-2">{row.brand}</td>
                        <td className="p-2">{row.flavor}</td>
                        <td className="p-2 text-right">{row.quantity_grams}g</td>
                        <td className="p-2 text-right">€{row.purchase_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('mapping')} className="btn btn-ghost flex-1">
                  {t.importBack}
                </button>
                <button onClick={handleImport} disabled={importing} className="btn btn-primary flex-1">
                  {importing ? t.importImporting : t.importConfirm}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 'done' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-lg font-semibold mb-2">{t.importDone}</h3>
              <p className="text-sm text-[var(--color-textMuted)] mb-4">
                {validRows.length} {t.importItemsAdded}
              </p>
              <button onClick={handleClose} className="btn btn-primary">
                {t.importClose}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
