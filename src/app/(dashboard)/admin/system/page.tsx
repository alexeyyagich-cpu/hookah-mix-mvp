'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AccessDenied } from '@/components/ui/AccessDenied'
import Link from 'next/link'

interface BackupInfo {
  name: string
  created_at: string
}

interface HealthStatus {
  api: 'ok' | 'error'
  latency: number
}

export default function AdminSystem() {
  const { isSuperAdmin, user } = useAuth()
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggerResult, setTriggerResult] = useState<string | null>(null)
  const [triggering, setTriggering] = useState(false)

  const fetchSystemInfo = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      // Health check
      const start = Date.now()
      const healthRes = await fetch('/api/health')
      const latency = Date.now() - start
      setHealth({
        api: healthRes.ok ? 'ok' : 'error',
        latency,
      })

      // Backups list from Supabase Storage
      const supabase = createClient()
      const { data: files } = await supabase.storage.from('backups').list('', {
        sortBy: { column: 'created_at', order: 'desc' },
        limit: 10,
      })

      if (files) {
        setBackups(files.map(f => ({
          name: f.name,
          created_at: f.created_at || '',
        })))
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchSystemInfo() }, [fetchSystemInfo])

  const triggerBackup = useCallback(async () => {
    setTriggering(true)
    setTriggerResult(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No session')

      // We need CRON_SECRET for this - it's server-side only
      // Use an admin API endpoint instead
      setTriggerResult('Backup runs automatically at 3:00 AM UTC daily. Manual trigger requires CRON_SECRET.')
    } catch (err) {
      setTriggerResult(`Error: ${err}`)
    } finally {
      setTriggering(false)
    }
  }, [])

  if (!isSuperAdmin) {
    return <AccessDenied />
  }

  return (
    <ErrorBoundary sectionName="Admin System">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>System</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>Backups, health & monitoring</p>
          </div>
          <Link href="/admin" className="text-sm" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
        </div>

        {/* Health Check */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Health</h2>
          {loading ? (
            <div className="h-16 skeleton rounded-lg" />
          ) : health ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: health.api === 'ok' ? 'var(--color-success)' : 'var(--color-danger)' }}
                />
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                  API: {health.api.toUpperCase()}
                </span>
              </div>
              <span className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
                Latency: {health.latency}ms
              </span>
            </div>
          ) : (
            <p style={{ color: 'var(--color-danger)' }}>Could not check health</p>
          )}
        </div>

        {/* Backups */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Backups
            </h2>
            <button
              onClick={triggerBackup}
              disabled={triggering}
              className="text-sm px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {triggering ? '...' : 'Info'}
            </button>
          </div>

          {triggerResult && (
            <div className="p-3 rounded-lg mb-4 text-sm" style={{ background: 'var(--color-bgHover)', color: 'var(--color-textMuted)' }}>
              {triggerResult}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 skeleton rounded-lg" />
              ))}
            </div>
          ) : backups.length === 0 ? (
            <p style={{ color: 'var(--color-textMuted)' }}>No backups found. Ensure the &apos;backups&apos; bucket exists in Supabase Storage.</p>
          ) : (
            <div className="space-y-2">
              {backups.map(b => (
                <div key={b.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-bgHover)' }}>
                  <div>
                    <p className="font-mono text-sm" style={{ color: 'var(--color-text)' }}>{b.name}</p>
                    {b.created_at && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-textMuted)' }}>
                        {new Date(b.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-success)' }}>✓</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs mt-4" style={{ color: 'var(--color-textMuted)' }}>
            Automated daily at 3:00 AM UTC · Retention: 30 days
          </p>
        </div>

        {/* Cron Jobs */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Cron Jobs</h2>
          <div className="space-y-2">
            <CronItem path="/api/cron/backup" schedule="0 3 * * *" description="Daily database backup" />
            <CronItem path="/api/cron/low-stock" schedule="0 9 * * *" description="Low stock push notifications" />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

function CronItem({ path, schedule, description }: { path: string; schedule: string; description: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-bgHover)' }}>
      <div>
        <p className="font-mono text-sm" style={{ color: 'var(--color-text)' }}>{path}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-textMuted)' }}>{description}</p>
      </div>
      <span className="font-mono text-xs" style={{ color: 'var(--color-textMuted)' }}>{schedule}</span>
    </div>
  )
}
