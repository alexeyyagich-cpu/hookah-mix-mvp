'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { OnboardingStep, BusinessType, AppModule } from '@/types/database'

export type { OnboardingStep, BusinessType }

const STEPS_ORDER: OnboardingStep[] = ['welcome', 'business_type', 'business', 'setup', 'complete']

// Map old step values to new ones for backward compat
function normalizeStep(step: string | null): OnboardingStep {
  if (!step) return 'welcome'
  if (step === 'bowl' || step === 'tobacco') return 'setup'
  if (STEPS_ORDER.includes(step as OnboardingStep)) return step as OnboardingStep
  return 'welcome'
}

interface OnboardingState {
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  isComplete: boolean
  skipped: boolean
  businessType: BusinessType | null
}

interface UseOnboardingReturn {
  state: OnboardingState
  loading: boolean
  currentStepIndex: number
  totalSteps: number
  progress: number
  goToStep: (step: OnboardingStep) => void
  nextStep: () => void
  prevStep: () => void
  completeStep: (step: OnboardingStep) => Promise<void>
  skipOnboarding: () => Promise<void>
  finishOnboarding: () => Promise<void>
  setBusinessType: (type: BusinessType) => Promise<void>
  shouldShowOnboarding: boolean
}

const DEFAULT_STATE: OnboardingState = {
  currentStep: 'welcome',
  completedSteps: [],
  isComplete: false,
  skipped: false,
  businessType: null,
}

export function useOnboarding(): UseOnboardingReturn {
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE)
  const [loading, setLoading] = useState(true)
  const { user, profile, refreshProfile, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Load onboarding state from profile metadata
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    if (isDemoMode) {
      setState({
        ...DEFAULT_STATE,
        isComplete: true,
        businessType: 'hookah_bar',
      })
      setLoading(false)
      return
    }

    const loadOnboardingState = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_skipped, onboarding_step, business_type')
          .eq('id', user.id)
          .single()

        if (data) {
          setState({
            currentStep: normalizeStep(data.onboarding_step),
            completedSteps: [],
            isComplete: data.onboarding_completed || false,
            skipped: data.onboarding_skipped || false,
            businessType: (data.business_type as BusinessType) || null,
          })
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error)
      }
      setLoading(false)
    }

    loadOnboardingState()
  }, [user, isDemoMode, supabase])

  const currentStepIndex = STEPS_ORDER.indexOf(state.currentStep)
  const totalSteps = STEPS_ORDER.length - 1 // Exclude 'complete'
  const progress = Math.round((currentStepIndex / totalSteps) * 100)

  const saveState = useCallback(async (updates: Record<string, unknown>) => {
    if (!user || isDemoMode || !supabase) return

    try {
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
    } catch (error) {
      console.error('Failed to save onboarding state:', error)
    }
  }, [user, isDemoMode, supabase])

  const goToStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step }))
    saveState({ onboarding_step: step })
  }, [saveState])

  const nextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS_ORDER.length) {
      const nextStepName = STEPS_ORDER[nextIndex]
      setState(prev => ({
        ...prev,
        currentStep: nextStepName,
        completedSteps: [...prev.completedSteps, prev.currentStep],
      }))
      saveState({ onboarding_step: nextStepName })
    }
  }, [currentStepIndex, saveState])

  const prevStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      const prevStepName = STEPS_ORDER[prevIndex]
      setState(prev => ({ ...prev, currentStep: prevStepName }))
      saveState({ onboarding_step: prevStepName })
    }
  }, [currentStepIndex, saveState])

  const completeStep = useCallback(async (step: OnboardingStep) => {
    setState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, step],
    }))
    nextStep()
  }, [nextStep])

  const setBusinessType = useCallback(async (type: BusinessType) => {
    // Compute active modules from business type
    const moduleMap: Record<BusinessType, AppModule[]> = {
      hookah: ['hookah'],
      bar: ['bar'],
      hookah_bar: ['hookah', 'bar'],
      restaurant: ['bar'],
    }
    const activeModules = moduleMap[type]

    setState(prev => ({ ...prev, businessType: type }))
    await saveState({
      business_type: type,
      active_modules: activeModules,
    })
  }, [saveState])

  const skipOnboarding = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isComplete: true,
      skipped: true,
    }))
    await saveState({
      onboarding_completed: true,
      onboarding_skipped: true,
    })

    // Still create org even when skipping, so multi-tenant features work
    if (supabase && user && !isDemoMode) {
      try {
        const { error: rpcErr } = await supabase.rpc('setup_organization', {
          p_name: profile?.business_name || 'My Lounge',
          p_type: state.businessType || 'hookah_bar',
          p_slug: profile?.venue_slug || null,
        })
        if (rpcErr) console.error('setup_organization:', rpcErr)
      } catch (e) {
        console.error('setup_organization failed:', e)
      }
    }

    await refreshProfile()
  }, [saveState, refreshProfile, supabase, user, isDemoMode, profile, state.businessType])

  const finishOnboarding = useCallback(async () => {
    setState(prev => ({
      ...prev,
      currentStep: 'complete',
      isComplete: true,
    }))
    await saveState({
      onboarding_step: 'complete',
      onboarding_completed: true,
    })

    // Auto-create org + location + lounge via idempotent RPC
    if (supabase && user && !isDemoMode) {
      try {
        const { error: rpcErr } = await supabase.rpc('setup_organization', {
          p_name: profile?.business_name || 'My Lounge',
          p_type: state.businessType || 'hookah_bar',
          p_slug: profile?.venue_slug || null,
        })
        if (rpcErr) console.error('setup_organization:', rpcErr)
      } catch (e) {
        console.error('setup_organization failed:', e)
      }
    }

    await refreshProfile()
  }, [saveState, refreshProfile, supabase, user, isDemoMode, profile, state.businessType])

  // Should show onboarding if not completed and not skipped
  const shouldShowOnboarding = !loading && !!user && !state.isComplete && !state.skipped

  return {
    state,
    loading,
    currentStepIndex,
    totalSteps,
    progress,
    goToStep,
    nextStep,
    prevStep,
    completeStep,
    skipOnboarding,
    finishOnboarding,
    setBusinessType,
    shouldShowOnboarding,
  }
}
