'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import { IconTimer } from '@/components/Icons'

interface SessionTimerProps {
  onDurationChange?: (minutes: number) => void
  notificationMinutes?: number
  autoStart?: boolean
  compact?: boolean
}

export function SessionTimer({
  onDurationChange,
  notificationMinutes = 45,
  autoStart = false,
  compact = false,
}: SessionTimerProps) {
  const t = useTranslation('hookah')
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [notificationSent, setNotificationSent] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const sendNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Hookah Torus', {
        body: t.sessionNotification(notificationMinutes),
        icon: '/icons/icon-192x192.png',
        tag: 'session-timer',
      })
    }
  }, [notificationMinutes])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1
          const minutes = Math.floor(newSeconds / 60)

          // Send notification at configured time
          if (!notificationSent && minutes >= notificationMinutes) {
            sendNotification()
            setNotificationSent(true)
          }

          // Report duration change
          if (onDurationChange && newSeconds % 60 === 0) {
            onDurationChange(minutes)
          }

          return newSeconds
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, notificationMinutes, notificationSent, onDurationChange, sendNotification])

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setSeconds(0)
    setNotificationSent(false)
    onDurationChange?.(0)
  }

  const handleStop = () => {
    setIsRunning(false)
    const minutes = Math.ceil(seconds / 60)
    onDurationChange?.(minutes)
    return minutes
  }

  const minutes = Math.floor(seconds / 60)
  const isWarning = minutes >= notificationMinutes - 5 && minutes < notificationMinutes
  const isOvertime = minutes >= notificationMinutes

  if (compact) {
    return (
      <button
        onClick={isRunning ? handlePause : handleStart}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
          ${isRunning ? 'animate-pulse' : ''}
        `}
        style={{
          background: isOvertime
            ? 'var(--color-danger)'
            : isWarning
            ? 'var(--color-warning)'
            : isRunning
            ? 'var(--color-success)'
            : 'var(--color-bgHover)',
          color: isRunning || isOvertime || isWarning ? 'white' : 'var(--color-text)',
        }}
      >
        <IconTimer size={16} />
        <span className="tabular-nums">{formatTime(seconds)}</span>
      </button>
    )
  }

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: isOvertime
          ? 'color-mix(in srgb, var(--color-danger) 15%, var(--color-bgCard))'
          : isWarning
          ? 'color-mix(in srgb, var(--color-warning) 15%, var(--color-bgCard))'
          : 'var(--color-bgCard)',
        border: `1px solid ${
          isOvertime
            ? 'var(--color-danger)'
            : isWarning
            ? 'var(--color-warning)'
            : 'var(--color-border)'
        }`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRunning ? 'animate-pulse' : ''}`}
            style={{
              background: isOvertime
                ? 'var(--color-danger)'
                : isWarning
                ? 'var(--color-warning)'
                : isRunning
                ? 'var(--color-success)'
                : 'var(--color-primary)',
            }}
          >
            <IconTimer size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
              {t.sessionTimerTitle}
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
              {isRunning ? t.timerRunning : seconds > 0 ? t.timerPaused : t.timerReady}
            </p>
          </div>
        </div>

        {isOvertime && (
          <span
            className="px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'var(--color-danger)', color: 'white' }}
          >
            {t.overtimeMin(minutes - notificationMinutes)}
          </span>
        )}
      </div>

      <div className="text-center mb-4">
        <div
          className="text-4xl font-bold tabular-nums"
          style={{
            color: isOvertime
              ? 'var(--color-danger)'
              : isWarning
              ? 'var(--color-warning)'
              : 'var(--color-text)',
          }}
        >
          {formatTime(seconds)}
        </div>
        {notificationMinutes && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-textMuted)' }}>
            {t.notificationIn(Math.max(0, notificationMinutes - minutes))}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex-1 py-2 rounded-xl font-medium text-sm transition-colors"
            style={{
              background: 'var(--color-success)',
              color: 'white',
            }}
          >
            {seconds > 0 ? t.timerResume : t.timerStart}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex-1 py-2 rounded-xl font-medium text-sm transition-colors"
            style={{
              background: 'var(--color-warning)',
              color: 'white',
            }}
          >
            {t.timerPause}
          </button>
        )}

        {seconds > 0 && (
          <>
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded-xl font-medium text-sm transition-colors"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-bg)',
              }}
            >
              {t.timerStop}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl transition-colors"
              style={{
                background: 'var(--color-bgHover)',
                color: 'var(--color-textMuted)',
              }}
              title={t.timerReset}
            >
              ↺
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Hook for using session timer state imperatively
export function useSessionTimer(notificationMinutes = 45) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setIsRunning(false)
    setSeconds(0)
  }, [])
  const getDurationMinutes = useCallback(() => Math.ceil(seconds / 60), [seconds])

  return {
    seconds,
    isRunning,
    minutes: Math.floor(seconds / 60),
    formatted: `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`,
    start,
    pause,
    reset,
    getDurationMinutes,
  }
}
