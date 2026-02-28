type LogLevel = 'info' | 'warn' | 'error'

interface LogPayload {
  message: string
  [key: string]: unknown
}

function log(level: LogLevel, payload: LogPayload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  }

  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry))
  } else {
    console.info(JSON.stringify(entry))
  }
}

export const logger = {
  info(message: string, data?: Record<string, unknown>) {
    log('info', { message, ...data })
  },
  warn(message: string, data?: Record<string, unknown>) {
    log('warn', { message, ...data })
  },
  error(message: string, data?: Record<string, unknown>) {
    log('error', { message, ...data })
  },
}
