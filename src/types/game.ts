export type ScreenId =
  | 'boot'
  | 'incident'
  | 'interrogation'
  | 'evidence'
  | 'mikhaylych'
  | 'trials'
  | 'planner'
  | 'archive'
  | 'radio'
  | 'secret'
  | 'final'
  | 'epilogue'

export type PuzzleId = 'chronology' | 'photo' | 'cipher' | 'menu'

export type FinalResponseType = 'yes' | 'other_date' | 'discuss'

export interface PuzzleProgress {
  solved: boolean
  attempts: number
  hintsUsed: number
  assisted?: boolean
  solvedAt?: string
}

export interface TrialProgress {
  reactionBest: number
  reactionRuns: number
  reactionDone: boolean
  quizResult?: string
  quizDone: boolean
  wheelResult?: string
  wheelDone: boolean
}

export interface PlannerProgress {
  selectedStops: string[]
  orderedStops: string[]
  scenario?: string
  routeBuilt: boolean
}

export interface FinalResponse {
  type: FinalResponseType
  preferredDate?: string
  preferredTime?: string
  message?: string
  submittedAt: string
  delivery: 'telegram' | 'demo' | 'pending'
  scenario?: string
}

export interface GameState {
  version: 1
  currentScreen: ScreenId
  completed: ScreenId[]
  flags: Record<string, string | number | boolean>
  evidence: string[]
  puzzles: Record<PuzzleId, PuzzleProgress>
  secrets: string[]
  trials: TrialProgress
  planner: PlannerProgress
  secretChoice?: string
  finalResponse?: FinalResponse
  audio: {
    muted: boolean
    volume: number
    enabled: boolean
    sfxEnabled: boolean
  }
  updatedAt: string
}

export interface GameStore extends GameState {
  completeScreen: (screen: ScreenId) => void
  setCurrentScreen: (screen: ScreenId) => void
  setFlag: (key: string, value: string | number | boolean) => void
  addEvidence: (id: string) => void
  recordPuzzle: (id: PuzzleId, patch: Partial<PuzzleProgress>) => void
  discoverSecret: (id: string) => void
  setTrialResult: (patch: Partial<TrialProgress>) => void
  setPlanner: (patch: Partial<PlannerProgress>) => void
  setSecretChoice: (choice: string) => void
  setFinalResponse: (response: FinalResponse) => void
  setAudio: (patch: Partial<GameState['audio']>) => void
  hydrate: (remote: Partial<GameState>) => void
  resetGame: () => void
}

export const EMPTY_PUZZLE: PuzzleProgress = {
  solved: false,
  attempts: 0,
  hintsUsed: 0,
}
