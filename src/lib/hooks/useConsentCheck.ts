'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { checkAllConsents } from '@/lib/consent'

export function useConsentCheck() {
  const { user } = useAuth()
  const [needsReconsent, setNeedsReconsent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    checkAllConsents().then(({ terms, privacy }) => {
      setNeedsReconsent(!terms || !privacy)
      setLoading(false)
    })
  }, [user])

  return { needsReconsent, setNeedsReconsent, loading }
}
