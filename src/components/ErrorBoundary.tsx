'use client'

import React from 'react'
import { getCachedDictionary } from '@/lib/i18n/dictionaries'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  sectionName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `ErrorBoundary [${this.props.sectionName || 'unknown'}] at ${new Date().toISOString()}:`,
      error.message,
      errorInfo.componentStack?.slice(0, 200)
    )
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      const dict = getCachedDictionary()
      const tc = dict ? dict.common : { errorGeneric: 'Something went wrong', retry: 'Try again' }
      return (
        <div className="card p-6 text-center">
          <div className="text-[var(--color-textMuted)] mb-2">
            {this.props.sectionName ? `${this.props.sectionName} — ` : ''}{tc.errorGeneric}
          </div>
          <button type="button"
            className="text-sm text-[var(--color-primary)] hover:underline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            {tc.retry}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
