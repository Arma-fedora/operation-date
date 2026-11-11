# Операция «Свидание»

Интерактивное расследование для Александры: архив остановился в 01:03, инспектор Пломбир ведёт допрос, Михалыч выходит на закрытой частоте, а в финале — конверт с приглашением на свидание. Без давления, без обязательств и с тремя нормальными ответами.

Приложение сделано как Telegram Mini App: мобильный интерфейс, тема Telegram, haptic feedback, BackButton, безопасные отступы, музыка, карта и сохранение прогресса. Работает и в обычном браузере в демо-режиме.

## Что внутри

- 12 экранов и более 15 механик: допрос с выборами, доска улик, 4 разных пазла, канал 1996, три испытания, планировщик маршрута, секретный архив, радиорубка, комната 01:03, конверт и эпилог.
- Сюжет про Пломбира и Михалыча, скрытые секреты, пасхалки и финальное письмо без давления.
- 4 пазла: хронология, сцена на столе, шифр и логика меню. С подсказками, попытками и отметкой «с помощью архива».
- 3 испытания: реакция с голубем Палычем, тест готовности без правильных ответов, колесо досуга.
- Планировщик: сценарии, 2–4 остановки, порядок, расстояние, настоящая карта Leaflet/OpenStreetMap и схематичный fallback.
- Секреты: печать на доске улик, красная папка, голубь в чате, сигнал на часах, комната 01:03.
- Музыка: 5 атмосферных каналов. Без файлов играет встроенный Web Audio ambient; свои треки подключаются в конфиге.
- Финальный конверт: «Да», «Другая дата», «Обсудить». Ответ сохраняется в Supabase и отправляется владельцу через Telegram-бота. Если бот недоступен, ответ всё равно сохраняется, а интерфейс честно показывает статус доставки.
- Прогресс сохраняется в localStorage и синхронизируется с Supabase. На новом устройстве прогресс подтягивается при открытии.
- Демо-режим без Supabase: всё работает локально, финальный ответ никуда не отправляется.

## Стек

React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Zustand, React Router, Leaflet + React Leaflet, официальный Telegram Web Apps SDK, Supabase (Postgres, RLS, Edge Functions), Telegram Bot API.

## Быстрый старт (демо)

```bash
npm install
npm run dev
```

Откройте `http://localhost:5173`. Без переменных окружения приложение работает в демо-режиме: прогресс хранится в браузере, ответ остаётся на устройстве.

Проверки:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Продакшен

Нужны четыре вещи:

1. Проект Supabase и применённая миграция `supabase/migrations/0001_init.sql`.
2. Две Edge Functions: `game-api` и `telegram-webhook`.
3. Telegram-бот, его токен, chat ID владельца и зарегистрированный webhook.
4. Публичный HTTPS-адрес приложения (Vercel или любой статический хостинг с SPA-fallback).

Пошаговая инструкция: [docs/SETUP.md](docs/SETUP.md).  
Telegram-бот и webhook: [docs/TELEGRAM.md](docs/TELEGRAM.md).  
Контент, фото и музыка: [docs/ASSETS.md](docs/ASSETS.md).  
Безопасность и данные: [docs/SECURITY.md](docs/SECURITY.md).

Короткая версия:

```bash
# 1. База
supabase link --project-ref <project-ref>
supabase db push

# 2. Секреты функций
cp supabase/.env.functions.example supabase/.env.functions
# заполнить TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_CHAT_ID,
# TELEGRAM_WEBHOOK_SECRET, MINI_APP_URL
supabase secrets set --env-file supabase/.env.functions

# 3. Функции
supabase functions deploy game-api
supabase functions deploy telegram-webhook

# 4. Фронтенд
cp .env.example .env.local
# заполнить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm run build
```

После деплоя фронтенда укажите его HTTPS-адрес в `MINI_APP_URL`, зарегистрируйте webhook скриптом `scripts/setup-telegram.mjs` и отправьте боту `/start`.

## Архитектура

```text
Telegram Mini App (React)
  ├─ локальный прогресс: Zustand + localStorage
  ├─ Supabase JS: invoke('game-api')
  │    ├─ bootstrap      → восстановить прогресс и финальный ответ
  │    ├─ save-progress  → снимок состояния (с валидацией на сервере)
  │    └─ submit-final   → сохранить ответ + уведомить владельца
  └─ Telegram SDK: тема, BackButton, haptics, safe area

Supabase Edge Functions
  ├─ game-api: проверка initData по HMAC, service-role доступ к таблицам
  └─ telegram-webhook: /start, /id, /help, кнопка Mini App
```

Клиент никогда не получает service-role key. Таблицы закрыты RLS и не имеют политик для `anon`/`authenticated`; доступ идёт только через Edge Function с проверкой подписи Telegram.

## Структура

```text
src/
  app/            провайдеры, guard, error boundary
  components/     UI-примитивы, эффекты, layout
  config/         тексты, персонажи, пазлы, точки, галерея, музыка, финал
  features/       пазлы, допрос, Михалыч, испытания, карта
  pages/          12 экранов
  services/       Telegram, audio, Supabase API
  store/          Zustand + persist + hydrate
  utils/          условия маршрутов, quiz, расстояния, даты
supabase/
  migrations/     схема, индексы, триггеры, RLS
  functions/      game-api, telegram-webhook, общие модули
public/assets/custom/  место для ваших фото, мемов, портрета и музыки
```

## Важно про контент

- Точки на карте по умолчанию — демонстрационные и помечены `isDemo`. Замените их на реальные места в `src/config/date.config.ts`.
- Фотографий и мемов в комплекте нет: вместо них стоят дизайнерские плейсхолдеры. Свои файлы добавляются в `public/assets/custom/` и указываются в `src/config/gallery.config.ts`.
- Музыка по умолчанию синтезируется в браузере. Свои треки подключаются в `src/config/music.config.ts`.
- Все тексты, варианты ответов и финальное письмо редактируются в `src/config/`.
- Внешние фотографии с интернета не используются.

## Ограничения и честные оговорки

- Реальный запуск требует ваших Supabase и Telegram-ключей; в репозитории их нет.
- Supabase Edge Functions не имеют встроенного rate limiting. Для личного приложения это приемлемо; для публичного — добавьте ограничения на уровне проекта или прокси.
- Карта использует публичные тайлы OpenStreetMap. При большом трафике соблюдайте [политику использования OSM](https://operations.osmfoundation.org/policies/tiles/) или подключите свой tile-провайдер.
- Браузеры блокируют автозапуск звука: музыка включается после первого действия пользователя. Это ожидаемое поведение, а не ошибка.
- Демо-режим не отправляет финальный ответ в Telegram. Это явно написано в интерфейсе.

## Лицензии

Код можно использовать и адаптировать для личного проекта. Шрифты Unbounded, IBM Plex Mono и Manrope подключаются с Google Fonts и распространяются по SIL Open Font License. Тайлы OpenStreetMap — по их лицензии и политике. Встроенные SVG-персонажи и плейсхолдеры созданы для этого проекта.
