import { describe, expect, it } from 'vitest'
import { calculateQuizResult } from '../src/utils/quiz'

describe('readiness quiz', () => {
  it('falls back to the honest result for no answers', () => {
    expect(calculateQuizResult([]).id).toBe('honest')
  })

  it('builds the archivist result from careful choices', () => {
    expect(calculateQuizResult(['b', 'b', 'a', 'b', 'b']).id).toBe('archivist')
  })

  it('builds the agent result from impulse choices', () => {
    expect(calculateQuizResult(['a', 'a', 'b', 'a', 'a']).id).toBe('agent')
  })

  it('builds the chaos result from chaos choices', () => {
    expect(calculateQuizResult(['c', 'c', 'c', 'c', 'c']).id).toBe('chaos')
  })

  it('builds the architect result from kind choices', () => {
    expect(calculateQuizResult(['c', 'a', 'c', 'a', 'b']).id).toBe('architect')
  })

  it('ignores unknown option ids', () => {
    expect(calculateQuizResult(['nope', 'nope']).id).toBe('honest')
  })
})
