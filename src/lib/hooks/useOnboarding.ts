'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { OnboardingStep } from '@/types/database'

export type { OnboardingStep }

const STEPS_ORDER: OnboardingStep[] = ['welcome', 'business', 'bowl', 'tobacco', 'complete']

interface OnboardingState {
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  isComplete: boolean
  skipped: boolean
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
  shouldShowOnboarding: boolean
}

const DEFAULT_STATE: OnboardingState = {
  currentStep: 'welcome',
  completedSteps: [],
  isComplete: false,
  skipped: false,
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
      // Demo mode - show onboarding as not completed for demo purposes
      setState({
        ...DEFAULT_STATE,
        isComplete: true, // Skip onboarding in demo mode
      })
      setLoading(false)
      return
    }

    // Check if profile has onboarding data
    const loadOnboardingState = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_skipped, onboarding_step')
          .eq('id', user.id)
          .single()

        if (data) {
          setState({
            currentStep: (data.onboarding_step as OnboardingStep) || 'welcome',
            completedSteps: [],
            isComplete: data.onboarding_completed || false,
            skipped: data.onboarding_skipped || false,
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

  const saveState = useCallback(async (updates: Partial<{
    onboarding_step: string
    onboarding_completed: boolean
    onboarding_skipped: boolean
  }>) => {
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
    await refreshProfile()
  }, [saveState, refreshProfile])

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
    await refreshProfile()
  }, [saveState, refreshProfile])

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
    shouldShowOnboarding,
  }
}
