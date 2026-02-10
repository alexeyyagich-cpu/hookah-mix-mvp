'use client'

import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { PricingCard } from '@/components/pricing/PricingCard'
import { IconSmoke } from '@/components/Icons'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    price: 'Бесплатно',
    description: 'Для пробного использования',
    features: [
      { name: 'Позиций в инвентаре', value: '10', included: true },
      { name: 'История сессий', value: '30 дней', included: true },
      { name: 'Типов чаш', value: '1', included: true },
      { name: 'Базовая статистика', included: true },
      { name: 'Экспорт данных', included: false },
      { name: 'API доступ', included: false },
      { name: 'Приоритетная поддержка', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '9.90€',
    description: 'Для активных заведений',
    features: [
      { name: 'Позиций в инвентаре', value: '∞', included: true },
      { name: 'История сессий', value: '∞', included: true },
      { name: 'Типов чаш', value: '∞', included: true },
      { name: 'Полная статистика', included: true },
      { name: 'Экспорт CSV/PDF', included: true },
      { name: 'API доступ', included: true },
      { name: 'Приоритетная поддержка', included: false },
    ],
    isPopular: true,
  },
  {
    name: 'Enterprise',
    price: '29.90€',
    description: 'Для сетей заведений',
    features: [
      { name: 'Все из Pro', included: true },
      { name: 'Мультилокации', included: true },
      { name: 'Командный доступ', included: true },
      { name: 'Кастомные отчеты', included: true },
      { name: 'Интеграции (iiko, R-Keeper)', included: true },
      { name: 'API для разработчиков', included: true },
      { name: 'Приоритетная поддержка', included: true },
    ],
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const { tier } = useSubscription()

  const handleSelectPlan = async (planName: string) => {
    if (!user) {
      window.location.href = `/register?plan=${planName.toLowerCase()}`
      return
    }

    // In production, this would redirect to Stripe/YooKassa checkout
    alert(`Переход к оплате тарифа ${planName}. (Интеграция с платежной системой будет добавлена позже)`)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="p-4 border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            Hookah Torus
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/mix" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              Калькулятор
            </Link>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary">
                Личный кабинет
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Выберите подходящий тариф
          </h1>
          <p className="text-xl text-[var(--color-textMuted)] max-w-2xl mx-auto">
            Инструменты для учета табака, анализа сессий и оптимизации работы вашего заведения
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              name={plan.name}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              isPopular={plan.isPopular}
              isCurrent={tier === plan.name.toLowerCase()}
              onSelect={() => handleSelectPlan(plan.name)}
              buttonText={plan.price === 'Бесплатно' ? 'Начать бесплатно' : 'Подключить'}
            />
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Часто задаваемые вопросы</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                q: 'Могу ли я отменить подписку?',
                a: 'Да, вы можете отменить подписку в любой момент. Доступ сохранится до конца оплаченного периода.',
              },
              {
                q: 'Какие способы оплаты доступны?',
                a: 'Мы принимаем банковские карты (Visa, Mastercard), PayPal и банковские переводы.',
              },
              {
                q: 'Есть ли пробный период для Pro?',
                a: 'Да, для новых пользователей доступен 14-дневный пробный период Pro без ограничений.',
              },
              {
                q: 'Могу ли я перейти на другой тариф?',
                a: 'Да, вы можете повысить или понизить тариф в любой момент. При повышении разница будет пропорционально списана.',
              },
              {
                q: 'Что будет с моими данными при понижении тарифа?',
                a: 'Ваши данные сохранятся, но доступ к старой истории и дополнительным позициям в инвентаре будет ограничен.',
              },
              {
                q: 'Как работает пробный период?',
                a: 'После регистрации вы получаете 14 дней Pro-доступа. Карта не требуется, отмена автоматическая.',
              },
            ].map((faq, index) => (
              <div key={index} className="card p-5">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-[var(--color-textMuted)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-[var(--color-textMuted)] mb-4">
            Есть вопросы? Напишите нам
          </p>
          <a
            href="mailto:support@hookah-mix.com"
            className="text-[var(--color-primary)] hover:underline"
          >
            support@hookah-mix.com
          </a>
        </div>
      </main>
    </div>
  )
}
