import { describe, expect, it } from 'vitest'
import { createInitialState } from '../src/store/gameStore'
import type { UnlockCondition } from '../src/types/config'
import { isUnlockMet, unlockLabel } from '../src/utils/conditionsGallery'

describe('gallery unlock conditions', () => {
  it('opens always-items and hides unknown types', () => {
    const state = createInitialState()
    expect(isUnlockMet({ type: 'always' }, state)).toBe(true)
    expect(isUnlockMet({ type: 'mystery' } as unknown as UnlockCondition, state)).toBe(false)
  })

  it('checks screens, evidence and secrets', () => {
    const state = {
      ...createInitialState(),
      completed: ['incident' as const],
      evidence: ['ev-chronology'],
      secrets: ['pigeon'],
    }
    expect(isUnlockMet({ type: 'screen', screen: 'incident' }, state)).toBe(true)
    expect(isUnlockMet({ type: 'screen', screen: 'final' }, state)).toBe(false)
    expect(isUnlockMet({ type: 'evidence', id: 'ev-chronology' }, state)).toBe(true)
    expect(isUnlockMet({ type: 'secret', id: 'pigeon' }, state)).toBe(true)
  })

  it('supports nested all/any groups', () => {
    const state = {
      ...createInitialState(),
      completed: ['incident' as const],
      secrets: ['red-folder'],
    }
    const condition: UnlockCondition = {
      type: 'all',
      of: [
        { type: 'screen', screen: 'incident' },
        {
          type: 'any',
          of: [
            { type: 'secret', id: 'hidden-stamp' },
            { type: 'secret', id: 'red-folder' },
          ],
        },
      ],
    }
    expect(isUnlockMet(condition, state)).toBe(true)
    expect(isUnlockMet({ type: 'any', of: [] }, state)).toBe(false)
    expect(isUnlockMet({ type: 'all', of: [] }, state)).toBe(true)
  })

  it('returns a human label for every supported condition', () => {
    expect(unlockLabel({ type: 'always' })).toBe('Доступно')
    expect(unlockLabel({ type: 'secret', id: 'x' })).toBe('Секретный материал')
    expect(unlockLabel({ type: 'all', of: [] })).toBe('Нужны все условия')
    expect(unlockLabel({ type: 'any', of: [] })).toBe('Нужно одно из условий')
  })
})
