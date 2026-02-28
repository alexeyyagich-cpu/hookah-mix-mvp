'use client'

import { useRef, useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from '@/lib/i18n'

interface TipQRCodeProps {
  slug: string
  displayName: string
}

export function TipQRCode({ slug, displayName }: TipQRCodeProps) {
  const ts = useTranslation('settings')
  const svgRef = useRef<HTMLDivElement>(null)
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const url = `${origin}/tip/${slug}`

  const handleDownload = () => {
    if (!svgRef.current) return
    const svg = svgRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const link = document.createElement('a')
      link.download = `tip-qr-${slug}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={svgRef} className="p-3 bg-white rounded-xl">
        <QRCodeSVG value={url} size={160} level="M" />
      </div>
      <p className="text-sm font-medium">{displayName}</p>
      <button type="button" onClick={handleDownload} className="btn btn-ghost text-sm">
        {ts.downloadQr}
      </button>
    </div>
  )
}
