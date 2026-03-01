'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding, type OnboardingStep, type BusinessType } from '@/lib/hooks/useOnboarding'
import { useAuth } from '@/lib/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { IconCheck } from '@/components/Icons'
import { useTranslation } from '@/lib/i18n'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SetupStep } from './SetupStep'
import { BusinessTypeStep } from './BusinessTypeStep'

export default function OnboardingPage() {
  const t = useTranslation('hookah')
  const tc = useTranslation('common')
  const router = useRouter()

  const STEP_INFO: Record<OnboardingStep, { title: string; description: string }> = {
    welcome: { title: t.welcomeTitle, description: t.welcomeDesc },
    business_type: { title: t.businessTypeTitle, description: t.businessTypeDesc },
    business: { title: t.businessInfoTitle, description: t.businessInfoDesc },
    setup: { title: t.setupTitle, description: t.setupDesc },
    complete: { title: t.completeTitle, description: t.completeDesc },
    bowl: { title: '', description: '' },
    tobacco: { title: '', description: '' },
  }

  const BUSINESS_TYPES: { type: BusinessType; icon: string; title: string; description: string; badge?: string }[] = [
    { type: 'hookah', icon: '🔥', title: t.businessTypeHookah, description: t.businessTypeHookahDesc },
    { type: 'bar', icon: '🍸', title: t.businessTypeBar, description: t.businessTypeBarDesc },
    { type: 'hookah_bar', icon: '🔥🍸', title: t.businessTypeHookahBar, description: t.businessTypeHookahBarDesc },
    { type: 'restaurant', icon: '🍽️', title: t.businessTypeRestaurant, description: t.businessTypeRestaurantDesc, badge: tc.soon },
  ]
  const { state, loading, currentStepIndex, totalSteps, progress, nextStep, prevStep, skipOnboarding, finishOnboarding, setBusinessType } = useOnboarding()
  const { user, profile, refreshProfile } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Business step state
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')

  const [saving, setSaving] = useState(false)
  const [selectedType, setSelectedType] = useState<BusinessType | null>(state.businessType)

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '')
      setOwnerName(profile.owner_name || '')
    }
  }, [profile])

  useEffect(() => {
    if (state.businessType) setSelectedType(state.businessType)
  }, [state.businessType])

  // Redirect if onboarding is complete
  useEffect(() => {
    if (!loading && state.isComplete) {
      router.push('/dashboard')
    }
  }, [loading, state.isComplete, router])

  const needsHookah = selectedType === 'hookah' || selectedType === 'hookah_bar'
  const needsBar = selectedType === 'bar' || selectedType === 'hookah_bar' || selectedType === 'restaurant'

  const handleBusinessTypeContinue = async () => {
    if (!selectedType) return
    setSaving(true)
    await setBusinessType(selectedType)
    setSaving(false)
    nextStep()
  }

  const handleBusinessSave = async () => {
    if (!user) return
    setSaving(true)

    if (supabase) {
      await supabase
        .from('profiles')
        .update({
          business_name: businessName || null,
          owner_name: ownerName || null,
        })
        .eq('id', user.id)

      await refreshProfile()
    }
    setSaving(false)
    nextStep()
  }

  const handleSetupFinish = async () => {
    nextStep()
  }

  const handleFinish = async () => {
    await finishOnboarding()
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <ErrorBoundary sectionName="Onboarding Form">
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
      </ErrorBoundary>
    )
  }

  const currentInfo = STEP_INFO[state.currentStep]

  // Capabilities for complete step
  const capabilities: { icon: string; text: string }[] = []
  if (needsHookah) {
    capabilities.push(
      { icon: '📊', text: t.capTobaccoInventory },
      { icon: '🧮', text: t.capMixCalculator },
      { icon: '📝', text: t.capSessions },
    )
  }
  if (needsBar) {
    capabilities.push(
      { icon: '🍸', text: t.capBarManagement },
      { icon: '📋', text: t.capRecipes },
      { icon: '💰', text: t.capSales },
    )
  }
  capabilities.push(
    { icon: '🗺️', text: t.capFloorPlan },
    { icon: '👥', text: t.capTeam },
  )

  return (
    <ErrorBoundary sectionName="Onboarding">
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--color-bg)]">
      {/* Progress bar */}
      {state.currentStep !== 'complete' && (
        <div className="w-full max-w-lg mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-textMuted)]">
              {t.stepOf(currentStepIndex + 1, totalSteps)}
            </span>
            <button type="button"
              onClick={skipOnboarding}
              className="text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
            >
              {t.skip}
            </button>
          </div>
          <div className="h-1.5 bg-[var(--color-bgHover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step card */}
      <div className="w-full max-w-lg">
        <div className="card p-8">
          {/* Title & description */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1">{currentInfo.title}</h1>
            <p className="text-[var(--color-textMuted)]">{currentInfo.description}</p>
          </div>

          {/* ===== WELCOME ===== */}
          {state.currentStep === 'welcome' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-xs text-[var(--color-textMuted)]">{t.welcomeInventory}</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl mb-2">🗺️</div>
                  <div className="text-xs text-[var(--color-textMuted)]">{t.welcomeFloorPlan}</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="text-xs text-[var(--color-textMuted)]">{t.welcomeAnalytics}</div>
                </div>
              </div>
              <button type="button"
                onClick={nextStep}
                className="btn btn-primary w-full py-3"
              >
                {t.startSetup}
              </button>
            </div>
          )}

          {/* ===== BUSINESS TYPE ===== */}
          {state.currentStep === 'business_type' && (
            <BusinessTypeStep
              businessTypes={BUSINESS_TYPES}
              selectedType={selectedType}
              onSelectType={setSelectedType}
              onPrevStep={prevStep}
              onContinue={handleBusinessTypeContinue}
              saving={saving}
            />
          )}

          {/* ===== BUSINESS INFO ===== */}
          {state.currentStep === 'business' && (
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium mb-2">{t.businessNameLabel}</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t.placeholderBusinessName}
                  className="input"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.ownerNameLabel}</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder={t.placeholderOwnerName}
                  className="input"
                  maxLength={100}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={prevStep} className="btn btn-ghost flex-1">
                  {tc.back}
                </button>
                <button type="button"
                  onClick={handleBusinessSave}
                  disabled={saving}
                  className="btn btn-primary flex-1"
                >
                  {saving ? tc.saving : tc.next}
                </button>
              </div>
            </div>
          )}

          {/* ===== SETUP (conditional on business type) ===== */}
          {state.currentStep === 'setup' && (
            <SetupStep
              selectedType={selectedType}
              onPrevStep={prevStep}
              onFinish={handleSetupFinish}
            />
          )}

          {/* ===== COMPLETE ===== */}
          {state.currentStep === 'complete' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
                <IconCheck size={40} className="text-[var(--color-success)]" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg font-medium">{t.allReady}</p>
                <p className="text-[var(--color-textMuted)]">
                  {t.allReadyDesc}
                </p>
              </div>

              <div className="grid gap-2">
                {capabilities.map(c => (
                  <div key={c.text} className="p-3 rounded-xl bg-[var(--color-bgHover)] flex items-center gap-3">
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-sm">{c.text}</span>
                  </div>
                ))}
              </div>

              <button type="button"
                onClick={handleFinish}
                className="btn btn-primary w-full py-3"
              >
                {t.goToDashboard}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className="mt-8 flex items-center gap-2 text-[var(--color-textMuted)]">
        <div className="w-6 h-6 rounded overflow-hidden">
          <video autoPlay loop muted playsInline preload="metadata" poster="/images/torus-logo.png" className="w-full h-full object-cover">
            <source src="/images/logo-animated.mp4" type="video/mp4" />
          </video>
        </div>
        <span className="text-sm font-medium">Hookah Torus</span>
      </div>
    </div>
    </ErrorBoundary>
  )
}
