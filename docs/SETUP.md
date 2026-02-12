# Hookah Torus — Руководство по настройке

Пошаговая инструкция для развёртывания проекта с нуля.

## Предварительные требования

- Node.js 18+
- npm или pnpm
- Аккаунт [Supabase](https://supabase.com) (бесплатный)
- Аккаунт [Stripe](https://stripe.com) (бесплатный для теста)
- Аккаунт [Vercel](https://vercel.com) (бесплатный для деплоя)

---

## 1. Настройка Supabase

### 1.1. Создание проекта

1. Зайдите на [supabase.com](https://supabase.com) и создайте новый проект.
2. Выберите регион ближе к вашей аудитории (рекомендуется EU — Frankfurt).
3. Задайте пароль для базы данных (сохраните его).

### 1.2. Запуск схемы базы данных

1. Откройте **SQL Editor** в панели Supabase.
2. Скопируйте содержимое файла `supabase-schema.sql` из корня проекта.
3. Вставьте в редактор и нажмите **Run**.
4. Убедитесь, что все таблицы созданы (проверьте в **Table Editor**).

### 1.3. Копирование ключей

1. Перейдите в **Settings → API**.
2. Скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 1.4. Настройка аутентификации

1. Перейдите в **Authentication → URL Configuration**.
2. Добавьте в **Redirect URLs**:
   - `http://localhost:3000/**` (для разработки)
   - `https://your-domain.com/**` (для продакшена)
3. Включите **Email** провайдер в **Authentication → Providers**.

---

## 2. Настройка Stripe

### 2.1. Создание продуктов и цен

1. Зайдите в [Stripe Dashboard](https://dashboard.stripe.com).
2. Перейдите в **Products** и создайте два продукта:
   - **Pro Plan** — с ежемесячной (990 руб.) и годовой (9900 руб.) ценой.
   - **Enterprise Plan** — с ежемесячной (2990 руб.) и годовой (29900 руб.) ценой.
3. Скопируйте Price ID каждой цены:
   - `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`
   - `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY`
   - `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY`
   - `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY`

### 2.2. Настройка Webhook

1. Перейдите в **Developers → Webhooks**.
2. Добавьте endpoint: `https://your-domain.com/api/stripe/webhook`.
3. Подпишитесь на события:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Скопируйте **Signing secret** → `STRIPE_WEBHOOK_SECRET`.

### 2.3. Копирование API-ключей

1. Перейдите в **Developers → API keys**.
2. Скопируйте:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

> Для тестирования используйте тестовые ключи (`pk_test_...`, `sk_test_...`).

---

## 3. Настройка Resend (опционально)

Resend используется для email-уведомлений (низкий запас, статус заказов).

1. Зарегистрируйтесь на [resend.com](https://resend.com).
2. Создайте API-ключ → `RESEND_API_KEY`.
3. Добавьте и верифицируйте домен отправки.
4. Укажите email отправителя → `RESEND_FROM_EMAIL`.

---

## 4. Локальная разработка

```bash
# Клонирование
git clone <repo-url>
cd hookah-mix-mvp

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.local.example .env.local
# Заполните .env.local реальными ключами

# Запуск
npm run dev
```

Откройте http://localhost:3000.

---

## 5. Деплой на Vercel

### 5.1. Импорт проекта

1. Зайдите на [vercel.com](https://vercel.com) и нажмите **Import Project**.
2. Подключите репозиторий из GitHub.
3. Framework Preset: **Next.js** (определится автоматически).

### 5.2. Переменные окружения

Добавьте все переменные из `.env.local.example` в **Settings → Environment Variables**:

| Переменная | Обязательная |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Да |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Да |
| `SUPABASE_SERVICE_ROLE_KEY` | Да |
| `STRIPE_SECRET_KEY` | Да |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Да |
| `STRIPE_WEBHOOK_SECRET` | Да |
| `NEXT_PUBLIC_STRIPE_PRICE_*` (4 шт.) | Да |
| `NEXT_PUBLIC_APP_URL` | Да (URL деплоя) |
| `RESEND_API_KEY` | Нет |
| `RESEND_FROM_EMAIL` | Нет |
| `TELEGRAM_BOT_TOKEN` | Нет |
| `TELEGRAM_WEBHOOK_SECRET` | Нет |

### 5.3. Настройка домена

1. В Vercel: **Settings → Domains** → добавьте свой домен.
2. Обновите DNS-записи у регистратора.
3. Обновите `NEXT_PUBLIC_APP_URL` на рабочий URL.
4. Обновите **Redirect URLs** в Supabase.
5. Обновите **Webhook endpoint** в Stripe.

### 5.4. Проверка

После деплоя проверьте:
- [ ] Регистрация и вход работают
- [ ] Страница `/forgot-password` доступна
- [ ] Оплата через Stripe проходит (в тестовом режиме)
- [ ] Страницы `/legal/terms` и `/legal/privacy` доступны
- [ ] Dashboard загружается после входа

---

## Демо-режим

Для демонстрации без реальных сервисов добавьте переменную:

```
NEXT_PUBLIC_DEMO_MODE=true
```

Демо-режим показывает фейковые данные и не требует настройки Supabase/Stripe.
**Не используйте в продакшене.**
