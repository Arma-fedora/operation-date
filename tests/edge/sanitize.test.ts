import { describe, expect, it } from 'vitest'
import {
  normalizeFinalType,
  normalizeMessage,
  normalizePreferredDate,
  normalizePreferredTime,
  normalizeScenario,
  sanitizeState,
  trySanitizeSnapshot,
} from '../../supabase/functions/_shared/sanitize'

const futureDate = (days: number) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

describe('sanitizeState', () => {
  it('fills defaults for an empty snapshot', () => {
    const state = sanitizeState({}) as Record<string, any>

    expect(state.version).toBe(1)
    expect(state.currentScreen).toBe('boot')
    expect(state.completed).toEqual([])
    expect(state.evidence).toEqual([])
    expect(state.secrets).toEqual([])
    expect(state.puzzles.chronology).toMatchObject({ solved: false, attempts: 0, hintsUsed: 0 })
    expect(state.puzzles.photo).toBeDefined()
    expect(state.puzzles.cipher).toBeDefined()
    expect(state.puzzles.menu).toBeDefined()
    expect(state.trials.reactionBest).toBe(0)
    expect(state.planner.orderedStops).toEqual([])
    expect(state.audio.volume).toBe(0.32)
    expect(Number.isNaN(Date.parse(state.updatedAt))).toBe(false)
  })

  it('rejects non-object payloads and non-serializable data', () => {
    expect(() => sanitizeState(null)).toThrow()
    expect(() => sanitizeState([])).toThrow()

    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(() => sanitizeState(cyclic)).toThrow()
  })

  it('rejects oversized snapshots', () => {
    expect(() => sanitizeState({ evidence: ['x'.repeat(150_000)] })).toThrow()
  })

  it('filters unknown screens and deduplicates completion', () => {
    const state = sanitizeState({
      currentScreen: 'hacked',
      completed: ['incident', 'incident', 'nope', 'evidence'],
    }) as Record<string, any>

    expect(state.currentScreen).toBe('boot')
    expect(state.completed).toEqual(['incident', 'evidence'])
  })

  it('bounds puzzles, trials, planner and audio', () => {
    const state = sanitizeState({
      puzzles: {
        cipher: {
          solved: true,
          attempts: 2.9,
          hintsUsed: 9,
          assisted: true,
          solvedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      trials: { reactionBest: 999_999, reactionRuns: -4, quizResult: '  agent  ', wheelDone: true },
      planner: { selectedStops: ['a', 'a', 'b', 3], orderedStops: ['b', 'a'], routeBuilt: true },
      audio: { volume: 5, muted: 0, enabled: true },
    }) as Record<string, any>

    expect(state.puzzles.cipher).toMatchObject({
      solved: true,
      attempts: 2,
      hintsUsed: 3,
      assisted: true,
    })
    expect(state.trials.reactionBest).toBe(60_000)
    expect(state.trials.reactionRuns).toBe(0)
    expect(state.trials.quizResult).toBe('agent')
    expect(state.planner.selectedStops).toEqual(['a', 'b'])
    expect(state.planner.routeBuilt).toBe(true)
    expect(state.audio.volume).toBe(1)
    expect(state.audio.muted).toBe(false)
  })

  it('clips long strings and keeps only bounded flags', () => {
    const state = sanitizeState({
      flags: { a: true, b: 4, c: 'ok', d: { nested: true } },
      secretChoice: 'x'.repeat(120),
      evidence: ['e'.repeat(120)],
    }) as Record<string, any>

    expect(state.flags).toEqual({ a: true, b: 4, c: 'ok' })
    expect(state.secretChoice).toHaveLength(80)
    expect(state.evidence[0]).toHaveLength(80)
  })
})

describe('final response normalizers', () => {
  it('accepts only known response types', () => {
    expect(normalizeFinalType('yes')).toBe('yes')
    expect(normalizeFinalType('other_date')).toBe('other_date')
    expect(normalizeFinalType('discuss')).toBe('discuss')
    expect(() => normalizeFinalType('maybe')).toThrow()
  })

  it('validates messages', () => {
    expect(normalizeMessage('  привет  ', false)).toBe('привет')
    expect(normalizeMessage('', false)).toBeNull()
    expect(normalizeMessage(undefined, false)).toBeNull()
    expect(() => normalizeMessage('', true)).toThrow()
    expect(() => normalizeMessage('ok', true)).toThrow()
    expect(() => normalizeMessage('x'.repeat(1001), false)).toThrow()
  })

  it('validates preferred dates', () => {
    expect(normalizePreferredDate(futureDate(7), true)).toBe(futureDate(7))
    expect(normalizePreferredDate('', false)).toBeNull()
    expect(() => normalizePreferredDate('2020-01-01', true)).toThrow()
    expect(() => normalizePreferredDate(futureDate(500), false)).toThrow()
    expect(() => normalizePreferredDate('11.11.2026', false)).toThrow()
    expect(() => normalizePreferredDate('', true)).toThrow()
  })

  it('validates preferred time and scenario', () => {
    expect(normalizePreferredTime('19:30')).toBe('19:30')
    expect(normalizePreferredTime('')).toBeNull()
    expect(() => normalizePreferredTime('25:00')).toThrow()
    expect(normalizeScenario('  quiet  ')).toBe('quiet')
    expect(normalizeScenario(undefined)).toBeNull()
    expect(() => normalizeScenario(42)).toThrow()
  })

  it('returns null for invalid snapshots in the safe helper', () => {
    expect(trySanitizeSnapshot(null)).toBeNull()
    expect(trySanitizeSnapshot({ currentScreen: 'incident' })).toMatchObject({
      currentScreen: 'incident',
    })
  })
})
