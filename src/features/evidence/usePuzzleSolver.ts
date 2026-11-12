import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { haptic } from '../../services/telegram/telegram'
import { useSfx } from '../../app/providers/AudioProvider'
import type { PuzzleDefinition } from '../../types/config'

export function usePuzzleSolver(definition: PuzzleDefinition, onSolved?: () => void) {
  const progress = useGameStore((state) => state.puzzles[definition.id])
  const recordPuzzle = useGameStore((state) => state.recordPuzzle)
  const addEvidence = useGameStore((state) => state.addEvidence)
  const sfx = useSfx()
  const [wrongMessage, setWrongMessage] = useState('')
  const [shake, setShake] = useState(0)

  const solve = (assisted = false) => {
    if (progress.solved) return
    recordPuzzle(definition.id, {
      solved: true,
      assisted,
      attempts: progress.attempts + 1,
    })
    addEvidence(definition.evidenceId)
    haptic('success')
    sfx('puzzle-correct')
    onSolved?.()
  }

  const submitAnswer = (correct: boolean): boolean => {
    if (progress.solved) return true
    if (correct) {
      setWrongMessage('')
      solve(false)
      return true
    }
    recordPuzzle(definition.id, { attempts: progress.attempts + 1 })
    setWrongMessage(definition.wrongTexts[progress.attempts % definition.wrongTexts.length])
    setShake((value) => value + 1)
    haptic('error')
    sfx('puzzle-wrong')
    return false
  }

  const revealHint = () => {
    if (progress.hintsUsed >= 3 || progress.solved) return
    recordPuzzle(definition.id, { hintsUsed: progress.hintsUsed + 1 })
    haptic('selection')
  }

  const acceptHelp = () => {
    setWrongMessage('')
    solve(true)
  }

  return {
    progress,
    wrongMessage,
    shake,
    solve,
    submitAnswer,
    revealHint,
    acceptHelp,
    hints: definition.hints.slice(0, progress.hintsUsed),
    nextHint: definition.hints[progress.hintsUsed],
    canAcceptHelp: progress.attempts >= 4 || progress.hintsUsed >= 3,
    clearWrong: () => setWrongMessage(''),
  }
}
