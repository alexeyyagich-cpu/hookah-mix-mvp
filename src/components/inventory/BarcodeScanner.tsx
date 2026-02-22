'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'
import { findTobaccoByBarcode, TobaccoBarcode } from '@/lib/data/tobaccoBarcodes'
import { IconClose, IconScan } from '@/components/Icons'

interface BarcodeScannerProps {
  onScan: (tobacco: TobaccoBarcode) => void
  onManualEntry: () => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onManualEntry, onClose }: BarcodeScannerProps) {
  const t = useTranslation('hookah')
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const onScanRef = useRef(onScan)
  const lastScannedRef = useRef<string | null>(null)

  useEffect(() => { onScanRef.current = onScan })

  useEffect(() => {
    let mounted = true

    const startScanner = async () => {
      if (!containerRef.current) return

      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode('barcode-scanner')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 100 },
            aspectRatio: 1.777,
          },
          (decodedText: string) => {
            if (!mounted) return

            // Avoid duplicate scans
            if (decodedText === lastScannedRef.current) return
            lastScannedRef.current = decodedText

            // Look up in database
            const tobacco = findTobaccoByBarcode(decodedText)

            if (tobacco) {
              // Found! Stop scanning and return result
              scanner.stop().then(() => {
                onScanRef.current(tobacco)
              }).catch(console.error)
            } else {
              // Not found in database
              setNotFound(true)
              setTimeout(() => setNotFound(false), 2000)
            }
          },
          () => {
            // Ignore scan errors (happens when no barcode is visible)
          }
        )

        if (mounted) {
          setError(null)
        }
      } catch (err) {
        console.error('Scanner error:', err)
        if (mounted) {
          if (err instanceof Error && err.message.includes('Permission')) {
            setError(t.cameraNoAccess)
          } else {
            setError(t.scannerError)
          }
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      const scanner = scannerRef.current
      scannerRef.current = null
      if (scanner) {
        scanner.stop().then(() => scanner.clear()).catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = () => {
    const scanner = scannerRef.current
    if (scanner) {
      scanner.stop().catch(() => {})
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <h2 className="text-lg font-semibold">{t.scanBarcode}</h2>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <IconClose size={20} />
        </button>
      </div>

      {/* Scanner viewport */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {error ? (
            <div className="bg-[var(--color-danger)]/20 border border-[var(--color-danger)]/50 rounded-xl p-6 text-center text-white">
              <p className="mb-4">{error}</p>
              <button
                onClick={onManualEntry}
                className="btn btn-primary"
              >
                {t.enterManually}
              </button>
            </div>
          ) : (
            <>
              <div
                id="barcode-scanner"
                ref={containerRef}
                className="rounded-xl overflow-hidden bg-black"
                style={{ minHeight: '300px' }}
              />

              {/* Scan overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Scan line animation */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 border-2 border-[var(--color-primary)] rounded-lg">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-[var(--color-primary)] animate-scan" />
                </div>
              </div>

              {/* Not found message */}
              {notFound && (
                <div className="absolute inset-x-0 bottom-4 text-center">
                  <span className="px-4 py-2 rounded-full bg-[var(--color-warning)] text-white text-sm">
                    {t.barcodeNotFound}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 space-y-3">
        <p className="text-center text-white/70 text-sm">
          {t.scanInstruction}
        </p>
        <button
          onClick={onManualEntry}
          className="w-full btn btn-ghost text-white border-white/30"
        >
          {t.enterManually}
        </button>
      </div>

      {/* CSS for scan animation */}
      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(90px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Button component to open scanner
interface ScanButtonProps {
  onScanResult: (tobacco: TobaccoBarcode) => void
  onManualAdd: () => void
}

export function ScanButton({ onScanResult, onManualAdd }: ScanButtonProps) {
  const t = useTranslation('hookah')
  const [showScanner, setShowScanner] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowScanner(true)}
        className="btn btn-ghost flex items-center gap-2"
        title={t.scanBarcode}
      >
        <IconScan size={18} />
        <span className="hidden sm:inline">{t.scanButton}</span>
      </button>

      {showScanner && (
        <BarcodeScanner
          onScan={(tobacco) => {
            setShowScanner(false)
            onScanResult(tobacco)
          }}
          onManualEntry={() => {
            setShowScanner(false)
            onManualAdd()
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  )
}
