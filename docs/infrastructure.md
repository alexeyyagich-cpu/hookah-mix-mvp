# Hookah Torus — Infrastructure & Accounts

## Аккаунты и доступы

| # | Сервис | URL дашборда | Для чего |
|---|--------|-------------|----------|
| 1 | **Vercel** | https://vercel.com | Хостинг, деплой, cron jobs, analytics |
| 2 | **Supabase** | https://supabase.com | БД, авторизация, хранилище бэкапов |
| 3 | **Stripe** | https://dashboard.stripe.com | Подписки, оплата, чаевые |
| 4 | **Resend** | https://resend.com | Транзакционные email |
| 5 | **Upstash** | https://upstash.com | Redis rate limiting |
| 6 | **Telegram BotFather** | https://t.me/BotFather | Бот уведомлений (@hookah_torus_bot) |
| 7 | **Sentry** | https://sentry.io | Мониторинг ошибок |
| 8 | **Anthropic** | https://console.anthropic.com | OCR распознавание накладных (Claude Haiku) |
| 9 | **Ready2Order** | https://ready2order.com | POS интеграция |
| 10 | **GitHub** | https://github.com/alexeyyagich-cpu/hookah-mix-mvp | Репозиторий кода |

## Домен и почта

| Что | Значение |
|-----|---------|
| Домен | hookahtorus.com |
| Транзакционная почта | noreply@hookahtorus.com (Resend) |
| Контактная почта | htorus@hookahtorus.com |
| Партнёрская почта | partner@hookahtorus.com |
| VAPID email | mailto:htorus@hookahtorus.com |

## Секреты (Vercel Environment Variables — Production)

| Переменная | Сервис | Описание |
|-----------|--------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Серверный ключ с полным доступом |
| `STRIPE_SECRET_KEY` | Stripe | API ключ (sk_test_* / sk_live_*) |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Верификация вебхуков подписок (whsec_*) |
| `STRIPE_TIP_WEBHOOK_SECRET` | Stripe | Верификация вебхуков чаевых |
| `TELEGRAM_BOT_TOKEN` | Telegram | Токен бота (123456:ABC-DEF...) |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram | HMAC секрет для вебхука |
| `ADMIN_TELEGRAM_CHAT_ID` | Telegram | Chat ID админа (332371058) |
| `RESEND_API_KEY` | Resend | API ключ (re_*) |
| `UPSTASH_REDIS_REST_URL` | Upstash | REST endpoint Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Bearer токен Redis |
| `ANTHROPIC_API_KEY` | Anthropic | API ключ Claude (sk-ant-api03-*) |
| `R2O_DEVELOPER_TOKEN` | Ready2Order | Developer JWT токен |
| `R2O_ENCRYPTION_KEY` | Ready2Order | AES-256-GCM ключ шифрования токенов |
| `R2O_WEBHOOK_SECRET` | Ready2Order | HMAC секрет вебхуков |
| `VAPID_PRIVATE_KEY` | Web Push | Приватный VAPID ключ |
| `CRON_SECRET` | Vercel Cron | Bearer токен для cron jobs |

## Публичные ключи (Vercel Environment Variables)

| Переменная | Сервис | Описание |
|-----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | URL проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Анонимный публичный ключ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | Публичный ключ (pk_test_* / pk_live_*) |
| `NEXT_PUBLIC_STRIPE_PRICE_CORE_MONTHLY` | Stripe | Price ID — Core месяц (€79) |
| `NEXT_PUBLIC_STRIPE_PRICE_CORE_YEARLY` | Stripe | Price ID — Core год (€790) |
| `NEXT_PUBLIC_STRIPE_PRICE_MULTI_MONTHLY` | Stripe | Price ID — Multi месяц (€149) |
| `NEXT_PUBLIC_STRIPE_PRICE_MULTI_YEARLY` | Stripe | Price ID — Multi год (€1490) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push | Публичный VAPID ключ |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | DSN проекта |
| `NEXT_PUBLIC_APP_URL` | Vercel | https://hookahtorus.com |

## Cron Jobs (vercel.json)

| Расписание | Endpoint | Описание |
|-----------|---------|----------|
| `0 9 * * *` (ежедневно 9:00 UTC) | `/api/cron/low-stock` | Уведомления о низком остатке (push, email, Telegram) |
| `0 3 * * *` (ежедневно 3:00 UTC) | `/api/cron/backup` | Бэкап БД в Supabase Storage (30 дней) |

## Вебхуки (входящие)

| Endpoint | Источник | Описание |
|---------|---------|----------|
| `/api/stripe/webhook` | Stripe | Подписки: checkout, subscription.*, invoice.* |
| `/api/tip/webhook` | Stripe | Чаевые: checkout.session.completed |
| `/api/telegram/webhook` | Telegram | Команды бота: /start, /report, /stock, /shift |
| `/api/r2o/webhooks` | Ready2Order | Синхронизация продуктов и заказов |

## Stripe — тарифы

| Тариф | Месяц | Год | Описание |
|-------|-------|-----|----------|
| Trial | бесплатно | — | 14 дней, все функции |
| Core | €79 | €790 | 1 локация, команда, полная статистика |
| Multi | €149 | €1 490 | Безлимит локаций, CRM, API, финотчёты |
| Enterprise | от €299 | по запросу | Кастом интеграции, SLA, онбординг |

## Демо-аккаунт

| Поле | Значение |
|------|---------|
| Email | demo@hookahtorus.com |
| Пароль | demo2026! |
| User ID | c9a3791c-978f-4695-8d77-28cf235101f7 |

## Технический стек

- **Framework**: Next.js 16.1.6 (Turbopack)
- **Database**: Supabase (PostgreSQL + RLS)
- **Hosting**: Vercel (Edge + Serverless)
- **Payments**: Stripe
- **Email**: Resend
- **Rate Limiting**: Upstash Redis (fail-open)
- **Monitoring**: Sentry
- **AI/OCR**: Anthropic Claude Haiku
- **POS**: Ready2Order OAuth
- **Push**: Web Push (VAPID)
- **Bot**: Telegram Bot API
- **i18n**: 3 языка (ru/en/de), ~1800+ ключей, 8 namespaces
