#!/usr/bin/env node
/**
 * Registers the Telegram webhook and the Mini App menu button.
 *
 * Required environment:
 *   TELEGRAM_BOT_TOKEN       — token from @BotFather
 *   MINI_APP_URL             — public HTTPS URL of the deployed app
 *   TELEGRAM_WEBHOOK_URL     — https://<project-ref>.supabase.co/functions/v1/telegram-webhook
 *
 * Optional:
 *   TELEGRAM_WEBHOOK_SECRET  — generated and printed when omitted
 *
 * Run:
 *   node --env-file=.env.setup scripts/setup-telegram.mjs
 */
import { randomBytes } from 'node:crypto'

const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
const miniAppUrl = process.env.MINI_APP_URL?.trim()
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL?.trim()
const providedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()

function fail(message) {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

if (!token || !/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) fail('TELEGRAM_BOT_TOKEN is missing or malformed')
if (!miniAppUrl) fail('MINI_APP_URL is missing (for example https://operation-date.netlify.app)')
if (!webhookUrl) fail('TELEGRAM_WEBHOOK_URL is missing (https://<ref>.supabase.co/functions/v1/telegram-webhook)')

for (const [name, value] of [
  ['MINI_APP_URL', miniAppUrl],
  ['TELEGRAM_WEBHOOK_URL', webhookUrl],
]) {
  let url
  try {
    url = new URL(value)
  } catch {
    fail(`${name} is not a valid URL`)
  }
  if (url.protocol !== 'https:') fail(`${name} must use HTTPS — Telegram rejects plain HTTP`)
}

const secret = providedSecret || randomBytes(32).toString('base64url')

async function request(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) {
    throw new Error(`${method} failed: ${payload?.description ?? response.statusText}`)
  }
  return payload.result
}

async function call(method, body) {
  try {
    return await request(method, body)
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }
}

const me = await call('getMe', {})
console.log(`\nБот: @${me.username} (${me.first_name})`)

await call('setWebhook', {
  url: webhookUrl,
  secret_token: secret,
  allowed_updates: ['message'],
  drop_pending_updates: false,
})

await call('setMyCommands', {
  commands: [
    { command: 'start', description: 'Открыть дело №0103' },
    { command: 'id', description: 'Показать Telegram ID' },
    { command: 'help', description: 'Справка' },
  ],
})

try {
  await request('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Дело №0103',
      web_app: { url: miniAppUrl },
    },
  })
  console.log('Кнопка меню Mini App установлена.')
} catch (error) {
  console.warn(
    `Не удалось установить кнопку меню — это не критично, /start продолжит работать. ${error instanceof Error ? error.message : ''}`,
  )
}

const info = await call('getWebhookInfo', {})
console.log(`Webhook: ${info.url}`)
console.log(`Ожидает обновлений: ${info.pending_update_count ?? 0}`)
if (info.last_error_message) console.log(`Последняя ошибка: ${info.last_error_message}`)

console.log('\nСохраните секрет в Supabase, если он был сгенерирован:')
console.log(`  supabase secrets set TELEGRAM_WEBHOOK_SECRET=${secret}`)
console.log('\nЕсли секрет уже задан в Supabase и совпадает с TELEGRAM_WEBHOOK_SECRET, ничего делать не нужно.')
console.log('\nВладельцу бота нужно отправить /start и /id, чтобы узнать TELEGRAM_OWNER_CHAT_ID.\n')
