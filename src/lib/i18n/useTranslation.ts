'use client'

import { useMemo } from 'react'
import { useLocale } from './context'
import type { Namespace, Dictionary } from './dictionaries'

export function useTranslation<N extends Namespace>(namespace: N): Dictionary[N] {
  const { dictionary } = useLocale()
  return useMemo(() => dictionary[namespace], [dictionary, namespace])
}
