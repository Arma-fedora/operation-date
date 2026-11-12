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
- Netlify: personal access token для API (или drag-and-drop в веб-интерфейсе).

Скопируйте шаблон фронтенда и заполните:

```bash
cp .env.example .env.local
```

В `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_DEMO_MODE=
```

Секреты Edge Functions живут **в Supabase**, а не в репозитории — файл `supabase/.env.functions` использовать не нужно:

```bash
supabase secrets set \
  TELEGRAM_BOT_TOKEN=<bot-token> \
  TELEGRAM_OWNER_CHAT_ID=<chat-id> \
  TELEGRAM_ALLOWED_USER_IDS=<id-1>,<id-2> \
  TELEGRAM_WEBHOOK_SECRET=<openssl rand -base64 48> \
  MINI_APP_URL=https://<your-site>.netlify.app
```

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` задеплоенным функциям Supabase подставляет сам. Не кладите `service_role` во фронтенд.

## 3. Проверка готовности

```bash
npm run preflight
```

Скрипт читает `.env.local`, проверяет форматы ключей, HTTPS, наличие миграции/функций, `public/_redirects`, `public/_headers`, `public/vendor/telegram-web-app.js` и production-сборки. Отдельно проверяется, что `dist/index.html` не тянет `telegram.org` и Google Fonts. Секреты он не печатает.

## 4. Supabase

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
supabase functions deploy game-api
supabase functions deploy telegram-webhook
supabase secrets list
```

Убедитесь, что у таблиц включён RLS и нет политик для `anon`/`authenticated` — клиент ходит только через Edge Functions.

## 5. Фронтенд (Netlify)

Соберите статику и опубликуйте на Netlify:

```bash
npm run build
cd dist && zip -r ../dist.zip . && cd ..
```

Архив содержит `index.html`, `assets/`, `vendor/`, `_redirects`, `_headers` в корне — загрузите его в Netlify (drag-and-drop) или через API:

```bash
curl -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  -H "Content-Type: application/zip" \
  --data-binary @dist.zip \
  "https://api.netlify.com/api/v1/sites/<site-id>/deploys"
```

`_redirects` отвечает за SPA-fallback: без него прямые ссылки вроде `/final` дадут 404.

Переменные `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` запекаются в сборку на этапе `npm run build` — в панели Netlify их задавать не нужно. `VITE_DEMO_MODE` не задавайте: иначе финальный ответ не уйдёт в Telegram.

## 6. Telegram

```bash
node --env-file=.env.setup scripts/setup-telegram.mjs
```

Скрипт ставит webhook, команды бота и кнопку Mini App. Если секрет был сгенерирован скриптом, сохраните его в Supabase:

```bash
supabase secrets set TELEGRAM_WEBHOOK_SECRET=<secret>
```

Webhook ставится напрямую через Bot API:

```bash
curl "https://api.telegram.org/bot<token>/setWebhook?url=https://<project-ref>.supabase.co/functions/v1/telegram-webhook&secret_token=<secret>"
```

## 7. Приёмка

- [ ] `npm run preflight` без ошибок.
- [ ] Mini App открывается по HTTPS из Telegram.
- [ ] В консоли браузера нет запросов к `telegram.org` и `fonts.googleapis.com`.
- [ ] Прогресс сохраняется после перезапуска.
- [ ] Финальный ответ приходит владельцу в Telegram.
- [ ] Повторная отправка ответа обновляет запись, а не создаёт дубль.
- [ ] В Supabase нет ошибок в логах `game-api` и `telegram-webhook`.
- [ ] `TELEGRAM_ALLOWED_USER_IDS` заполнен, если приложение не должно быть публичным.

## Откат

1. В Netlify выберите предыдущий успешный deployment и нажмите **Promote to Production**.
2. Если проблема в функциях — задеплойте предыдущую версию из git-тега/коммита: `supabase functions deploy game-api`.
3. Webhook можно снять командой `curl "https://api.telegram.org/bot<token>/deleteWebhook"`.
4. Данные в Supabase не удаляются автоматически; при необходимости откатите миграцию вручную после бэкапа.
