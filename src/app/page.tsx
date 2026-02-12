'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import {
  IconSmoke,
  IconStar,
  IconTarget,
  IconCalendar,
  IconTrendUp,
  IconInventory,
} from '@/components/Icons'

const features = [
  {
    icon: IconInventory,
    title: 'Учёт инвентаря',
    description: 'Отслеживайте остатки табака в реальном времени. Уведомления о низком остатке и прогноз расхода.',
  },
  {
    icon: IconSmoke,
    title: 'Калькулятор миксов',
    description: 'Создавайте идеальные миксы с AI-рекомендациями. Сохраняйте любимые рецепты.',
  },
  {
    icon: IconTrendUp,
    title: 'Аналитика',
    description: 'Детальная статистика: популярные вкусы, расход по брендам, сравнение периодов.',
  },
  {
    icon: IconCalendar,
    title: 'История сессий',
    description: 'Полная история всех кальянов. Оценки, заметки, повторение лучших миксов.',
  },
  {
    icon: IconStar,
    title: 'Гостевая база',
    description: 'Запоминайте предпочтения гостей. Персонализированный сервис без лишних вопросов.',
  },
  {
    icon: IconTarget,
    title: 'Публичное меню',
    description: 'QR-код для гостей с вашим меню табаков и фирменными миксами.',
  },
]

const benefits = [
  {
    stat: '-30%',
    label: 'расхода табака',
    description: 'Точный учёт исключает потери и перерасход',
  },
  {
    stat: '2x',
    label: 'быстрее обслуживание',
    description: 'Готовые миксы и история предпочтений гостей',
  },
  {
    stat: '100%',
    label: 'контроль склада',
    description: 'Всегда знаете что заканчивается и когда заказывать',
  },
]

const howItWorks = [
  {
    step: '1',
    title: 'Зарегистрируйтесь',
    description: 'Создайте аккаунт за 30 секунд. Добавьте название заведения и начните работу.',
  },
  {
    step: '2',
    title: 'Добавьте табаки',
    description: 'Внесите инвентарь вручную или отсканируйте штрих-код. Укажите остатки и цены закупки.',
  },
  {
    step: '3',
    title: 'Работайте эффективнее',
    description: 'Создавайте миксы, ведите сессии, следите за статистикой. Система сама считает расход и напомнит о заказе.',
  },
]

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden">
              <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            <span className="text-xl font-bold">Hookah Torus</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              Возможности
            </Link>
            <Link href="#benefits" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              Преимущества
            </Link>
            <Link href="/pricing" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              Тарифы
            </Link>
            <Link href="/mix" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              Калькулятор
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary">
                Личный кабинет
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary hidden sm:inline-flex">
                  Войти
                </Link>
                <Link href="/register" className="btn btn-primary">
                  Начать бесплатно
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 via-transparent to-[var(--color-warning)]/10" />
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              Бесплатный старт — без карты
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Управляйте кальянной
              <span className="text-[var(--color-primary)]"> как профи</span>
            </h1>

            <p className="text-xl text-[var(--color-textMuted)] mb-8 max-w-2xl mx-auto">
              Учёт табака, создание миксов с AI, аналитика и гостевая база — всё в одном приложении для вашего заведения
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn btn-primary btn-lg text-lg px-8">
                Попробовать бесплатно
              </Link>
              <Link href="/mix" className="btn btn-secondary btn-lg text-lg px-8">
                Открыть калькулятор
              </Link>
            </div>

            <p className="mt-6 text-sm text-[var(--color-textMuted)]">
              Бесплатный старт за 2 минуты
            </p>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-8 bg-[var(--color-surface)] flex items-center gap-2 px-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="pt-8 bg-[var(--color-bg)]">
              <img
                src="/images/dashboard-preview.png"
                alt="Hookah Torus Dashboard"
                className="w-full"
                onError={(e) => {
                  // Fallback gradient if image doesn't exist
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.parentElement!.innerHTML += `
                    <div class="aspect-video bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-surface)] flex items-center justify-center">
                      <div class="text-center">
                        <div class="text-6xl mb-4">📊</div>
                        <p class="text-[var(--color-textMuted)]">Dashboard Preview</p>
                      </div>
                    </div>
                  `
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Всё что нужно для <span className="text-[var(--color-primary)]">эффективной работы</span>
            </h2>
            <p className="text-xl text-[var(--color-textMuted)] max-w-2xl mx-auto">
              Инструменты, которые экономят время и увеличивают прибыль
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card p-6 hover:border-[var(--color-primary)]/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-primary)]/20 transition-colors">
                  <feature.icon size={24} className="text-[var(--color-primary)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-[var(--color-textMuted)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 px-4 bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Что вы получите
            </h2>
            <p className="text-xl text-[var(--color-textMuted)]">
              Конкретные преимущества для вашего бизнеса
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl md:text-6xl font-bold text-[var(--color-primary)] mb-2">
                  {benefit.stat}
                </div>
                <div className="text-xl font-semibold mb-2">{benefit.label}</div>
                <p className="text-[var(--color-textMuted)]">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Как это <span className="text-[var(--color-warning)]">работает</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-[var(--color-textMuted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-warning)]/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Готовы начать?
          </h2>
          <p className="text-xl text-[var(--color-textMuted)] mb-8">
            Бесплатный тариф — навсегда. Без скрытых платежей и обязательств.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn btn-primary btn-lg text-lg px-8">
              Создать аккаунт
            </Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg text-lg px-8">
              Сравнить тарифы
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-[var(--color-textMuted)]">
            <span className="flex items-center gap-2">
              <span className="text-[var(--color-success)]">✓</span> Бесплатный старт
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[var(--color-success)]">✓</span> Без карты
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[var(--color-success)]">✓</span> Отмена в любой момент
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                    <source src="/images/logo-animated.mp4" type="video/mp4" />
                  </video>
                </div>
                <span className="font-bold">Hookah Torus</span>
              </div>
              <p className="text-sm text-[var(--color-textMuted)]">
                Платформа для управления кальянным бизнесом
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm text-[var(--color-textMuted)]">
                <li><Link href="/mix" className="hover:text-[var(--color-text)]">Калькулятор миксов</Link></li>
                <li><Link href="/recommend" className="hover:text-[var(--color-text)]">AI Рекомендации</Link></li>
                <li><Link href="/pricing" className="hover:text-[var(--color-text)]">Тарифы</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Правовая информация</h4>
              <ul className="space-y-2 text-sm text-[var(--color-textMuted)]">
                <li><Link href="/legal/terms" className="hover:text-[var(--color-text)]">Условия использования</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-[var(--color-text)]">Политика конфиденциальности</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--color-border)] text-center">
            <p className="text-sm text-[var(--color-textMuted)]">
              &copy; {new Date().getFullYear()} Hookah Torus. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
