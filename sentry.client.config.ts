import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',

  // Sample 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Sample 100% of sessions for crash-free rate
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Filter noisy errors
  ignoreErrors: [
    'ResizeObserver loop',
    'Network request failed',
    'Load failed',
    'Failed to fetch',
    'AbortError',
    'ChunkLoadError',
  ],
})
