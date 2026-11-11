const encoder = new TextEncoder()

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export interface VerifiedInitData {
  user: TelegramUser
  authDate: number
  initDataHash: string
}

export class TelegramAuthError extends Error {
  status = 401

  constructor(message: string) {
    super(message)
    this.name = 'TelegramAuthError'
  }
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSha256(key: Uint8Array | string, data: string): Promise<ArrayBuffer> {
  const rawKey = typeof key === 'string' ? encoder.encode(key) : key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
}

async function sha256(data: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', encoder.encode(data))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return mismatch === 0
}

/** Constant-time comparison for webhook secrets and other short tokens. */
export function secureCompare(a: string, b: string): boolean {
  return timingSafeEqual(a, b)
}

/**
 * Verifies Telegram Mini App initData using the algorithm from
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export async function verifyInitData(initData: string): Promise<VerifiedInitData> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!botToken) throw new TelegramAuthError('Telegram bot token is not configured')
  if (!initData || initData.length > 8192) throw new TelegramAuthError('Missing Telegram initData')

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
    throw new TelegramAuthError('Invalid Telegram signature')
  }

  params.delete('hash')
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = new Uint8Array(await hmacSha256('WebAppData', botToken))
  const computed = toHex(await hmacSha256(secretKey, dataCheckString))
  if (!timingSafeEqual(computed, hash.toLowerCase())) {
    throw new TelegramAuthError('Telegram signature mismatch')
  }

  const authDate = Number(params.get('auth_date'))
  const maxAge = Number(Deno.env.get('INITDATA_MAX_AGE_SECONDS') ?? 86400)
  if (!Number.isFinite(authDate) || authDate <= 0) {
    throw new TelegramAuthError('Missing Telegram auth date')
  }
  const age = Math.floor(Date.now() / 1000) - authDate
  if (age > maxAge) throw new TelegramAuthError('Telegram session expired, reopen the Mini App')
  if (age < -300) throw new TelegramAuthError('Telegram auth date is in the future')

  let user: TelegramUser
  try {
    user = JSON.parse(params.get('user') ?? '') as TelegramUser
  } catch {
    throw new TelegramAuthError('Telegram user payload is invalid')
  }

  if (!user || typeof user.id !== 'number' || !Number.isSafeInteger(user.id) || typeof user.first_name !== 'string') {
    throw new TelegramAuthError('Telegram user payload is incomplete')
  }

  const initDataHash = toHex(await sha256(initData))
  return { user, authDate, initDataHash }
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
