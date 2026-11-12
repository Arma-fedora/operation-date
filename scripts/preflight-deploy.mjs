#!/usr/bin/env node
/**
 * Checks that the repository and local environment are ready for a real deploy.
 * Reads `.env.local` and `supabase/.env.functions` when present; never prints secret values.
 *
 * Run:
 *   npm run preflight
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const envFiles = ['.env.local', 'supabase/.env.functions']
const fileEnv = {}

for (const file of envFiles) {
  const path = resolve(root, file)
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 0) continue
    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    fileEnv[key] = value
  }
}

const env = { ...fileEnv, ...process.env }
const errors = []
const warnings = []
const checks = []

function value(name) {
  return env[name]?.trim() ?? ''
}

function ok(message) {
  checks.push(`✔ ${message}`)
}

function fail(message) {
  errors.push(`✖ ${message}`)
}

function warn(message) {
  warnings.push(`⚠ ${message}`)
}

function requireValue(name) {
  const current = value(name)
  if (current) {
    ok(`${name} задан`)
    return current
  }
  fail(`${name} не задан`)
  return ''
}

/**
 * Secrets for Edge Functions live in Supabase, not in the repo.
 * Local values are optional: when present we validate their shape.
 */
function optionalSecret(name) {
  const current = value(name)
  if (current) {
    ok(`${name} задан локально`)
    return current
  }
  warn(`${name} не задан локально — проверьте его в секретах Supabase (supabase secrets list)`)
  return ''
}

const supabaseUrl = requireValue('VITE_SUPABASE_URL')
const anonKey = requireValue('VITE_SUPABASE_ANON_KEY')
const botToken = optionalSecret('TELEGRAM_BOT_TOKEN')
const ownerChatId = optionalSecret('TELEGRAM_OWNER_CHAT_ID')
const webhookSecret = optionalSecret('TELEGRAM_WEBHOOK_SECRET')
const miniAppUrl = optionalSecret('MINI_APP_URL')

if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl)
    if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')) {
      ok('VITE_SUPABASE_URL похож на Supabase project URL')
    } else {
      fail('VITE_SUPABASE_URL должен быть https://<ref>.supabase.co')
    }
  } catch {
    fail('VITE_SUPABASE_URL не является корректным URL')
  }
}

if (anonKey && anonKey.length < 40) fail('VITE_SUPABASE_ANON_KEY выглядит слишком коротким')
else if (anonKey) ok('VITE_SUPABASE_ANON_KEY заполнен')

if (botToken && !/^\d+:[A-Za-z0-9_-]{20,}$/.test(botToken)) {
  fail('TELEGRAM_BOT_TOKEN не похож на токен BotFather')
} else if (botToken) {
  ok('TELEGRAM_BOT_TOKEN имеет ожидаемый формат')
}

if (ownerChatId && !/^-?\d+$/.test(ownerChatId)) fail('TELEGRAM_OWNER_CHAT_ID должен быть числом')
else if (ownerChatId) ok('TELEGRAM_OWNER_CHAT_ID имеет ожидаемый формат')

if (webhookSecret && webhookSecret.length < 16) fail('TELEGRAM_WEBHOOK_SECRET слишком короткий')
else if (webhookSecret) ok('TELEGRAM_WEBHOOK_SECRET заполнен')

if (miniAppUrl) {
  try {
    const parsed = new URL(miniAppUrl)
    if (parsed.protocol !== 'https:') fail('MINI_APP_URL должен использовать HTTPS')
    else ok('MINI_APP_URL использует HTTPS')
  } catch {
    fail('MINI_APP_URL не является корректным URL')
  }
}

if (value('VITE_DEMO_MODE').toLowerCase() === 'true') {
  fail('VITE_DEMO_MODE=true — фронтенд не будет отправлять ответы в Supabase')
} else {
  ok('VITE_DEMO_MODE не включён принудительно')
}

for (const [label, file] of [
  ['миграция', 'supabase/migrations/0001_init.sql'],
  ['game-api', 'supabase/functions/game-api/index.ts'],
  ['telegram-webhook', 'supabase/functions/telegram-webhook/index.ts'],
  ['Netlify SPA fallback', 'public/_redirects'],
  ['Netlify headers', 'public/_headers'],
  ['Telegram WebApp SDK', 'public/vendor/telegram-web-app.js'],
  ['пример секретов функций', 'supabase/.env.functions.example'],
]) {
  if (existsSync(resolve(root, file))) ok(`${label}: ${file}`)
  else fail(`не найден ${file}`)
}

const distIndex = resolve(root, 'dist/index.html')
if (!existsSync(distIndex)) {
  warn('dist/index.html не найден — выполните npm run build перед публикацией')
} else {
  ok('production build найден в dist/')
  const built = readFileSync(distIndex, 'utf8')
  if (built.includes('telegram.org/js/telegram-web-app.js')) {
    fail('dist/index.html грузит telegram.org — скрипт должен лежать в /vendor/')
  } else if (built.includes('/vendor/telegram-web-app.js')) {
    ok('dist/index.html использует локальный /vendor/telegram-web-app.js')
  }
  if (built.includes('fonts.googleapis.com') || built.includes('fonts.gstatic.com')) {
    fail('dist/index.html тянет Google Fonts — шрифты должны быть собраны локально')
  } else {
    ok('dist/index.html не обращается к внешним шрифтам')
  }
}

if (existsSync(resolve(root, 'dist/vendor/telegram-web-app.js'))) {
  ok('dist/vendor/telegram-web-app.js на месте')
} else {
  fail('нет dist/vendor/telegram-web-app.js — пересоберите проект')
}

const expectedMedia = [
  ['public/assets/custom/music', ['archive-hum', 'night-moscow', 'pigeon-chase', 'seal-wax', 'radio-0103']],
  ['public/assets/custom/sounds', [
    'ui-click',
    'ui-page',
    'puzzle-correct',
    'puzzle-wrong',
    'evidence-found',
    'secret-unlock',
    'envelope-open',
    'stamp-press',
    'pigeon-coo',
    'radio-click',
    'typewriter-tick',
    'answer-sent',
  ]],
  ['public/assets/custom/photos', ['case-photo', 'final-envelope', 'cipher-doc']],
  ['public/assets/custom/memes', ['meme-0103', 'pigeon']],
  ['public/assets/custom/characters/mikhaylych', ['portrait']],
]

for (const [dir, names] of expectedMedia) {
  const missing = names.filter(
    (name) => !existsSync(resolve(root, dir, `${name}.webp`)) && !existsSync(resolve(root, dir, `${name}.mp3`)),
  )
  if (missing.length === 0) ok(`${dir}: все файлы на месте`)
  else warn(`${dir}: не хватает ${missing.length} — ${missing.join(', ')}`)
}

for (const file of envFiles) {
  if (!existsSync(resolve(root, file))) warn(`${file} отсутствует (нужен только для реального деплоя)`)
}

console.log('\nПроверка готовности к деплою\n')
for (const line of checks) console.log(`  ${line}`)
for (const line of warnings) console.log(`  ${line}`)
for (const line of errors) console.log(`  ${line}`)

if (errors.length > 0) {
  console.log(`\nИтог: ${errors.length} ошибок, ${warnings.length} предупреждений. Деплой пока не готов.\n`)
  process.exit(1)
}

console.log(`\nИтог: проверки пройдены, предупреждений: ${warnings.length}. Можно деплоить.\n`)
