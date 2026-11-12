import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, GameStore, PuzzleId, ScreenId } from '../types/game'
import { EMPTY_PUZZLE } from '../types/game'

const now = () => new Date().toISOString()

function hasLocalProgress(state: GameState): boolean {
  return (
    state.completed.length > 0 ||
    state.evidence.length > 0 ||
    state.secrets.length > 0 ||
    Object.values(state.puzzles).some((puzzle) => puzzle.solved || puzzle.attempts > 0) ||
    Object.values(state.trials).some((value) => value === true || (typeof value === 'number' && value > 0)) ||
    state.planner.orderedStops.length > 0
  )
}

function mergeProgress(state: GameState, remote: Partial<GameState>): GameState {
  const mergedPuzzles = { ...state.puzzles }
  if (remote.puzzles) {
    ;(['chronology', 'photo', 'cipher', 'menu'] as const).forEach((id) => {
      mergedPuzzles[id] = { ...state.puzzles[id], ...remote.puzzles?.[id] }
    })
  }
  return {
    ...state,
    version: 1,
    currentScreen: remote.currentScreen ?? state.currentScreen,
    completed: remote.completed ?? state.completed,
    flags: remote.flags ?? state.flags,
    evidence: remote.evidence ?? state.evidence,
    puzzles: mergedPuzzles,
    secrets: remote.secrets ?? state.secrets,
    trials: { ...state.trials, ...remote.trials },
    planner: { ...state.planner, ...remote.planner },
    secretChoice: remote.secretChoice ?? state.secretChoice,
    audio: { ...state.audio, ...remote.audio },
    updatedAt: remote.updatedAt ?? state.updatedAt,
  }
}

export function createInitialState(): GameState {
  return {
    version: 1,
    currentScreen: 'boot',
    completed: [],
    flags: {},
    evidence: [],
    puzzles: {
      chronology: { ...EMPTY_PUZZLE },
      photo: { ...EMPTY_PUZZLE },
      cipher: { ...EMPTY_PUZZLE },
      menu: { ...EMPTY_PUZZLE },
    },
    secrets: [],
    trials: {
      reactionBest: 0,
      reactionRuns: 0,
      reactionDone: false,
      quizDone: false,
      wheelDone: false,
    },
    planner: {
      selectedStops: [],
      orderedStops: [],
      routeBuilt: false,
    },
    audio: {
      muted: false,
      volume: 0.32,
      enabled: true,
      sfxEnabled: true,
    },
    updatedAt: now(),
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...createInitialState(),

      completeScreen: (screen: ScreenId) =>
        set((state) => ({
          completed: state.completed.includes(screen) ? state.completed : [...state.completed, screen],
          updatedAt: now(),
        })),

      setCurrentScreen: (screen: ScreenId) =>
        set((state) => (state.currentScreen === screen ? state : { currentScreen: screen, updatedAt: now() })),

      setFlag: (key, value) =>
        set((state) => ({
          flags: { ...state.flags, [key]: value },
          updatedAt: now(),
        })),

      addEvidence: (id) =>
        set((state) => ({
          evidence: state.evidence.includes(id) ? state.evidence : [...state.evidence, id],
          updatedAt: now(),
        })),

      recordPuzzle: (id: PuzzleId, patch) =>
        set((state) => {
          const current = state.puzzles[id]
          const next = { ...current, ...patch }
          if (next.solved && !current.solved) {
            next.solvedAt = now()
          }
          return {
            puzzles: { ...state.puzzles, [id]: next },
            updatedAt: now(),
          }
        }),

      discoverSecret: (id) =>
        set((state) => ({
          secrets: state.secrets.includes(id) ? state.secrets : [...state.secrets, id],
          updatedAt: now(),
        })),

      setTrialResult: (patch) =>
        set((state) => ({
          trials: { ...state.trials, ...patch },
          updatedAt: now(),
        })),

      setPlanner: (patch) =>
        set((state) => ({
          planner: { ...state.planner, ...patch },
          updatedAt: now(),
        })),

      setSecretChoice: (choice) =>
        set(() => ({
          secretChoice: choice,
          updatedAt: now(),
        })),

      setFinalResponse: (response) =>
        set((state) => ({
          finalResponse: response,
          completed: state.completed.includes('final') ? state.completed : [...state.completed, 'final'],
          updatedAt: now(),
        })),

      setAudio: (patch) =>
        set((state) => ({
          audio: { ...state.audio, ...patch },
          updatedAt: now(),
        })),

      hydrate: (remote) =>
        set((state) => {
          if (!remote || typeof remote !== 'object') return state

          const remoteProgressAt = remote.updatedAt ? Date.parse(remote.updatedAt) : Number.NaN
          const localProgressAt = Date.parse(state.updatedAt)
          const takeProgress =
            Boolean(remote.updatedAt) &&
            Number.isFinite(remoteProgressAt) &&
            (!hasLocalProgress(state) || remoteProgressAt > localProgressAt)

          const remoteFinal = remote.finalResponse
          const remoteFinalAt = remoteFinal?.submittedAt ? Date.parse(remoteFinal.submittedAt) : Number.NaN
          const localFinalAt = state.finalResponse ? Date.parse(state.finalResponse.submittedAt) : Number.NaN
          const takeFinal =
            Boolean(remoteFinal) &&
            (!state.finalResponse ||
              (Number.isFinite(remoteFinalAt) &&
                (!Number.isFinite(localFinalAt) || remoteFinalAt > localFinalAt)))

          if (!takeProgress && !takeFinal) return state

          let next = takeProgress ? mergeProgress(state, remote) : state

          if (takeFinal && remoteFinal) {
            next = {
              ...next,
              finalResponse: remoteFinal,
              completed: next.completed.includes('final') ? next.completed : [...next.completed, 'final'],
            }
          }

          return next
        }),

      resetGame: () =>
        set((state) => ({
          ...createInitialState(),
          audio: state.audio,
        })),
    }),
    {
      name: 'operation-date-v1',
      version: 1,
      partialize: (state) => ({
        version: state.version,
        currentScreen: state.currentScreen,
        completed: state.completed,
        flags: state.flags,
        evidence: state.evidence,
        puzzles: state.puzzles,
        secrets: state.secrets,
        trials: state.trials,
        planner: state.planner,
        secretChoice: state.secretChoice,
        finalResponse: state.finalResponse,
        audio: state.audio,
        updatedAt: state.updatedAt,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<GameState>
        return {
          ...current,
          ...saved,
          puzzles: {
            chronology: { ...current.puzzles.chronology, ...saved.puzzles?.chronology },
            photo: { ...current.puzzles.photo, ...saved.puzzles?.photo },
            cipher: { ...current.puzzles.cipher, ...saved.puzzles?.cipher },
            menu: { ...current.puzzles.menu, ...saved.puzzles?.menu },
          },
          trials: { ...current.trials, ...saved.trials },
          planner: { ...current.planner, ...saved.planner },
          audio: { ...current.audio, ...saved.audio },
        }
      },
    },
  ),
)
