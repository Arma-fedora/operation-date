# Деплой: короткий чек-лист

Подробные шаги — в [SETUP.md](./SETUP.md) и [TELEGRAM.md](./TELEGRAM.md). Здесь — порядок действий и проверки перед публикацией.

## 1. Локальные проверки

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

Playwright-браузер ставится один раз:

```bash
npx playwright install chromium
```

## 2. Подготовьте ключи

- Supabase: `Project URL`, `anon public key`, `project-ref`, `service_role key` (только на сервере).
- Telegram: токен от [@BotFather](https://t.me/BotFather), ваш chat ID (бот ответит на `/id`).
- HTTPS-домен фронтенда, например `https://operation-date.vercel.app`.

Скопируйте шаблоны и заполните:

```bash
cp .env.example .env.local
cp supabase/.env.functions.example supabase/.env.functions
```

В `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_DEMO_MODE=
```

В `supabase/.env.functions`:

```dotenv
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_OWNER_CHAT_ID=<chat-id>
TELEGRAM_WEBHOOK_SECRET=<openssl rand -base64 48>
MINI_APP_URL=https://<your-domain>
INITDATA_MAX_AGE_SECONDS=86400
```

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` задеплоенным функциям Supabase подставляет сам. Не кладите `service_role` во фронтенд.

## 3. Проверка готовности

```bash
npm run preflight
```

Скрипт читает `.env.local` и `supabase/.env.functions`, проверяет форматы ключей, HTTPS, наличие миграции/функций/`vercel.json` и production-сборки. Секреты он не печатает.

## 4. Supabase

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
supabase functions deploy game-api
supabase functions deploy telegram-webhook
supabase secrets set --env-file supabase/.env.functions
supabase secrets list
```

Убедитесь, что у таблиц включён RLS и нет политик для `anon`/`authenticated` — клиент ходит только через Edge Functions.

## 5. Фронтенд

Задеплойте статическую сборку на Vercel (или другой хостинг с SPA-fallback на `index.html`).

Переменные для Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`VITE_DEMO_MODE` не задавайте. После деплоя откройте сайт: в футере/настройках не должно быть пометки демо-режима, а финальный ответ должен уходить в Telegram.

## 6. Telegram

```bash
node --env-file=.env.setup scripts/setup-telegram.mjs
```

Скрипт ставит webhook, команды бота и кнопку Mini App. Если секрет был сгенерирован скриптом, сохраните его в Supabase:

```bash
supabase secrets set TELEGRAM_WEBHOOK_SECRET=<secret>
```

## 7. Приёмка

- [ ] `npm run preflight` без ошибок.
- [ ] Mini App открывается по HTTPS из Telegram.
- [ ] Прогресс сохраняется после перезапуска.
- [ ] Финальный ответ приходит владельцу в Telegram.
- [ ] Повторная отправка ответа обновляет запись, а не создаёт дубль.
- [ ] В Supabase нет ошибок в логах `game-api` и `telegram-webhook`.
- [ ] `TELEGRAM_ALLOWED_USER_IDS` заполнен, если приложение не должно быть публичным.

## Откат

1. В Vercel выберите предыдущий успешный deployment и нажмите **Promote to Production**.
2. Если проблема в функциях — задеплойте предыдущую версию из git-тега/коммита: `supabase functions deploy game-api`.
3. Webhook можно снять командой `curl "https://api.telegram.org/bot<token>/deleteWebhook"`.
4. Данные в Supabase не удаляются автоматически; при необходимости откатите миграцию вручную после бэкапа.
