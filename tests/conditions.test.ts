import { describe, expect, it } from 'vitest'
import { createInitialState } from '../src/store/gameStore'
import type { GameState, ScreenId } from '../src/types/game'
import {
  countSecrets,
  isScreenUnlocked,
  latestAvailableScreen,
  lockReason,
  progressPercent,
} from '../src/utils/conditions'

const stateWith = (patch: Partial<GameState>): GameState => ({ ...createInitialState(), ...patch })

describe('route conditions', () => {
  it('opens the first two screens immediately', () => {
    const state = createInitialState()
    expect(isScreenUnlocked('boot', state)).toBe(true)
    expect(isScreenUnlocked('incident', state)).toBe(true)
    expect(isScreenUnlocked('interrogation', state)).toBe(false)
  })

  it('unlocks screens sequentially', () => {
    const state = stateWith({ completed: ['boot', 'incident'] })
    expect(isScreenUnlocked('interrogation', state)).toBe(true)
    expect(isScreenUnlocked('evidence', state)).toBe(false)
  })

  it('opens archive and radio after the Mikhaylych channel', () => {
    const state = stateWith({ completed: ['mikhaylych'] })
    expect(isScreenUnlocked('archive', state)).toBe(true)
    expect(isScreenUnlocked('radio', state)).toBe(true)
    expect(isScreenUnlocked('trials', state)).toBe(true)
  })

  it('requires evidence, the Mikhaylych secret and a hidden stamp or red folder for the secret room', () => {
    const base = stateWith({
      completed: ['evidence'],
      evidence: ['ev-chronology', 'ev-photo', 'ev-cipher', 'ev-menu'],
      secrets: ['mikhaylych-secret'],
    })
    expect(isScreenUnlocked('secret', base)).toBe(false)
    expect(isScreenUnlocked('secret', { ...base, secrets: [...base.secrets, 'hidden-stamp'] })).toBe(true)
    expect(isScreenUnlocked('secret', { ...base, secrets: [...base.secrets, 'red-folder'] })).toBe(true)
    expect(
      isScreenUnlocked('secret', {
        ...base,
        evidence: ['ev-chronology'],
        secrets: [...base.secrets, 'hidden-stamp'],
      }),
    ).toBe(false)
  })

  it('opens the final envelope only after the route is built', () => {
    expect(isScreenUnlocked('final', createInitialState())).toBe(false)
    expect(isScreenUnlocked('final', stateWith({ completed: ['planner'] }))).toBe(true)
  })

  it('opens the epilogue only after a final response', () => {
    expect(isScreenUnlocked('epilogue', createInitialState())).toBe(false)
    expect(
      isScreenUnlocked(
        'epilogue',
        stateWith({
          finalResponse: {
            type: 'yes',
            submittedAt: new Date().toISOString(),
            delivery: 'demo',
          },
        }),
      ),
    ).toBe(true)
  })

  it('reports the latest available core screen', () => {
    expect(latestAvailableScreen(createInitialState())).toBe('incident')
    expect(latestAvailableScreen(stateWith({ completed: ['incident', 'interrogation'] }))).toBe('evidence')
    expect(
      latestAvailableScreen(stateWith({ completed: ['incident', 'interrogation', 'evidence', 'mikhaylych'] })),
    ).toBe('trials')
  })

  it('explains what is missing for the secret room', () => {
    const reason = lockReason('secret', createInitialState())
    expect(reason).toContain('улики: 0/4')
    expect(reason).toContain('секрет Михалыча не найден')
  })

  it('computes completion over core screens', () => {
    expect(progressPercent(createInitialState())).toBe(0)
    const all: ScreenId[] = ['incident', 'interrogation', 'evidence', 'mikhaylych', 'trials', 'planner', 'final']
    expect(progressPercent(stateWith({ completed: all }))).toBe(100)
    expect(countSecrets(stateWith({ secrets: ['a', 'b'] }))).toBe(2)
  })
})
