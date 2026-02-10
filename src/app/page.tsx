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

const testimonials = [
  {
    name: 'Александр К.',
    role: 'Владелец Smoke House',
    text: 'Раньше тратил час на инвентаризацию в конце недели. Теперь всё автоматически — остатки, расход, что заказывать.',
    avatar: 'А',
  },
  {
    name: 'Мария С.',
    role: 'Управляющая Cloud Nine',
    text: 'Гости в восторге, что мы помним их любимые миксы. Это создаёт wow-эффект и повышает лояльность.',
    avatar: 'М',
  },
  {
    name: 'Дмитрий В.',
    role: 'Кальянный мастер',
    text: 'AI-рекомендации реально работают. Открыл для себя комбинации, о которых бы сам не подумал.',
    avatar: 'Д',
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
              Уже используют 150+ заведений в Европе
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
              Результаты наших клиентов
            </h2>
            <p className="text-xl text-[var(--color-textMuted)]">
              Цифры говорят сами за себя
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

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Что говорят <span className="text-[var(--color-warning)]">наши клиенты</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-lg font-bold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-[var(--color-textMuted)]">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-[var(--color-textMuted)]">"{testimonial.text}"</p>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[var(--color-warning)]">★</span>
                  ))}
                </div>
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
          <div className="grid md:grid-cols-4 gap-8 mb-8">
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
              <h4 className="font-semibold mb-4">Компания</h4>
              <ul className="space-y-2 text-sm text-[var(--color-textMuted)]">
                <li><a href="#" className="hover:text-[var(--color-text)]">О нас</a></li>
                <li><a href="#" className="hover:text-[var(--color-text)]">Блог</a></li>
                <li><a href="mailto:hello@hookah-torus.com" className="hover:text-[var(--color-text)]">Контакты</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Правовая информация</h4>
              <ul className="space-y-2 text-sm text-[var(--color-textMuted)]">
                <li><a href="#" className="hover:text-[var(--color-text)]">Условия использования</a></li>
                <li><a href="#" className="hover:text-[var(--color-text)]">Политика конфиденциальности</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[var(--color-textMuted)]">
              © 2025 Hookah Torus. Все права защищены.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>
              <a href="#" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
