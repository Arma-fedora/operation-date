import { describe, expect, it } from 'vitest'
import {
  formatDistance,
  formatRuDate,
  haversineMeters,
  maxDateISO,
  minDateISO,
  toISODate,
  totalRouteMeters,
} from '../src/utils'

describe('distance helpers', () => {
  it('returns zero for an empty or single-point route', () => {
    expect(totalRouteMeters([])).toBe(0)
    expect(totalRouteMeters([[55.75, 37.61]])).toBe(0)
  })

  it('computes a known one-degree distance', () => {
    const distance = haversineMeters([0, 0], [0, 1])
    expect(distance).toBeGreaterThan(111_000)
    expect(distance).toBeLessThan(111_400)
  })

  it('sums consecutive segments only', () => {
    const a: [number, number] = [55.75, 37.61]
    const b: [number, number] = [55.76, 37.62]
    const c: [number, number] = [55.77, 37.63]
    expect(totalRouteMeters([a, b, c])).toBeCloseTo(haversineMeters(a, b) + haversineMeters(b, c), 5)
  })

  it('formats metres and kilometres', () => {
    expect(formatDistance(0)).toBe('0 м')
    expect(formatDistance(849)).toBe('849 м')
    expect(formatDistance(1234)).toBe('1.2 км')
    expect(formatDistance(32_100)).toBe('32.1 км')
  })
})

describe('date helpers', () => {
  it('formats ISO dates in Russian', () => {
    expect(formatRuDate('2026-11-11')).toContain('11 ноября 2026')
  })

  it('passes through invalid dates instead of producing NaN', () => {
    expect(formatRuDate('not-a-date')).toBe('not-a-date')
    expect(formatRuDate()).toBe('дата не выбрана')
  })

  it('round-trips a local date without UTC drift', () => {
    const date = new Date(2026, 0, 5, 12)
    expect(toISODate(date)).toBe('2026-01-05')
  })

  it('keeps the minimum date in the future and honours a one-year window', () => {
    const min = new Date(`${minDateISO()}T12:00:00`)
    const max = new Date(`${maxDateISO()}T12:00:00`)
    expect(min.getTime()).toBeGreaterThan(Date.now() - 24 * 60 * 60 * 1000)
    expect(max.getTime()).toBeGreaterThan(min.getTime())
  })
})
