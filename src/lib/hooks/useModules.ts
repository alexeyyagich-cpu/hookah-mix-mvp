'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import type { AppModule } from '@/types/database'

interface UseModulesReturn {
  modules: AppModule[]
  hasModule: (module: AppModule) => boolean
  isHookahActive: boolean
  isBarActive: boolean
  isKitchenActive: boolean
  toggleModule: (module: AppModule) => Promise<boolean>
  canActivateBar: boolean
  loading: boolean
}

export function useModules(): UseModulesReturn {
  const { user, profile, isDemoMode } = useAuth()
  const { limits } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [demoModules, setDemoModules] = useState<AppModule[]>(['hookah'])
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  const modules: AppModule[] = isDemoMode
    ? demoModules
    : (profile?.active_modules || ['hookah'])

  const hasModule = useCallback((module: AppModule) => modules.includes(module), [modules])

  const canActivateBar = limits.bar_module

  const toggleModule = useCallback(async (module: AppModule): Promise<boolean> => {
    if (!user) return false

    // Hookah is always on
    if (module === 'hookah') return false

    // Check subscription for bar
    if (module === 'bar' && !canActivateBar) return false

    const newModules = modules.includes(module)
      ? modules.filter(m => m !== module)
      : [...modules, module]

    // Demo mode: update local state
    if (isDemoMode || !supabase) {
      setDemoModules(newModules)
      return true
    }

    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ active_modules: newModules })
      .eq('id', user.id)

    setLoading(false)

    if (error) return false

    // Profile will re-fetch via AuthContext
    return true
  }, [user, modules, isDemoMode, supabase, canActivateBar])

  return {
    modules,
    hasModule,
    isHookahActive: hasModule('hookah'),
    isBarActive: hasModule('bar'),
    isKitchenActive: hasModule('kitchen'),
    toggleModule,
    canActivateBar,
    loading,
  }
}
