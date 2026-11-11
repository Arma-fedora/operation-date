# Установка и запуск

Ниже — путь от пустого проекта Supabase до работающего Mini App. Всё, что нужно, кроме ваших аккаунтов и ключей, уже лежит в репозитории.

## 0. Что понадобится

- Node.js 20+ и npm.
- Аккаунт [Supabase](https://supabase.com).
- Бот в Telegram, созданный через [@BotFather](https://t.me/BotFather).
- Публичный HTTPS-хостинг для фронтенда. Инструкция использует Vercel, но подойдёт любой статический хостинг с fallback на `index.html`.
- Supabase CLI (можно через `npx supabase`, но глобальная установка удобнее):

```bash
npm install -g supabase
supabase --version
```

## 1. Локальная проверка демо

```bash
npm install
npm run dev
```

Откройте `http://localhost:5173`. Пока нет `.env.local`, приложение работает в демо-режиме: прогресс в localStorage, финальный ответ остаётся на устройстве. Это удобно, чтобы проверить сюжет и вёрстку до подключения бэкенда.

Полезные команды:

```bash
npm run typecheck   # TypeScript
npm run lint        # oxlint
npm test            # vitest
npm run build       # production build
npm run preview     # посмотреть собранную версию
```

## 2. Создайте проект Supabase

1. В Supabase Dashboard создайте проект. Запишите:
   - `Project URL` — вида `https://abcdefghijkl.supabase.co`;
   - `anon public key` — публичный ключ;
   - `project-ref` — часть адреса до `supabase.co`.
2. `anon` key можно держать в браузере: он не даёт доступа к таблицам. `service_role` key нельзя никому показывать и нельзя класть во фронтенд.

## 3. Примените схему базы

### Вариант A: через CLI (рекомендуется)

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

CLI применит `supabase/migrations/0001_init.sql`.

### Вариант B: через SQL Editor

Откройте SQL Editor в Dashboard, вставьте содержимое `supabase/migrations/0001_init.sql` и выполните. Миграция создаёт:

- `sessions` — одна строка на Telegram-пользователя;
- `user_progress` — снимок прогресса;
- `puzzle_results`, `discovered_secrets`, `date_preferences` — зеркала для аналитики и восстановления;
- `final_responses` — последний финальный ответ (upsert по сессии);
- индексы, триггеры `updated_at`, включённый RLS и отзыв прав у `anon`/`authenticated`.

Проверка:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';
```

У всех шести таблиц `rowsecurity` должен быть `true`. Политик для `anon`/`authenticated` нет — это сделано намеренно: клиент не ходит в таблицы напрямую.

## 4. Задеплойте Edge Functions

```bash
supabase functions deploy game-api
supabase functions deploy telegram-webhook
```

`supabase/config.toml` уже задаёт:

- `game-api` — `verify_jwt = true` (клиент вызывает функцию с anon key, а подлинность пользователя проверяется по Telegram `initData`);
- `telegram-webhook` — `verify_jwt = false` (Telegram не присылает Supabase JWT; запрос защищён секретным заголовком).

Если ваша версия CLI игнорирует `config.toml`, задеплойте webhook явно:

```bash
supabase functions deploy telegram-webhook --no-verify-jwt
```

## 5. Задайте секреты функций

```bash
cp supabase/.env.functions.example supabase/.env.functions
```

Заполните:

| Переменная | Зачем |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Токен бота от BotFather. Только на сервере. |
| `TELEGRAM_OWNER_CHAT_ID` | Chat ID владельца, которому придёт финальный ответ. Узнать: отправить боту `/id`. |
| `TELEGRAM_WEBHOOK_SECRET` | Секрет webhook, например `openssl rand -base64 48`. |
| `MINI_APP_URL` | Публичный HTTPS-адрес приложения. |
| `INITDATA_MAX_AGE_SECONDS` | Необязательно. Срок жизни `initData`, по умолчанию 86400 секунд. |
| `TELEGRAM_ALLOWED_USER_IDS` | Необязательно. Список ID через запятую, если хотите пускать только своих. |

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` Supabase подставляет задеплоенным функциям автоматически. Не задавайте их вручную без необходимости. Для локального запуска функций их можно раскомментировать и взять из `supabase status`.

Загрузите секреты:

```bash
supabase secrets set --env-file supabase/.env.functions
supabase secrets list
```

Проверить, что функция отвечает (без валидного `initData` она должна вернуть 401, а не 500):

```bash
curl -i -X POST "https://<project-ref>.supabase.co/functions/v1/game-api" \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  --data '{"action":"bootstrap","initData":"test"}'
```

Ожидаемый ответ — `401` с сообщением о неверной подписи Telegram. Если `500`, смотрите логи:

```bash
supabase functions logs game-api
supabase functions logs telegram-webhook
```

## 6. Подключите Telegram-бота

Подробно: [TELEGRAM.md](TELEGRAM.md). Кратко:

1. Создайте бота у BotFather и получите токен.
2. Владелец бота должен открыть диалог с ботом и отправить `/start`, затем `/id`. Полученный Chat ID запишите в `TELEGRAM_OWNER_CHAT_ID`.
3. Задайте `TELEGRAM_WEBHOOK_SECRET` и `MINI_APP_URL` в секретах Supabase.
4. Создайте `.env.setup`:

```bash
TELEGRAM_BOT_TOKEN=123456:AA...
MINI_APP_URL=https://your-app.vercel.app
TELEGRAM_WEBHOOK_URL=https://<project-ref>.supabase.co/functions/v1/telegram-webhook
TELEGRAM_WEBHOOK_SECRET=<тот же секрет, что в Supabase>
```

5. Зарегистрируйте webhook и кнопку меню:

```bash
node --env-file=.env.setup scripts/setup-telegram.mjs
```

Скрипт вызовет `getMe`, `setWebhook`, `setMyCommands` и `setChatMenuButton`. Он также покажет состояние webhook. Если секрет не был задан, скрипт сгенерирует его и напомнит добавить в Supabase — тогда webhook нужно зарегистрировать повторно уже с этим секретом.

## 7. Соберите и задеплойте фронтенд

Создайте `.env.local`:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

`VITE_DEMO_MODE=true` принудительно включает локальный режим даже при заполненном Supabase. Не включайте его в продакшене.

Сборка:

```bash
npm run build
```

Папка `dist` — статический сайт. Для Vercel:

```bash
npx vercel
npx vercel --prod
```

В настройках проекта Vercel добавьте те же переменные `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` для Production, затем пересоберите. `vercel.json` уже содержит SPA-rewrite на `index.html`, иначе прямые ссылки на `/final` дадут 404.

После деплоя:

1. Убедитесь, что сайт открывается по HTTPS.
2. Обновите `MINI_APP_URL` в Supabase secrets, если домен отличается.
3. Перезапустите `scripts/setup-telegram.mjs`, чтобы кнопка меню вела на новый адрес.
4. Откройте бота в Telegram и нажмите `/start` → «Открыть дело №0103».

## 8. Проверка end-to-end

Пройдите чек-лист:

- [ ] `/start` присылает кнопку Mini App.
- [ ] Mini App открывается внутри Telegram, а не во внешнем браузере.
- [ ] В консоли нет ошибок `initData`/CORS.
- [ ] Прогресс появляется в `user_progress` после нескольких действий.
- [ ] Закрытие и повторное открытие Mini App восстанавливает экран.
- [ ] На втором устройстве с тем же Telegram-аккаунтом прогресс подтягивается.
- [ ] Финальный ответ сохраняется в `final_responses`.
- [ ] Владельцу приходит сообщение от бота.
- [ ] Если временно сломать `TELEGRAM_OWNER_CHAT_ID`, ответ всё равно сохраняется, а в интерфейсе показывается «уведомление в пути».

Проверка данных:

```sql
select telegram_user_id, current_screen, completed_screens, last_seen_at
from sessions
order by last_seen_at desc;

select response_type, preferred_date, preferred_time, delivery, created_at
from final_responses
order by created_at desc;
```

## 9. Обновление контента

- Тексты, финал, варианты ответа — `src/config/final.config.ts`.
- Персонажи, допрос, quiz, секрет Михалыча — `src/config/characters.config.ts`.
- Пазлы и подсказки — `src/config/puzzles.config.ts`.
- Точки, сценарии, координаты — `src/config/date.config.ts`.
- Галерея — `src/config/gallery.config.ts` + файлы в `public/assets/custom/`.
- Музыка — `src/config/music.config.ts` + файлы в `public/assets/custom/music/`.
- Название дела, героиня, версия — `src/config/app.config.ts`.

После изменений: `npm run typecheck && npm test && npm run build`, затем задеплойте `dist`.

## 10. Частые проблемы

| Симптом | Причина и решение |
|---|---|
| `401 Telegram signature mismatch` | Неверный `TELEGRAM_BOT_TOKEN` в секретах Supabase или `initData` устарел. Проверьте токен и `INITDATA_MAX_AGE_SECONDS`, переоткройте Mini App. |
| `403` от webhook | `TELEGRAM_WEBHOOK_SECRET` в Supabase не совпадает с секретом, с которым зарегистрирован webhook. Перерегистрируйте webhook скриптом. |
| Кнопка Mini App не появляется | `MINI_APP_URL` пустой или не HTTPS. Проверьте секреты и снова выполните `setup-telegram.mjs`. |
| Ответ сохраняется, но сообщение не приходит | `TELEGRAM_OWNER_CHAT_ID` неверный, владелец не отправлял `/start` боту, бот заблокирован. Ответ при этом уже в `final_responses` со статусом `pending`. |
| Прогресс не восстанавливается | `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` не попали в сборку. Проверьте, что переменные заданы на этапе build, а не только в dev. |
| `Демо-отправка` в финале | `VITE_DEMO_MODE=true` или пустой `VITE_SUPABASE_URL`. |
| Карта пустая | Нет интернета/тайлы OSM недоступны. В планировщике есть переключатель «схема», он работает без сети. |
| Сайт открывается, но прямой URL даёт 404 | Не настроен SPA fallback. Для Vercel используйте `vercel.json` из репозитория. |

## 11. Удаление данных

Все дочерние таблицы ссылаются на `sessions` с `on delete cascade`. Чтобы удалить участника и все его данные:

```sql
delete from public.sessions where telegram_user_id = <id>;
```

Финальные ответы можно удалить отдельно:

```sql
delete from public.final_responses where session_id = '<uuid>';
```

Не храните в этом приложении лишние персональные данные: схема специально ограничена ответом, сценарием, временем и прогрессом.
