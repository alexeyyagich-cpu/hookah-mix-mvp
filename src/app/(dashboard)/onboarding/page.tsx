'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding, type OnboardingStep, type BusinessType } from '@/lib/hooks/useOnboarding'
import { useAuth } from '@/lib/AuthContext'
import { useBowls } from '@/lib/hooks/useBowls'
import { useInventory } from '@/lib/hooks/useInventory'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { IconCheck } from '@/components/Icons'
import { TOBACCOS, getBrandNames, getFlavorsByBrand } from '@/data/tobaccos'
import { getBowlBrands, getBowlsByBrand } from '@/data/bowls'
import { useTranslation } from '@/lib/i18n'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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
  const { addBowl } = useBowls()
  const { addTobacco } = useInventory()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Business step state
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')

  // Bowl step state
  const [bowlBrand, setBowlBrand] = useState('Oblako')
  const [bowlModel, setBowlModel] = useState('')
  const [bowlCapacity, setBowlCapacity] = useState('18')
  const [isCustomBowl, setIsCustomBowl] = useState(false)

  // Tobacco step state — multi-select
  const [tobaccoBrand, setTobaccoBrand] = useState('Darkside')
  const [selectedFlavors, setSelectedFlavors] = useState<Set<string>>(new Set())
  const [tobaccoQuantity, setTobaccoQuantity] = useState('100')
  const [addedCount, setAddedCount] = useState(0)

  // Setup tab for hookah_bar
  const [setupTab, setSetupTab] = useState<'hookah' | 'bar'>('hookah')

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

  const handleBowlSave = async () => {
    if (!bowlModel) return
    setSaving(true)
    await addBowl({
      name: bowlModel,
      capacity_grams: parseInt(bowlCapacity) || 18,
      is_default: true,
    })
    setSaving(false)
  }

  const toggleFlavor = (flavor: string) => {
    setSelectedFlavors(prev => {
      const next = new Set(prev)
      if (next.has(flavor)) next.delete(flavor)
      else next.add(flavor)
      return next
    })
  }

  const toggleAllFlavors = () => {
    const brandFlavors = getFlavorsByBrand(tobaccoBrand)
    const allSelected = brandFlavors.every(f => selectedFlavors.has(f))
    setSelectedFlavors(prev => {
      const next = new Set(prev)
      if (allSelected) {
        brandFlavors.forEach(f => next.delete(f))
      } else {
        brandFlavors.forEach(f => next.add(f))
      }
      return next
    })
  }

  const handleBulkTobaccoSave = async () => {
    if (selectedFlavors.size === 0) return
    setSaving(true)
    const qty = parseInt(tobaccoQuantity) || 100
    let added = 0
    for (const flavor of selectedFlavors) {
      const catalogItem = TOBACCOS.find(t => t.flavor === flavor)
      if (!catalogItem) continue
      await addTobacco({
        tobacco_id: catalogItem.id,
        brand: catalogItem.brand,
        flavor: catalogItem.flavor,
        quantity_grams: qty,
        purchase_price: null,
        package_grams: null,
        purchase_date: null,
        expiry_date: null,
        notes: null,
      })
      added++
    }
    setAddedCount(prev => prev + added)
    setSelectedFlavors(new Set())
    setSaving(false)
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
      <ErrorBoundary>
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
    <ErrorBoundary>
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUSINESS_TYPES.map(bt => (
                  <button type="button"
                    key={bt.type}
                    onClick={() => setSelectedType(bt.type)}
                    disabled={bt.type === 'restaurant'}
                    className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                      selectedType === bt.type
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : bt.type === 'restaurant'
                          ? 'border-[var(--color-border)] opacity-50 cursor-not-allowed'
                          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                    }`}
                  >
                    {bt.badge && (
                      <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-bgHover)] text-[var(--color-textMuted)]">
                        {bt.badge}
                      </span>
                    )}
                    <div className="text-2xl mb-2">{bt.icon}</div>
                    <div className="font-semibold">{bt.title}</div>
                    <div className="text-xs text-[var(--color-textMuted)] mt-0.5">{bt.description}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={prevStep} className="btn btn-ghost flex-1">
                  {tc.back}
                </button>
                <button type="button"
                  onClick={handleBusinessTypeContinue}
                  disabled={!selectedType || saving}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? tc.saving : tc.next}
                </button>
              </div>
            </div>
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
            <div className="space-y-4 text-left">
              {/* Tab switch for hookah_bar */}
              {needsHookah && needsBar && (
                <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-bgHover)]">
                  <button type="button"
                    onClick={() => setSetupTab('hookah')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      setupTab === 'hookah'
                        ? 'bg-[var(--color-bgCard)] text-[var(--color-text)] shadow-sm'
                        : 'text-[var(--color-textMuted)]'
                    }`}
                  >
                    🔥 {t.hookahTab}
                  </button>
                  <button type="button"
                    onClick={() => setSetupTab('bar')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      setupTab === 'bar'
                        ? 'bg-[var(--color-bgCard)] text-[var(--color-text)] shadow-sm'
                        : 'text-[var(--color-textMuted)]'
                    }`}
                  >
                    🍸 {t.barTab}
                  </button>
                </div>
              )}

              {/* Hookah setup */}
              {((needsHookah && !needsBar) || (needsHookah && needsBar && setupTab === 'hookah')) && (
                <div className="space-y-4">
                  {/* Bowl section */}
                  <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
                    <p className="text-sm font-medium mb-1">{t.addBowlPrompt}</p>
                    <p className="text-xs text-[var(--color-textMuted)]">{t.addBowlPromptDesc}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t.brand}</label>
                    <select
                      value={bowlBrand}
                      onChange={(e) => { setBowlBrand(e.target.value); setBowlModel(''); setIsCustomBowl(false); }}
                      className="input"
                    >
                      {getBowlBrands().map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.modelLabel}</label>
                    {isCustomBowl ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bowlModel}
                          onChange={(e) => setBowlModel(e.target.value)}
                          placeholder={t.enterBowlName}
                          className="input flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => { setIsCustomBowl(false); setBowlModel(''); }}
                          className="px-3 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <select
                        value={bowlModel}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') { setIsCustomBowl(true); setBowlModel(''); }
                          else {
                            setBowlModel(e.target.value);
                            const preset = getBowlsByBrand(bowlBrand).find(b => b.name === e.target.value);
                            if (preset) setBowlCapacity(String(preset.capacity));
                          }
                        }}
                        className="input"
                      >
                        <option value="">{t.selectModel}</option>
                        {getBowlsByBrand(bowlBrand).map(b => (
                          <option key={b.id} value={b.name}>{b.name} ({b.capacity}{tc.grams})</option>
                        ))}
                        <option value="__custom__">{t.otherOption}</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.capacityGramsLabel}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={bowlCapacity}
                      onChange={(e) => setBowlCapacity(e.target.value)}
                      min="5"
                      max="50"
                      step="1"
                      className="input"
                    />
                  </div>

                  {bowlModel && (
                    <button type="button"
                      onClick={handleBowlSave}
                      disabled={saving}
                      className="btn btn-ghost w-full text-[var(--color-primary)] disabled:opacity-50"
                    >
                      {saving ? tc.saving : `+ ${t.addBowl}`}
                    </button>
                  )}

                  <hr className="border-[var(--color-border)]" />

                  {/* Tobacco section — multi-select */}
                  <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
                    <p className="text-sm font-medium mb-1">{t.addTobaccoPrompt}</p>
                    <p className="text-xs text-[var(--color-textMuted)]">{t.addTobaccoPromptDesc}</p>
                  </div>

                  {addedCount > 0 && (
                    <div className="p-2 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] text-sm text-center">
                      {t.tobaccosAdded(addedCount)}
                    </div>
                  )}

                  {/* Brand tabs */}
                  <div className="flex flex-wrap gap-1.5">
                    {getBrandNames().map(b => (
                      <button type="button"
                        key={b}
                        onClick={() => setTobaccoBrand(b)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          tobaccoBrand === b
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>

                  {/* Select all / flavor count */}
                  <div className="flex items-center justify-between">
                    <button type="button"
                      onClick={toggleAllFlavors}
                      className="text-xs text-[var(--color-primary)] hover:underline"
                    >
                      {getFlavorsByBrand(tobaccoBrand).every(f => selectedFlavors.has(f))
                        ? t.deselectAll
                        : t.selectAll}
                    </button>
                    {selectedFlavors.size > 0 && (
                      <span className="text-xs text-[var(--color-textMuted)]">
                        {t.selectedCount(selectedFlavors.size)}
                      </span>
                    )}
                  </div>

                  {/* Flavor chip grid */}
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {getFlavorsByBrand(tobaccoBrand).map(flavor => {
                      const isSelected = selectedFlavors.has(flavor)
                      return (
                        <button type="button"
                          key={flavor}
                          onClick={() => toggleFlavor(flavor)}
                          className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                            isSelected
                              ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/50'
                              : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                          }`}
                        >
                          {isSelected && <span className="mr-1">{'\u2713'}</span>}
                          {flavor}
                        </button>
                      )
                    })}
                  </div>

                  {/* Quantity per item */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.quantityPerItemLabel}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={tobaccoQuantity}
                      onChange={(e) => setTobaccoQuantity(e.target.value)}
                      min="1"
                      step="1"
                      className="input"
                    />
                  </div>

                  {selectedFlavors.size > 0 && (
                    <button type="button"
                      onClick={handleBulkTobaccoSave}
                      disabled={saving}
                      className="btn btn-primary w-full disabled:opacity-50"
                    >
                      {saving ? tc.saving : t.addSelectedTobaccos(selectedFlavors.size)}
                    </button>
                  )}
                </div>
              )}

              {/* Bar setup */}
              {((needsBar && !needsHookah) || (needsBar && needsHookah && setupTab === 'bar')) && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
                    <p className="text-sm font-medium mb-1">{t.barStockTitle}</p>
                    <p className="text-xs text-[var(--color-textMuted)]">
                      {t.barStockDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[t.barStockVodka, t.barStockGin, t.barStockWhiteRum, t.barStockWhiskey, t.barStockTequila, t.barStockTonic].map(name => (
                      <div
                        key={name}
                        className="p-3 rounded-xl bg-[var(--color-bgHover)] flex items-center gap-2"
                      >
                        <span className="text-sm">🍶</span>
                        <span className="text-sm">{name}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-[var(--color-textMuted)] text-center">
                    {t.barStockNote}
                  </p>

                  {selectedType === 'restaurant' && (
                    <div className="p-3 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
                      <p className="text-sm text-[var(--color-warning)]">
                        {t.kitchenSoon}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={prevStep} className="btn btn-ghost flex-1">
                  {tc.back}
                </button>
                <button type="button"
                  onClick={handleSetupFinish}
                  className="btn btn-primary flex-1"
                >
                  {t.finish}
                </button>
              </div>
            </div>
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
