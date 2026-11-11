import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState, useGameStore } from '../src/store/gameStore'
import type { FinalResponse } from '../src/types/game'

const reset = () => {
  useGameStore.getState().resetGame()
  useGameStore.setState({ ...createInitialState() })
}

const finalResponse = (submittedAt: string, type: FinalResponse['type'] = 'yes'): FinalResponse => ({
  type,
  submittedAt,
  delivery: 'demo',
})

describe('game store', () => {
  beforeEach(() => {
    localStorage.clear()
    reset()
  })

  it('records completed screens without duplicates', () => {
    useGameStore.getState().completeScreen('incident')
    useGameStore.getState().completeScreen('incident')
    expect(useGameStore.getState().completed).toEqual(['incident'])
  })

  it('deduplicates evidence and secrets', () => {
    useGameStore.getState().addEvidence('ev-chronology')
    useGameStore.getState().addEvidence('ev-chronology')
    useGameStore.getState().discoverSecret('pigeon')
    useGameStore.getState().discoverSecret('pigeon')
    expect(useGameStore.getState().evidence).toEqual(['ev-chronology'])
    expect(useGameStore.getState().secrets).toEqual(['pigeon'])
  })

  it('stamps puzzle completion once', async () => {
    useGameStore.getState().recordPuzzle('cipher', { solved: true, attempts: 2 })
    const first = useGameStore.getState().puzzles.cipher.solvedAt
    expect(first).toBeTruthy()

    await new Promise((resolve) => setTimeout(resolve, 5))
    useGameStore.getState().recordPuzzle('cipher', { solved: true, attempts: 3 })
    const state = useGameStore.getState()
    expect(state.puzzles.cipher.solvedAt).toBe(first)
    expect(state.puzzles.cipher.attempts).toBe(3)
  })

  it('marks the final screen when a final answer is saved', () => {
    useGameStore.getState().setFinalResponse(finalResponse('2026-11-11T10:00:00.000Z'))
    const state = useGameStore.getState()
    expect(state.completed).toContain('final')
    expect(state.finalResponse?.type).toBe('yes')
  })

  it('hydrates newer remote progress', () => {
    useGameStore.getState().hydrate({
      completed: ['incident', 'interrogation'],
      evidence: ['ev-chronology'],
      updatedAt: '2030-01-01T00:00:00.000Z',
    })
    const state = useGameStore.getState()
    expect(state.completed).toContain('interrogation')
    expect(state.evidence).toEqual(['ev-chronology'])
  })

  it('does not replace newer local progress with older remote data', () => {
    useGameStore.getState().completeScreen('incident')
    const localUpdatedAt = useGameStore.getState().updatedAt
    useGameStore.getState().hydrate({
      completed: [],
      updatedAt: '2000-01-01T00:00:00.000Z',
    })
    expect(useGameStore.getState().completed).toEqual(['incident'])
    expect(useGameStore.getState().updatedAt).toBe(localUpdatedAt)
  })

  it('restores a final answer even when no progress snapshot exists', () => {
    useGameStore.getState().hydrate({
      finalResponse: finalResponse('2026-12-01T12:00:00.000Z', 'discuss'),
    })
    const state = useGameStore.getState()
    expect(state.finalResponse?.type).toBe('discuss')
    expect(state.completed).toContain('final')
  })

  it('prefers the newer of two final answers', () => {
    useGameStore.getState().setFinalResponse(finalResponse('2026-12-01T12:00:00.000Z'))
    useGameStore.getState().hydrate({
      finalResponse: finalResponse('2026-12-02T12:00:00.000Z', 'other_date'),
    })
    expect(useGameStore.getState().finalResponse?.type).toBe('other_date')
  })

  it('keeps audio preferences through a reset', () => {
    useGameStore.getState().setAudio({ volume: 0.6, muted: true })
    useGameStore.getState().resetGame()
    const state = useGameStore.getState()
    expect(state.audio.volume).toBe(0.6)
    expect(state.audio.muted).toBe(true)
    expect(state.completed).toEqual([])
  })

  it('tracks planner and trials as given', () => {
    useGameStore.getState().setPlanner({ scenario: 'quiet', orderedStops: ['a', 'b'], routeBuilt: true })
    useGameStore.getState().setTrialResult({ reactionDone: true, reactionBest: 412 })
    const state = useGameStore.getState()
    expect(state.planner.routeBuilt).toBe(true)
    expect(state.planner.orderedStops).toEqual(['a', 'b'])
    expect(state.trials.reactionDone).toBe(true)
    expect(state.trials.reactionBest).toBe(412)
  })
})
