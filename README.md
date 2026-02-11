# Hookah Torus

**Первый SaaS для кальянных с учётом по сессиям, совместимостью миксов и профилями гостей.**

Сокращает потери табака на 10-15% и увеличивает возвращаемость гостей.

---

## Проблемы рынка

| Боль | Как решают сейчас | Потери |
|------|-------------------|--------|
| Учёт расхода табака | Ручные таблицы, Excel | 10-15% перерасход/кражи |
| Контроль персонала | Отдельные HR-системы | Высокая стоимость, сложность |
| Закупки | Вручную, без прогноза | Over/understocking |
| Аналитика | Нет или вручную | Упущенная прибыль |
| Лояльность гостей | Не отслеживается | Низкий retention |

---

## Наше решение

### Ключевые функции

- **Калькулятор миксов** — совместимость вкусов, сохранение рецептов
- **Учёт по сессиям** — списание табака с привязкой к кальянщику и гостю
- **Профили гостей** — история предпочтений, крепость, любимые миксы
- **Инвентарь** — остатки, транзакции, low stock alerts
- **Маркетплейс** — заказ у поставщиков, авто-reorder (Enterprise)
- **Команда** — роли owner/staff/guest с разделением доступа
- **QR-меню** — публичная страница заведения для гостей
- **Статистика** — расход, популярные миксы, тренды

---

## Конкурентные преимущества

| Функция | Конкуренты | Hookah Torus |
|---------|-----------|--------------|
| Учёт расхода | Базовый инвентарь | По сессиям с привязкой к персоналу |
| Миксы | Потребительские apps | Бизнес-калькулятор + списание |
| Гости | Нет | Профили с историей |
| Закупки | Ручной reorder | Авто-заказ при низком остатке |
| Интеграция | Зоопарк систем | Всё в одном |

### Почему мы лучше

1. **Единственный SaaS с калькулятором совместимости миксов**
   - Hookah Mixer — потребительское приложение
   - У нас — бизнес-инструмент: микс → сессия → инвентарь → профиль гостя

2. **Сессионный учёт вместо "просто инвентаря"**
   - Bizmodo/GT Hookah считают остатки
   - Мы считаем: кто забил, сколько ушло, какой микс, для кого

3. **Профили гостей = персонализация + retention**
   - Ни один конкурент не сохраняет предпочтения гостя
   - Wow-эффект при повторном визите

4. **Всё-в-одном**
   - Конкуренты: POS + inventory + HR + spreadsheets
   - Мы: единый интерфейс за $8-30/мес

5. **Авто-заказ (Enterprise)**
   - Упал Darkside ниже 500г → заказ поставщику автоматически

---

## Тарифы

| План | Цена | Возможности |
|------|------|-------------|
| Free | 0₽ | 10 позиций, 1 чаша, 30 дней истории |
| Pro | 990₽/мес | Безлимит, команда, маркетплейс, экспорт |
| Enterprise | 2990₽/мес | Авто-заказ, API, приоритетная поддержка |

---

## Технологии

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Payments**: Stripe (subscriptions, webhooks, portal)
- **Deployment**: Vercel

---

## Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/your-repo/hookah-torus.git
cd hookah-torus

# Установить зависимости
npm install

# Скопировать переменные окружения
cp .env.local.example .env.local

# Запустить dev сервер
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000)

### Переменные окружения

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Авторизованные страницы
│   ├── api/                # API routes (Stripe webhooks)
│   └── pricing/            # Публичные страницы
├── components/             # React компоненты
│   ├── dashboard/          # Sidebar, навигация
│   ├── marketplace/        # Маркетплейс UI
│   └── pricing/            # Карточки тарифов
├── lib/                    # Утилиты и хуки
│   ├── hooks/              # useInventory, useSession, etc.
│   ├── supabase/           # Клиент Supabase
│   └── stripe.ts           # Конфигурация Stripe
└── types/                  # TypeScript типы
```

---

## Лицензия

Proprietary. All rights reserved.
