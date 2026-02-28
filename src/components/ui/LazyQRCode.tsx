'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { QRCodeCanvas as QRCodeCanvasType } from 'qrcode.react'

const QRCodeCanvas = dynamic(
  () => import('qrcode.react').then(m => ({ default: m.QRCodeCanvas })),
  { ssr: false }
)

export type LazyQRCodeProps = ComponentProps<typeof QRCodeCanvasType>

export { QRCodeCanvas as LazyQRCode }
