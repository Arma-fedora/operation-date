import { PublicError, json, fail } from '../_shared/http.ts'
import { escapeHtml, verifyInitData, type VerifiedInitData } from '../_shared/telegram.ts'
import { admin, getOrCreateSession, type SessionRow } from '../_shared/supabase.ts'
import {
  normalizeFinalType,
  normalizeMessage,
  normalizePreferredDate,
  normalizePreferredTime,
  normalizeScenario,
  sanitizeState,
  trySanitizeSnapshot,
} from '../_shared/sanitize.ts'

interface ActionBody {
  action?: unknown
  initData?: unknown
  payload?: unknown
}

interface FinalRow {
  id: string
  response_type: 'yes' | 'other_date' | 'discuss'
  preferred_date: string | null
  preferred_time: string | null
  message: string | null
  scenario: string | null
  delivery: 'telegram' | 'pending' | 'demo'
  updated_at: string
}

interface RequestContext {
  session: SessionRow
  auth: VerifiedInitData
  payload: Record<string, unknown>
}

const FINAL_LABELS: Record<string, string> = {
  yes: 'Да, давай',
  other_date: 'Предложить другую дату',
  discuss: 'Обсудить',
}

function optionalAllowlist(): Set<number> | null {
  const raw = Deno.env.get('TELEGRAM_ALLOWED_USER_IDS')?.trim()
  if (!raw) return null
  const ids = raw
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((id) => Number.isSafeInteger(id) && id > 0)
  return ids.length ? new Set(ids) : null
}

function ensureAllowed(telegramUserId: number): void {
  const allowed = optionalAllowlist()
  if (allowed && !allowed.has(telegramUserId)) {
    throw new PublicError('Этот архив открыт только для приглашённого гостя', 403)
  }
}

async function parseBody(request: Request): Promise<{ action: string; initData: string; payload: Record<string, unknown> }> {
  if (request.method !== 'POST') throw new PublicError('Only POST is supported', 405)
  let parsed: ActionBody
  try {
    parsed = (await request.json()) as ActionBody
  } catch {
    throw new PublicError('Request body must be JSON')
  }
  if (!parsed || typeof parsed !== 'object') throw new PublicError('Request body is invalid')
  if (typeof parsed.action !== 'string' || !parsed.action) throw new PublicError('Unknown action')
  if (typeof parsed.initData !== 'string' || !parsed.initData) {
    throw new PublicError('Open this archive from Telegram', 401)
  }
  const payload =
    parsed.payload && typeof parsed.payload === 'object' && !Array.isArray(parsed.payload)
      ? (parsed.payload as Record<string, unknown>)
      : {}
  return { action: parsed.action, initData: parsed.initData, payload }
}

async function openSession(initData: string): Promise<{ session: SessionRow; auth: VerifiedInitData }> {
  const auth = await verifyInitData(initData)
  ensureAllowed(auth.user.id)
  const session = await getOrCreateSession({
    telegramUserId: auth.user.id,
    username: auth.user.username,
    firstName: auth.user.first_name,
    lastName: auth.user.last_name,
    languageCode: auth.user.language_code,
    initDataHash: auth.initDataHash,
  })
  return { session, auth }
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function puzzleAttempts(puzzle: unknown): number {
  if (!puzzle || typeof puzzle !== 'object') return 0
  const value = (puzzle as Record<string, unknown>).attempts
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

function puzzleHints(puzzle: unknown): number {
  if (!puzzle || typeof puzzle !== 'object') return 0
  const value = (puzzle as Record<string, unknown>).hintsUsed
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(3, Math.max(0, Math.trunc(value))) : 0
}

async function saveMirrors(sessionId: string, state: Record<string, unknown>): Promise<void> {
  const rawPuzzles =
    state.puzzles && typeof state.puzzles === 'object' ? (state.puzzles as Record<string, unknown>) : {}
  const puzzleRows = ['chronology', 'photo', 'cipher', 'menu'].map((id) => {
    const item = rawPuzzles[id]
    const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    return {
      session_id: sessionId,
      puzzle_id: id,
      solved: Boolean(record.solved),
      attempts: puzzleAttempts(item),
      hints_used: puzzleHints(item),
      assisted: Boolean(record.assisted),
      solved_at: record.solved && typeof record.solvedAt === 'string' ? record.solvedAt : null,
    }
  })

  const puzzleResult = await admin
    .from('puzzle_results')
    .upsert(puzzleRows, { onConflict: 'session_id,puzzle_id' })
  if (puzzleResult.error) {
    throw new PublicError('Could not save puzzle results', 500)
  }

  const secrets = stringArray(state.secrets)
  if (secrets.length) {
    const secretResult = await admin
      .from('discovered_secrets')
      .upsert(
        secrets.map((secretId) => ({ session_id: sessionId, secret_id: secretId })),
        { onConflict: 'session_id,secret_id', ignoreDuplicates: true },
      )
    if (secretResult.error) {
      throw new PublicError('Could not save discovered secrets', 500)
    }
  }

  const planner =
    state.planner && typeof state.planner === 'object'
      ? (state.planner as Record<string, unknown>)
      : {}
  const preferences = {
    session_id: sessionId,
    scenario: typeof planner.scenario === 'string' ? planner.scenario : null,
    selected_stops: stringArray(planner.selectedStops),
    ordered_stops: stringArray(planner.orderedStops),
    route_built: Boolean(planner.routeBuilt),
  }
  const preferenceResult = await admin.from('date_preferences').upsert(preferences, { onConflict: 'session_id' })
  if (preferenceResult.error) {
    throw new PublicError('Could not save date preferences', 500)
  }
}

async function saveProgress(context: RequestContext): Promise<Response> {
  const rawState = context.payload.state
  if (!rawState || typeof rawState !== 'object') throw new PublicError('Missing progress payload')

  const state = sanitizeState(rawState)
  const clientVersion =
    typeof context.payload.clientVersion === 'string' ? context.payload.clientVersion.slice(0, 40) : null

  const progressResult = await admin.from('user_progress').upsert(
    {
      session_id: context.session.id,
      state,
      state_version: 1,
    },
    { onConflict: 'session_id' },
  )
  if (progressResult.error) {
    throw new PublicError('Could not save progress', 500)
  }

  const sessionResult = await admin
    .from('sessions')
    .update({
      current_screen: typeof state.currentScreen === 'string' ? state.currentScreen : null,
      completed_screens: stringArray(state.completed),
      client_version: clientVersion,
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', context.session.id)
  if (sessionResult.error) {
    throw new PublicError('Could not update the session', 500)
  }

  await saveMirrors(context.session.id, state)
  return json({ ok: true, savedAt: new Date().toISOString() })
}

async function buildBootstrapState(sessionId: string): Promise<Record<string, unknown> | null> {
  const [progressResult, finalResult] = await Promise.all([
    admin.from('user_progress').select('state').eq('session_id', sessionId).maybeSingle(),
    admin
      .from('final_responses')
      .select('id, response_type, preferred_date, preferred_time, message, scenario, delivery, updated_at')
      .eq('session_id', sessionId)
      .maybeSingle(),
  ])

  if (progressResult.error) throw new PublicError('Could not open saved progress', 500)
  if (finalResult.error) throw new PublicError('Could not open the final answer', 500)

  const stored =
    progressResult.data?.state && typeof progressResult.data.state === 'object'
      ? (progressResult.data.state as Record<string, unknown>)
      : null

  const final = finalResult.data as FinalRow | null

  if (!stored && !final) return null

  const state: Record<string, unknown> = stored ? { ...stored } : { version: 1 }
  if (final) {
    state.finalResponse = {
      type: final.response_type,
      ...(final.preferred_date ? { preferredDate: final.preferred_date } : {}),
      ...(final.preferred_time ? { preferredTime: String(final.preferred_time).slice(0, 5) } : {}),
      ...(final.message ? { message: final.message } : {}),
      submittedAt: final.updated_at,
      delivery: final.delivery,
      ...(final.scenario ? { scenario: final.scenario } : {}),
    }
  }
  return state
}

async function bootstrap(context: RequestContext): Promise<Response> {
  const state = await buildBootstrapState(context.session.id)
  await admin
    .from('sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', context.session.id)
  return json({ ok: true, state })
}

interface TelegramSendResult {
  message_id?: number
}

async function notifyOwner(input: {
  session: SessionRow
  auth: VerifiedInitData
  type: 'yes' | 'other_date' | 'discuss'
  preferredDate: string | null
  preferredTime: string | null
  message: string | null
  scenario: string | null
  snapshot: Record<string, unknown> | null
}): Promise<number | null> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_OWNER_CHAT_ID')
  if (!token || !chatId) {
    console.warn('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_OWNER_CHAT_ID is missing')
    return null
  }

  const user = input.auth.user
  const userName = [user.first_name, user.last_name].filter(Boolean).join(' ')
  const handle = user.username ? `@${user.username}` : `id ${user.id}`
  const snapshot = input.snapshot ?? {}
  const evidence = stringArray(snapshot.evidence).length
  const secrets = stringArray(snapshot.secrets).length
  const completed = stringArray(snapshot.completed).length
  const trials =
    snapshot.trials && typeof snapshot.trials === 'object'
      ? (snapshot.trials as Record<string, unknown>)
      : {}
  const reaction =
    typeof trials.reactionBest === 'number' && trials.reactionBest > 0
      ? `${trials.reactionBest} мс`
      : 'не проверялась'

  const lines = [
    '<b>📁 Дело №0103 — ответ получен</b>',
    '',
    `<b>Ответ:</b> ${escapeHtml(FINAL_LABELS[input.type] ?? input.type)}`,
    ...(input.preferredDate ? [`<b>Дата:</b> ${escapeHtml(input.preferredDate)}`] : []),
    ...(input.preferredTime ? [`<b>Время:</b> ${escapeHtml(input.preferredTime)}`] : []),
    ...(input.scenario ? [`<b>Сценарий:</b> ${escapeHtml(input.scenario)}`] : []),
    ...(input.message ? ['', `<b>Сообщение:</b>\n${escapeHtml(input.message)}`] : []),
    '',
    `<b>От:</b> ${escapeHtml(userName)} (${escapeHtml(handle)})`,
    `<b>Телеграм ID:</b> <code>${user.id}</code>`,
    `<b>Сессия:</b> <code>${input.session.id}</code>`,
    '',
    `<b>Прогресс:</b> ${completed} этапов · ${evidence} улик · ${secrets} секретов`,
    `<b>Реакция:</b> ${escapeHtml(reaction)}`,
  ]

  let text = lines.join('\n')
  if (text.length > 3900) text = `${text.slice(0, 3890)}…`

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    const result = (await response.json().catch(() => null)) as
      | { ok?: boolean; result?: TelegramSendResult; description?: string }
      | null
    if (!response.ok || !result?.ok) {
      console.error('Telegram sendMessage failed', response.status, result?.description ?? 'unknown error')
      return null
    }
    return result.result?.message_id ?? null
  } catch (error) {
    console.error('Telegram sendMessage request failed', error)
    return null
  }
}

async function submitFinal(context: RequestContext): Promise<Response> {
  const type = normalizeFinalType(context.payload.type)
  const requiredDate = type === 'other_date'
  const requiredMessage = type === 'discuss'
  const preferredDate = normalizePreferredDate(context.payload.preferredDate, requiredDate)
  const preferredTime = normalizePreferredTime(context.payload.preferredTime)
  const message = normalizeMessage(context.payload.message, requiredMessage)
  const scenario = normalizeScenario(context.payload.scenario)
  const snapshot = trySanitizeSnapshot(context.payload.progressSnapshot)

  // Persist first, notify second: a Telegram outage must never lose her answer.
  const finalResult = await admin
    .from('final_responses')
    .upsert(
      {
        session_id: context.session.id,
        response_type: type,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        message,
        scenario,
        delivery: 'pending',
        telegram_message_id: null,
        progress_snapshot: snapshot,
      },
      { onConflict: 'session_id' },
    )
    .select('id')
    .single()

  if (finalResult.error) {
    throw new PublicError('Could not save the final answer', 500)
  }

  const messageId = await notifyOwner({
    session: context.session,
    auth: context.auth,
    type,
    preferredDate,
    preferredTime,
    message,
    scenario,
    snapshot,
  })

  if (messageId) {
    const notifiedResult = await admin
      .from('final_responses')
      .update({ delivery: 'telegram', telegram_message_id: messageId })
      .eq('id', finalResult.data.id)
    if (notifiedResult.error) {
      console.error('Could not mark the final answer as delivered', notifiedResult.error)
    }
  }

  if (snapshot) {
    try {
      await admin.from('user_progress').upsert(
        { session_id: context.session.id, state: snapshot, state_version: 1 },
        { onConflict: 'session_id' },
      )
      await saveMirrors(context.session.id, snapshot)
    } catch (error) {
      console.error('Could not mirror the final progress snapshot', error)
    }
  }

  const completed = new Set<string>(['final'])
  if (snapshot) {
    stringArray(snapshot.completed).forEach((screen) => completed.add(screen))
  }
  await admin
    .from('sessions')
    .update({
      current_screen: 'final',
      completed_screens: [...completed],
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', context.session.id)

  return json({
    ok: true,
    delivery: 'telegram',
    notified: Boolean(messageId),
    responseId: finalResult.data.id,
    savedAt: new Date().toISOString(),
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true })
  try {
    const body = await parseBody(request)
    const { session, auth } = await openSession(body.initData)
    const context: RequestContext = { session, auth, payload: body.payload }

    switch (body.action) {
      case 'bootstrap':
        return await bootstrap(context)
      case 'save-progress':
        return await saveProgress(context)
      case 'submit-final':
        return await submitFinal(context)
      default:
        throw new PublicError('Unknown action')
    }
  } catch (error) {
    if (error instanceof PublicError) return fail(error.message, error.status)
    if (error instanceof Error && error.name === 'TelegramAuthError') return fail(error.message, 401)
    console.error('game-api failed', error)
    return fail('Архив временно недоступен. Попробуйте ещё раз.', 500)
  }
})
