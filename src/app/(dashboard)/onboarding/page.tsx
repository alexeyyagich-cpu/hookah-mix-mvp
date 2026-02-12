'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding, type OnboardingStep } from '@/lib/hooks/useOnboarding'
import { useAuth } from '@/lib/AuthContext'
import { useBowls } from '@/lib/hooks/useBowls'
import { useInventory } from '@/lib/hooks/useInventory'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { IconBowl, IconInventory, IconCheck } from '@/components/Icons'

const STEP_INFO: Record<OnboardingStep, { title: string; description: string; icon: string }> = {
  welcome: {
    title: 'Добро пожаловать!',
    description: 'Настроим ваше заведение за пару минут',
    icon: '👋',
  },
  business: {
    title: 'О вашем заведении',
    description: 'Расскажите немного о себе',
    icon: '🏪',
  },
  bowl: {
    title: 'Первая чаша',
    description: 'Добавьте чашу для точного расчёта',
    icon: '🥣',
  },
  tobacco: {
    title: 'Первый табак',
    description: 'Добавьте табак в инвентарь',
    icon: '🍃',
  },
  complete: {
    title: 'Готово!',
    description: 'Вы готовы к работе',
    icon: '🎉',
  },
}

export default function OnboardingPage() {
  const router = useRouter()
  const { state, loading, currentStepIndex, totalSteps, progress, nextStep, prevStep, skipOnboarding, finishOnboarding } = useOnboarding()
  const { user, profile, refreshProfile } = useAuth()
  const { addBowl } = useBowls()
  const { addTobacco } = useInventory()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Business step state
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')

  // Bowl step state
  const [bowlName, setBowlName] = useState('Phunnel')
  const [bowlCapacity, setBowlCapacity] = useState('20')

  // Tobacco step state
  const [tobaccoBrand, setTobaccoBrand] = useState('Darkside')
  const [tobaccoFlavor, setTobaccoFlavor] = useState('')
  const [tobaccoQuantity, setTobaccoQuantity] = useState('100')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '')
      setOwnerName(profile.owner_name || '')
    }
  }, [profile])

  // Redirect if onboarding is complete
  useEffect(() => {
    if (!loading && state.isComplete) {
      router.push('/dashboard')
    }
  }, [loading, state.isComplete, router])

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
    setSaving(true)
    await addBowl({
      name: bowlName,
      capacity_grams: parseInt(bowlCapacity) || 20,
      is_default: true,
    })
    setSaving(false)
    nextStep()
  }

  const handleTobaccoSave = async () => {
    if (!tobaccoFlavor) return
    setSaving(true)
    await addTobacco({
      tobacco_id: `custom-${Date.now()}`,
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--color-bg)]">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--color-textMuted)]">
            Шаг {currentStepIndex + 1} из {totalSteps}
          </span>
          <button
            onClick={skipOnboarding}
            className="text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
          >
            Пропустить
          </button>
        </div>
        <div className="h-2 bg-[var(--color-bgHover)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step card */}
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          {/* Icon */}
          <div className="text-6xl mb-4">{currentInfo.icon}</div>

          {/* Title & description */}
          <h1 className="text-2xl font-bold mb-2">{currentInfo.title}</h1>
          <p className="text-[var(--color-textMuted)] mb-8">{currentInfo.description}</p>

          {/* Step content */}
          {state.currentStep === 'welcome' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-xs text-[var(--color-textMuted)]">Учёт инвентаря</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl mb-2">🧮</div>
                  <div className="text-xs text-[var(--color-textMuted)]">Калькулятор миксов</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-xs text-[var(--color-textMuted)]">Профили гостей</div>
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
                <button
                  onClick={prevStep}
                  className="btn btn-ghost flex-1"
                >
                  Назад
                </button>
                <button
                  onClick={handleBusinessSave}
                  disabled={saving}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Сохранение...' : 'Продолжить'}
                </button>
              </div>
            </div>
          )}

          {state.currentStep === 'bowl' && (
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-xl bg-[var(--color-bgHover)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center">
                  <IconBowl size={24} className="text-[var(--color-primary)]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Зачем нужна чаша?</p>
                  <p className="text-sm text-[var(--color-textMuted)]">
                    Для точного расчёта граммовки в миксах
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Название чаши</label>
                <select
                  value={bowlName}
                  onChange={(e) => setBowlName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  <option value="Phunnel">Phunnel</option>
                  <option value="Phunnel M">Phunnel M</option>
                  <option value="Phunnel L">Phunnel L</option>
                  <option value="Turkish">Turkish</option>
                  <option value="Vortex">Vortex</option>
                  <option value="Другая">Другая</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Вместимость (грамм)</label>
                <input
                  type="number"
                  value={bowlCapacity}
                  onChange={(e) => setBowlCapacity(e.target.value)}
                  min="10"
                  max="50"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={prevStep}
                  className="btn btn-ghost flex-1"
                >
                  Назад
                </button>
                <button
                  onClick={handleBowlSave}
                  disabled={saving}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Сохранение...' : 'Добавить чашу'}
                </button>
              </div>
            </div>
          )}

          {state.currentStep === 'tobacco' && (
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-xl bg-[var(--color-bgHover)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-success)]/20 flex items-center justify-center">
                  <IconInventory size={24} className="text-[var(--color-success)]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Первый табак</p>
                  <p className="text-sm text-[var(--color-textMuted)]">
                    Остальные добавите позже в Инвентаре
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Бренд</label>
                <select
                  value={tobaccoBrand}
                  onChange={(e) => setTobaccoBrand(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  <option value="Darkside">Darkside</option>
                  <option value="Musthave">Musthave</option>
                  <option value="Tangiers">Tangiers</option>
                  <option value="Adalya">Adalya</option>
                  <option value="Al Fakher">Al Fakher</option>
                  <option value="Fumari">Fumari</option>
                  <option value="Element">Element</option>
                  <option value="Black Burn">Black Burn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Вкус</label>
                <input
                  type="text"
                  value={tobaccoFlavor}
                  onChange={(e) => setTobaccoFlavor(e.target.value)}
                  placeholder="Supernova, Pinkman..."
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                />
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
              <div className="flex gap-3 pt-4">
                <button
                  onClick={prevStep}
                  className="btn btn-ghost flex-1"
                >
                  Назад
                </button>
                <button
                  onClick={handleTobaccoSave}
                  disabled={saving || !tobaccoFlavor}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : 'Добавить табак'}
                </button>
              </div>
            </div>
          )}

          {state.currentStep === 'complete' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
                <IconCheck size={40} className="text-[var(--color-success)]" />
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium">Всё готово!</p>
                <p className="text-[var(--color-textMuted)]">
                  Ваше заведение настроено. Теперь вы можете:
                </p>
              </div>

              <div className="grid gap-3 text-left">
                <div className="p-3 rounded-xl bg-[var(--color-bgHover)] flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <span className="text-sm">Отслеживать инвентарь</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-bgHover)] flex items-center gap-3">
                  <span className="text-xl">🧮</span>
                  <span className="text-sm">Создавать миксы</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-bgHover)] flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  <span className="text-sm">Записывать сессии</span>
                </div>
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
