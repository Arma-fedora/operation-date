import { PublicError } from './http.ts'

type UnknownRecord = Record<string, unknown>

export const SCREEN_IDS = [
  'boot',
  'incident',
  'interrogation',
  'evidence',
  'mikhaylych',
  'trials',
  'planner',
  'archive',
  'radio',
  'secret',
  'final',
  'epilogue',
] as const

const PUZZLE_IDS = ['chronology', 'photo', 'cipher', 'menu'] as const

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value
}

function boundedString(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return clip(trimmed, max)
}

function boundedInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

function boundedNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function stringArray(value: unknown, maxItems: number, maxLength = 80): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))]
    .slice(0, maxItems)
    .map((item) => clip(item, maxLength))
}

function validIsoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const parsed = new Date(`${value}T12:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return undefined
  return value
}

function validIsoTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return undefined
  return value
}

function validTimestamp(value: unknown): string {
  if (typeof value === 'string' && value.length <= 40) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }
  return new Date().toISOString()
}

export function sanitizeState(input: unknown): Record<string, unknown> {
  if (!isRecord(input)) throw new PublicError('Invalid progress payload')
  let serialized = ''
  try {
    serialized = JSON.stringify(input)
  } catch {
    throw new PublicError('Progress payload is not serializable')
  }
  if (serialized.length > 140_000) throw new PublicError('Progress payload is too large')

  const raw = input
  const currentScreen = SCREEN_IDS.includes(raw.currentScreen as (typeof SCREEN_IDS)[number])
    ? (raw.currentScreen as string)
    : 'boot'
  const completed = stringArray(raw.completed, SCREEN_IDS.length).filter((screen) =>
    SCREEN_IDS.includes(screen as (typeof SCREEN_IDS)[number]),
  )

  const flags: Record<string, string | number | boolean> = {}
  if (isRecord(raw.flags)) {
    Object.entries(raw.flags)
      .slice(0, 80)
      .forEach(([key, value]) => {
        if (typeof value === 'boolean') flags[clip(key, 60)] = value
        else if (typeof value === 'number' && Number.isFinite(value)) flags[clip(key, 60)] = value
        else if (typeof value === 'string') flags[clip(key, 60)] = clip(value, 200)
      })
  }

  const rawPuzzles = isRecord(raw.puzzles) ? raw.puzzles : {}
  const puzzles = Object.fromEntries(
    PUZZLE_IDS.map((id) => {
      const item = isRecord(rawPuzzles[id]) ? (rawPuzzles[id] as UnknownRecord) : {}
      const solvedAt = typeof item.solvedAt === 'string' ? validTimestamp(item.solvedAt) : undefined
      return [
        id,
        {
          solved: Boolean(item.solved),
          attempts: boundedInt(item.attempts, 0, 10_000, 0),
          hintsUsed: boundedInt(item.hintsUsed, 0, 3, 0),
          assisted: Boolean(item.assisted),
          ...(solvedAt ? { solvedAt } : {}),
        },
      ]
    }),
  )

  const rawTrials = isRecord(raw.trials) ? raw.trials : {}
  const trials = {
    reactionBest: boundedInt(rawTrials.reactionBest, 0, 60_000, 0),
    reactionRuns: boundedInt(rawTrials.reactionRuns, 0, 10_000, 0),
    reactionDone: Boolean(rawTrials.reactionDone),
    ...(boundedString(rawTrials.quizResult, 80) ? { quizResult: boundedString(rawTrials.quizResult, 80) } : {}),
    quizDone: Boolean(rawTrials.quizDone),
    ...(boundedString(rawTrials.wheelResult, 80) ? { wheelResult: boundedString(rawTrials.wheelResult, 80) } : {}),
    wheelDone: Boolean(rawTrials.wheelDone),
  }

  const rawPlanner = isRecord(raw.planner) ? raw.planner : {}
  const planner = {
    selectedStops: stringArray(rawPlanner.selectedStops, 12),
    orderedStops: stringArray(rawPlanner.orderedStops, 12),
    ...(boundedString(rawPlanner.scenario, 80) ? { scenario: boundedString(rawPlanner.scenario, 80) } : {}),
    routeBuilt: Boolean(rawPlanner.routeBuilt),
  }

  const rawAudio = isRecord(raw.audio) ? raw.audio : {}
  const audio = {
    muted: Boolean(rawAudio.muted),
    volume: boundedNumber(rawAudio.volume, 0, 1, 0.32),
    enabled: Boolean(rawAudio.enabled),
  }

  return {
    version: 1,
    currentScreen,
    completed: [...new Set(completed)],
    flags,
    evidence: stringArray(raw.evidence, 40),
    puzzles,
    secrets: stringArray(raw.secrets, 60),
    trials,
    planner,
    ...(boundedString(raw.secretChoice, 80) ? { secretChoice: boundedString(raw.secretChoice, 80) } : {}),
    audio,
    updatedAt: validTimestamp(raw.updatedAt),
  }
}

export function normalizeFinalType(value: unknown): 'yes' | 'other_date' | 'discuss' {
  if (value === 'yes' || value === 'other_date' || value === 'discuss') return value
  throw new PublicError('Unknown final response type')
}

export function normalizeMessage(value: unknown, required: boolean): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) throw new PublicError('A message is required for this response')
    return null
  }
  if (typeof value !== 'string') throw new PublicError('Message must be text')
  const trimmed = value.trim()
  if (!trimmed) {
    if (required) throw new PublicError('A message is required for this response')
    return null
  }
  if (trimmed.length > 1000) throw new PublicError('Message is too long (max 1000 characters)')
  if (required && trimmed.length < 3) throw new PublicError('Message is too short')
  return trimmed
}

export function normalizePreferredDate(value: unknown, required: boolean): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) throw new PublicError('Choose a date for this response')
    return null
  }
  const date = validIsoDate(value)
  if (!date) throw new PublicError('Date must be in YYYY-MM-DD format')

  const chosen = new Date(`${date}T12:00:00.000Z`)
  const now = Date.now()
  const min = now - 36 * 60 * 60 * 1000
  const max = now + 400 * 24 * 60 * 60 * 1000
  if (chosen.getTime() < min) throw new PublicError('That date is already in the past')
  if (chosen.getTime() > max) throw new PublicError('That date is too far away')
  return date
}

export function normalizePreferredTime(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  const time = validIsoTime(value)
  if (!time) throw new PublicError('Time must be in HH:MM format')
  return time
}

export function normalizeScenario(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') throw new PublicError('Invalid scenario')
  return clip(value.trim(), 80) || null
}

export function trySanitizeSnapshot(value: unknown): Record<string, unknown> | null {
  try {
    return sanitizeState(value)
  } catch {
    return null
  }
}
