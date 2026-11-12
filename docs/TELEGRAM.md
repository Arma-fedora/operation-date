# Telegram: бот, Mini App и уведомления

## 1. Создайте бота

1. Откройте [@BotFather](https://t.me/BotFather).
2. `/newbot`, задайте имя и username (username должен заканчиваться на `bot`).
3. Сохраните токен вида `123456789:AA...`. Это секрет: не коммитьте его, не вставляйте во фронтенд.
4. По желанию: `/setdescription`, `/setabouttext`, `/setuserpic`.

Бот работает в личных сообщениях. В группы его добавлять не нужно.

## 2. Узнайте Chat ID владельца

Уведомления о финальном ответе приходят на один chat ID. Это должен быть человек, который получит ответ (владелец бота).

1. Откройте диалог с ботом.
2. Отправьте `/start`.
3. Отправьте `/id`.

Бот ответит:

```text
Твой Telegram ID: 123456789
Chat ID этого диалога: 123456789
```

Для личного чата это одно и то же число. Запишите его в `TELEGRAM_OWNER_CHAT_ID`.

Важно: бот не может написать пользователю первым, пока тот не нажал `/start`. Если владелец заблокировал бота или удалил диалог, уведомление не уйдёт, но ответ сохранится в Supabase со статусом `pending`.

## 3. Задайте секреты Supabase

Секреты задаются прямо в Supabase — файл `supabase/.env.functions` не нужен:

```bash
supabase secrets set \
  TELEGRAM_BOT_TOKEN=123456789:AA... \
  TELEGRAM_OWNER_CHAT_ID=123456789 \
  TELEGRAM_ALLOWED_USER_IDS=123456789 \
  TELEGRAM_WEBHOOK_SECRET=<длинная случайная строка> \
  MINI_APP_URL=https://your-app.netlify.app
```

Секрет можно сгенерировать так:

```bash
openssl rand -base64 48
```

Проверьте, что `MINI_APP_URL` — публичный HTTPS-адрес. Telegram не открывает `http://` и `localhost`.

## 4. Зарегистрируйте webhook

Создайте `.env.setup` в корне проекта (он уже в `.gitignore`):

```env
TELEGRAM_BOT_TOKEN=123456789:AA...
MINI_APP_URL=https://your-app.netlify.app
TELEGRAM_WEBHOOK_URL=https://<project-ref>.supabase.co/functions/v1/telegram-webhook
TELEGRAM_WEBHOOK_SECRET=<тот же секрет, что в Supabase>
```

Запустите:

```bash
node --env-file=.env.setup scripts/setup-telegram.mjs
```

Скрипт:

- проверит токен через `getMe`;
- зарегистрирует webhook с секретным заголовком;
- установит команды `/start`, `/id`, `/help`;
- попробует установить кнопку меню «Дело №0103»;
- выведет текущее состояние webhook.

Проверить вручную:

```bash
curl "https://api.telegram.org/bot<token>/getWebhookInfo"
```

В ответе должно быть:

```json
{
  "ok": true,
  "result": {
    "url": "https://<project-ref>.supabase.co/functions/v1/telegram-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "allowed_updates": ["message"]
  }
}
```

Если `last_error_message` не пустой, читайте раздел «Проблемы».

## 5. Как работает запуск

- `/start` присылает сообщение с inline-кнопкой `web_app`. Нажатие открывает Mini App внутри Telegram.
- Кнопка меню (слева от поля ввода) открывает то же приложение.
- `MINI_APP_URL` должен быть HTTPS. После смены домена обновите секрет Supabase и перерегистрируйте webhook.
- Внутри приложения Telegram SDK передаёт `initData`. `game-api` проверяет подпись по токену бота и срок `auth_date`. Без валидной подписи функция возвращает `401`.
- Если приложение открыто в обычном браузере, `initData` нет: включается демо-режим, сервер не вызывается.

Опционально: в BotFather можно создать именованное Mini App (`/newapp`) и получить прямую ссылку `https://t.me/<bot>/<app>`. Для работы кнопки из этого проекта это не обязательно.

## 6. Финальное уведомление

Когда игрок отправляет конверт, `game-api`:

1. Проверяет `initData` и сохраняет ответ в `final_responses` со статусом `pending`.
2. Отправляет владельцу сообщение через `sendMessage` с HTML-экранированием.
3. Если Telegram ответил успешно, обновляет строку на `delivery = 'telegram'` и сохраняет `telegram_message_id`.
4. Если отправка не удалась, оставляет `pending` и возвращает клиенту `notified: false`. Интерфейс показывает «ответ сохранён · уведомление в пути».

В сообщении: тип ответа, дата, время, сообщение, сценарий, имя/username, Telegram ID, ID сессии, краткая статистика прогресса. Сообщение ограничено по длине.

Повторная отправка конверта обновляет ту же строку (`session_id` уникален), а не создаёт дубликат.

## 7. Команды бота

| Команда | Действие |
|---|---|
| `/start` | Приветствие и кнопка Mini App |
| `/id` | Telegram ID и Chat ID |
| `/help` | Список команд |
| любой другой текст | Подсказка открыть `/start` |

Webhook принимает только личные сообщения и только обновления типа `message`. Остальные обновления подтверждает и игнорирует, чтобы Telegram не повторял доставку.

## 8. Проверка в Telegram

1. Откройте бота, отправьте `/start`.
2. Нажмите кнопку. Приложение должно открыться внутри Telegram.
3. Пройдите пару шагов. В Supabase появится строка в `sessions` и `user_progress`.
4. Закройте Mini App и откройте снова: должен восстановиться последний экран.
5. Дойдите до конверта и отправьте тестовый ответ.
6. Проверьте сообщение от бота и строку в `final_responses`.

Для быстрой проверки только финала можно временно заполнить прогресс вручную или пройти сюжет с начала. Скрытые условия комнаты 01:03 требуют все четыре улики, секрет Михалыча и печать/красную папку.

## 9. Проблемы

### Webhook возвращает 403

`TELEGRAM_WEBHOOK_SECRET` в Supabase и секрет, с которым зарегистрирован webhook, различаются. Задайте один и тот же секрет в обоих местах и снова запустите `scripts/setup-telegram.mjs`.

### `401 Telegram signature mismatch`

- Неверный `TELEGRAM_BOT_TOKEN` в секретах Supabase.
- `initData` устарел: проверьте `INITDATA_MAX_AGE_SECONDS` и переоткройте Mini App.
- Запрос идёт не от того бота.

Токен в Supabase должен быть от того же бота, чей username открывает приложение.

### `initData` пустой

- Приложение открыто не через Telegram, а в браузере. Это демо-режим.
- Открыта старая вкладка после обновления страницы вне Telegram.

### Кнопка Mini App не появляется

- `MINI_APP_URL` пустой или не HTTPS.
- Webhook не зарегистрирован.
- Клиент Telegram старый. Обновите приложение.

### Уведомление не приходит

- Владелец не отправил `/start` боту.
- Неверный `TELEGRAM_OWNER_CHAT_ID`.
- Бот заблокирован получателем.
- В логах `supabase functions logs game-api` есть ошибка `sendMessage`.

Ответ при этом не теряется: он уже сохранён. Статус можно проверить:

```sql
select delivery, telegram_message_id, created_at
from final_responses
order by created_at desc;
```

### Telegram повторяет обновления

Смотрите `pending_update_count` и `last_error_message` в `getWebhookInfo`. Если функция падает, Telegram будет повторять доставку. Проверьте логи:

```bash
supabase functions logs telegram-webhook
```

### Нужно сменить домен

1. Задеплойте фронтенд на новый домен.
2. Обновите `MINI_APP_URL` в Supabase secrets.
3. Обновите `MINI_APP_URL` в `.env.setup`.
4. Запустите `scripts/setup-telegram.mjs` снова.

## 10. Безопасность

- Токен бота и service-role key — только в секретах Supabase. Никогда не во фронтенде.
- Если токен утёк: BotFather → `/revoke` → получить новый токен → обновить `TELEGRAM_BOT_TOKEN` в Supabase и перерегистрировать webhook.
- `TELEGRAM_ALLOWED_USER_IDS` ограничивает круг людей, которые могут открыть приложение. Для личного подарка это разумно: добавьте Telegram ID игрока и свой.
- Не публикуйте ссылку на бота в открытых каналах, если не хотите посторонних прохождений.
- Подробнее: [SECURITY.md](SECURITY.md).
