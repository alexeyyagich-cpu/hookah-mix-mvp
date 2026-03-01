'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { QRCodeCanvas as QRCodeCanvasType, QRCodeSVG as QRCodeSVGType } from 'qrcode.react'

const QRCodeCanvas = dynamic(
  () => import('qrcode.react').then(m => ({ default: m.QRCodeCanvas })),
  { ssr: false }
)

const QRCodeSVG = dynamic(
  () => import('qrcode.react').then(m => ({ default: m.QRCodeSVG })),
  { ssr: false }
)

export type LazyQRCodeProps = ComponentProps<typeof QRCodeCanvasType>
export type LazyQRCodeSVGProps = ComponentProps<typeof QRCodeSVGType>

export { QRCodeCanvas as LazyQRCode, QRCodeSVG as LazyQRCodeSVG }
