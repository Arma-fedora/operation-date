import { QUIZ_RESULTS, READINESS_QUIZ } from '../config/characters.config'
import type { QuizResult } from '../types/config'

export function calculateQuizResult(answers: string[]): QuizResult {
  const scores: Record<string, number> = {}
  answers.forEach((optionId, index) => {
    const option = READINESS_QUIZ[index]?.options.find((item) => item.id === optionId)
    if (option) scores[option.tag] = (scores[option.tag] ?? 0) + 1
  })

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const top = ranked[0]?.[0]
  const topScore = ranked[0]?.[1] ?? 0

  if (!top || topScore === 0) return QUIZ_RESULTS.find((item) => item.id === 'honest')!
  if (top === 'chaos') return QUIZ_RESULTS.find((item) => item.id === 'chaos')!
  if (top === 'impulse') return QUIZ_RESULTS.find((item) => item.id === 'agent')!
  if (top === 'careful') return QUIZ_RESULTS.find((item) => item.id === 'archivist')!
  if (top === 'aesthetic' || top === 'kind') return QUIZ_RESULTS.find((item) => item.id === 'architect')!
  return QUIZ_RESULTS.find((item) => item.id === 'honest')!
}
