import { json } from '../_shared/http.ts'
import { escapeHtml, secureCompare } from '../_shared/telegram.ts'

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: { id: number; type: string; first_name?: string; username?: string }
  text?: string
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

const WEBHOOK_SECRET_HEADER = 'X-Telegram-Bot-Api-Secret-Token'

function miniAppUrl(): string | null {
  const raw = Deno.env.get('MINI_APP_URL')?.trim()
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

function startText(name: string): string {
  return [
    `Привет, ${name}.`,
    '',
    'Это архив дела <b>№0103</b>. Внутри — исчезнувший вечер, четыре улики, голубь с характером и один конверт.',
    '',
    'Расследование займёт минут двадцать. Можно проходить не спеша: прогресс сохраняется.',
    '',
    'Нажми кнопку ниже, когда будешь готова.',
  ].join('\n')
}

async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  keyboard?: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(keyboard ? { reply_markup: keyboard } : {}),
    }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => 'unknown error')
    console.error('telegram-webhook sendMessage failed', response.status, detail.slice(0, 300))
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ ok: false }, 405)
  }

  const expected = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')?.trim()
  if (!expected) {
    console.error('TELEGRAM_WEBHOOK_SECRET is not configured; refusing the webhook request')
    return json({ ok: false }, 500)
  }
  const provided = request.headers.get(WEBHOOK_SECRET_HEADER) ?? ''
  if (!provided || !secureCompare(provided, expected)) {
    return json({ ok: false }, 403)
  }

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is not configured')
    return json({ ok: false }, 500)
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return json({ ok: true })
  }

  const message = update.message
  if (!message?.text || message.chat.type !== 'private') {
    return json({ ok: true })
  }

  const text = message.text.trim()
  const command = text.split(/\s+/)[0]?.split('@')[0]?.toLowerCase() ?? ''
  const name = escapeHtml(message.from?.first_name || message.chat.first_name || 'друг')
  const url = miniAppUrl()

  try {
    if (command === '/start') {
      if (url) {
        await sendMessage(token, message.chat.id, startText(name), {
          inline_keyboard: [
            [
              {
                text: '🗂 Открыть дело №0103',
                web_app: { url },
              },
            ],
          ],
        })
      } else {
        await sendMessage(
          token,
          message.chat.id,
          `${startText(name)}\n\n<i>Мини-приложение ещё не подключено. Владельцу бота нужно задать секрет MINI_APP_URL.</i>`,
        )
      }
      return json({ ok: true })
    }

    if (command === '/id') {
      await sendMessage(
        token,
        message.chat.id,
        [
          '<b>Служебная информация</b>',
          '',
          `Твой Telegram ID: <code>${message.from?.id ?? message.chat.id}</code>`,
          `Chat ID этого диалога: <code>${message.chat.id}</code>`,
          '',
          'Chat ID нужен владельцу бота, чтобы получать уведомления о финальном ответе.',
        ].join('\n'),
      )
      return json({ ok: true })
    }

    if (command === '/help') {
      await sendMessage(
        token,
        message.chat.id,
        ['Доступные команды:', '', '/start — открыть дело №0103', '/id — показать Telegram ID', '/help — эта справка'].join(
          '\n',
        ),
      )
      return json({ ok: true })
    }

    await sendMessage(token, message.chat.id, 'Я понимаю только /start, /id и /help. Всё остальное — внутри дела №0103.')
    return json({ ok: true })
  } catch (error) {
    console.error('telegram-webhook failed to process update', error)
    // Always acknowledge Telegram updates; a 5xx would trigger endless retries.
    return json({ ok: true })
  }
})
