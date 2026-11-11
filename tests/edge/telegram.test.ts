import { createHash, createHmac } from 'node:crypto'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  escapeHtml,
  secureCompare,
  TelegramAuthError,
  verifyInitData,
} from '../../supabase/functions/_shared/telegram'

const BOT_TOKEN = '123456:TEST_TOKEN'
let env: Record<string, string | undefined> = {}

vi.stubGlobal('Deno', {
  env: {
    get: (key: string) => env[key],
  },
})

function signInitData(params: Record<string, string>, token = BOT_TOKEN): string {
  const dataCheckString = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(token).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  return new URLSearchParams({ ...params, hash }).toString()
}

function baseParams(authDate = Math.floor(Date.now() / 1000)) {
  return {
    auth_date: String(authDate),
    user: JSON.stringify({ id: 123456789, first_name: 'Александра', username: 'alex' }),
  }
}

beforeEach(() => {
  env = { TELEGRAM_BOT_TOKEN: BOT_TOKEN }
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('verifyInitData', () => {
  it('accepts a correctly signed payload and hashes the raw initData', async () => {
    const authDate = Math.floor(Date.now() / 1000)
    const initData = signInitData(baseParams(authDate))
    const verified = await verifyInitData(initData)

    expect(verified.user.id).toBe(123456789)
    expect(verified.user.first_name).toBe('Александра')
    expect(verified.authDate).toBe(authDate)
    expect(verified.initDataHash).toBe(createHash('sha256').update(initData).digest('hex'))
  })

  it('rejects a tampered payload', async () => {
    const initData = signInitData(baseParams())
    const tampered = initData.replace('alex', 'evil')

    await expect(verifyInitData(tampered)).rejects.toBeInstanceOf(TelegramAuthError)
    await expect(verifyInitData(tampered)).rejects.toThrow(/signature mismatch/i)
  })

  it('rejects expired and future auth dates', async () => {
    env.INITDATA_MAX_AGE_SECONDS = '3600'
    const now = Math.floor(Date.now() / 1000)

    await expect(verifyInitData(signInitData(baseParams(now - 7200)))).rejects.toThrow(/expired/i)
    await expect(verifyInitData(signInitData(baseParams(now + 600)))).rejects.toThrow(/future/i)
  })

  it('rejects malformed hashes, missing users and missing tokens', async () => {
    await expect(
      verifyInitData(`auth_date=${Math.floor(Date.now() / 1000)}&user=x&hash=zzz`),
    ).rejects.toThrow(/invalid telegram signature/i)

    const withoutUser = signInitData({ auth_date: String(Math.floor(Date.now() / 1000)) })
    await expect(verifyInitData(withoutUser)).rejects.toThrow(/user payload is invalid/i)

    delete env.TELEGRAM_BOT_TOKEN
    await expect(verifyInitData(signInitData(baseParams()))).rejects.toThrow(/not configured/i)
  })

  it('rejects oversized initData', async () => {
    await expect(verifyInitData('x'.repeat(9000))).rejects.toThrow(/missing telegram initdata/i)
  })
})

describe('shared helpers', () => {
  it('compares secrets without early exit', () => {
    expect(secureCompare('same', 'same')).toBe(true)
    expect(secureCompare('same', 'samo')).toBe(false)
    expect(secureCompare('a', 'ab')).toBe(false)
  })

  it('escapes HTML for Telegram messages', () => {
    expect(escapeHtml('a & <b>')).toBe('a &amp; &lt;b&gt;')
  })
})
