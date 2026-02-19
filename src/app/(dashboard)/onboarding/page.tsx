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

const STEP_INFO: Record<OnboardingStep, { title: string; description: string }> = {
  welcome: {
    title: 'Добро пожаловать в Hookah Torus',
    description: 'Платформа для управления заведением',
  },
  business_type: {
    title: 'Тип заведения',
    description: 'Выберите, что подходит вам',
  },
  business: {
    title: 'О вашем заведении',
    description: 'Расскажите немного о себе',
  },
  setup: {
    title: 'Быстрая настройка',
    description: 'Добавьте первые позиции',
  },
  complete: {
    title: 'Готово!',
    description: 'Вы готовы к работе',
  },
  // Legacy steps (for type completeness)
  bowl: { title: '', description: '' },
  tobacco: { title: '', description: '' },
}

const BUSINESS_TYPES: { type: BusinessType; icon: string; title: string; description: string; badge?: string }[] = [
  { type: 'hookah', icon: '🔥', title: 'Кальянная', description: 'Табак, миксы, сессии' },
  { type: 'bar', icon: '🍸', title: 'Бар', description: 'Коктейли, склад, меню' },
  { type: 'hookah_bar', icon: '🔥🍸', title: 'Кальянная + Бар', description: 'Всё в одном' },
  { type: 'restaurant', icon: '🍽️', title: 'Ресторан / Кафе', description: 'Бар + кухня', badge: 'скоро' },
]

export default function OnboardingPage() {
  const t = useTranslation('hookah')
  const tc = useTranslation('common')
  const router = useRouter()
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

  // Tobacco step state
  const [tobaccoBrand, setTobaccoBrand] = useState('Darkside')
  const [tobaccoFlavor, setTobaccoFlavor] = useState('')
  const [tobaccoQuantity, setTobaccoQuantity] = useState('100')
  const [isCustomFlavor, setIsCustomFlavor] = useState(false)

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

  const handleTobaccoSave = async () => {
    if (!tobaccoFlavor) return
    setSaving(true)
    const catalogItem = TOBACCOS.find(t => t.brand === tobaccoBrand && t.flavor === tobaccoFlavor)
    await addTobacco({
      tobacco_id: catalogItem?.id || `custom-${Date.now()}`,
      brand: tobaccoBrand,
      flavor: tobaccoFlavor,
      quantity_grams: parseInt(tobaccoQuantity) || 100,
      purchase_price: null,
      package_grams: null,
      purchase_date: null,
      expiry_date: null,
      notes: null,
    })
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentInfo = STEP_INFO[state.currentStep]

  // Capabilities for complete step
  const capabilities: { icon: string; text: string }[] = []
  if (needsHookah) {
    capabilities.push(
      { icon: '📊', text: 'Учёт табака и инвентаря' },
      { icon: '🧮', text: 'Калькулятор миксов' },
      { icon: '📝', text: 'Сессии и история' },
    )
  }
  if (needsBar) {
    capabilities.push(
      { icon: '🍸', text: 'Управление баром' },
      { icon: '📋', text: 'Рецепты и меню' },
      { icon: '💰', text: 'Продажи и аналитика' },
    )
  }
  capabilities.push(
    { icon: '🗺️', text: 'План зала и бронирования' },
    { icon: '👥', text: 'Команда и управление' },
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--color-bg)]">
      {/* Progress bar */}
      {state.currentStep !== 'complete' && (
        <div className="w-full max-w-lg mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-textMuted)]">
              Шаг {currentStepIndex + 1} из {totalSteps}
            </span>
            <button
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
                  <div className="text-xs text-[var(--color-textMuted)]">Учёт инвентаря</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl mb-2">🗺️</div>
                  <div className="text-xs text-[var(--color-textMuted)]">План зала</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="text-xs text-[var(--color-textMuted)]">Аналитика</div>
                </div>
              </div>
              <button
                onClick={nextStep}
                className="btn btn-primary w-full py-3"
              >
                Начать настройку
              </button>
            </div>
          )}

          {/* ===== BUSINESS TYPE ===== */}
          {state.currentStep === 'business_type' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUSINESS_TYPES.map(bt => (
                  <button
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
                <button onClick={prevStep} className="btn btn-ghost flex-1">
                  {tc.back}
                </button>
                <button
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
                <label className="block text-sm font-medium mb-2">Название заведения</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Lounge Bar"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ваше имя</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Jan Kowalski"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={prevStep} className="btn btn-ghost flex-1">
                  {tc.back}
                </button>
                <button
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
                  <button
                    onClick={() => setSetupTab('hookah')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      setupTab === 'hookah'
                        ? 'bg-[var(--color-bgCard)] text-[var(--color-text)] shadow-sm'
                        : 'text-[var(--color-textMuted)]'
                    }`}
                  >
                    🔥 Кальянная
                  </button>
                  <button
                    onClick={() => setSetupTab('bar')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      setupTab === 'bar'
                        ? 'bg-[var(--color-bgCard)] text-[var(--color-text)] shadow-sm'
                        : 'text-[var(--color-textMuted)]'
                    }`}
                  >
                    🍸 Бар
                  </button>
                </div>
              )}

              {/* Hookah setup */}
              {((needsHookah && !needsBar) || (needsHookah && needsBar && setupTab === 'hookah')) && (
                <div className="space-y-4">
                  {/* Bowl section */}
                  <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
                    <p className="text-sm font-medium mb-1">Добавьте чашу</p>
                    <p className="text-xs text-[var(--color-textMuted)]">Для точного расчёта граммовки</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Бренд</label>
                    <select
                      value={bowlBrand}
                      onChange={(e) => { setBowlBrand(e.target.value); setBowlModel(''); setIsCustomBowl(false); }}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                    >
                      {getBowlBrands().map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Модель</label>
                    {isCustomBowl ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bowlModel}
                          onChange={(e) => setBowlModel(e.target.value)}
                          placeholder="Введите название чаши"
                          className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                      >
                        <option value="">Выберите модель...</option>
                        {getBowlsByBrand(bowlBrand).map(b => (
                          <option key={b.id} value={b.name}>{b.name} ({b.capacity}г)</option>
                        ))}
                        <option value="__custom__">Другая...</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Вместимость (грамм)</label>
                    <input
                      type="number"
                      value={bowlCapacity}
                      onChange={(e) => setBowlCapacity(e.target.value)}
                      min="5"
                      max="50"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>

                  {bowlModel && (
                    <button
                      onClick={handleBowlSave}
                      disabled={saving}
                      className="btn btn-ghost w-full text-[var(--color-primary)] disabled:opacity-50"
                    >
                      {saving ? tc.saving : `+ ${t.addBowl}`}
                    </button>
                  )}

                  <hr className="border-[var(--color-border)]" />

                  {/* Tobacco section */}
                  <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
                    <p className="text-sm font-medium mb-1">Добавьте табак</p>
                    <p className="text-xs text-[var(--color-textMuted)]">Остальные добавите позже</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Бренд</label>
                    <select
                      value={tobaccoBrand}
                      onChange={(e) => { setTobaccoBrand(e.target.value); setTobaccoFlavor(''); setIsCustomFlavor(false); }}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                    >
                      {getBrandNames().map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Вкус</label>
                    {isCustomFlavor ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tobaccoFlavor}
                          onChange={(e) => setTobaccoFlavor(e.target.value)}
                          placeholder="Введите название вкуса"
                          className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => { setIsCustomFlavor(false); setTobaccoFlavor(''); }}
                          className="px-3 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <select
                        value={tobaccoFlavor}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') { setIsCustomFlavor(true); setTobaccoFlavor(''); }
                          else setTobaccoFlavor(e.target.value);
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                      >
                        <option value="">Выберите вкус...</option>
                        {getFlavorsByBrand(tobaccoBrand).map(f => <option key={f} value={f}>{f}</option>)}
                        <option value="__custom__">Другой...</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Количество (грамм)</label>
                    <input
                      type="number"
                      value={tobaccoQuantity}
                      onChange={(e) => setTobaccoQuantity(e.target.value)}
                      min="1"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>

                  {tobaccoFlavor && (
                    <button
                      onClick={handleTobaccoSave}
                      disabled={saving}
                      className="btn btn-ghost w-full text-[var(--color-primary)] disabled:opacity-50"
                    >
                      {saving ? tc.saving : `+ ${t.addTobacco}`}
                    </button>
                  )}
                </div>
              )}

              {/* Bar setup */}
              {((needsBar && !needsHookah) || (needsBar && needsHookah && setupTab === 'bar')) && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
                    <p className="text-sm font-medium mb-1">Склад бара</p>
                    <p className="text-xs text-[var(--color-textMuted)]">
                      Добавьте ингредиенты после настройки в разделе Склад
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {['Водка', 'Джин', 'Ром белый', 'Виски', 'Текила', 'Тоник'].map(name => (
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
                    Всё это можно настроить в разделе &quot;Склад&quot; после завершения
                  </p>

                  {selectedType === 'restaurant' && (
                    <div className="p-3 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
                      <p className="text-sm text-[var(--color-warning)]">
                        Модуль кухни скоро будет доступен. Пока вы можете пользоваться баром.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <button onClick={prevStep} className="btn btn-ghost flex-1">
                  {tc.back}
                </button>
                <button
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
                <p className="text-lg font-medium">Всё готово!</p>
                <p className="text-[var(--color-textMuted)]">
                  Ваше заведение настроено. Теперь вы можете:
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

              <button
                onClick={handleFinish}
                className="btn btn-primary w-full py-3"
              >
                Перейти в кабинет
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className="mt-8 flex items-center gap-2 text-[var(--color-textMuted)]">
        <div className="w-6 h-6 rounded overflow-hidden">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/images/logo-animated.mp4" type="video/mp4" />
          </video>
        </div>
        <span className="text-sm font-medium">Hookah Torus</span>
      </div>
    </div>
  )
}
