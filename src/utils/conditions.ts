import type { GameState, ScreenId } from '../types/game'
import { CORE_SCREENS } from '../config/app.config'

const firstScreens: ScreenId[] = ['boot', 'incident', 'interrogation', 'evidence', 'mikhaylych', 'trials', 'planner']

export function isScreenUnlocked(screen: ScreenId, state: GameState): boolean {
  const done = (id: ScreenId) => state.completed.includes(id)

  switch (screen) {
    case 'boot':
    case 'incident':
      return true
    case 'interrogation':
      return done('incident')
    case 'evidence':
      return done('interrogation')
    case 'mikhaylych':
      return done('evidence')
    case 'trials':
      return done('mikhaylych')
    case 'planner':
      return done('trials')
    case 'archive':
    case 'radio':
      return done('mikhaylych')
    case 'secret':
      return (
        done('evidence') &&
        state.evidence.length >= 4 &&
        state.secrets.includes('mikhaylych-secret') &&
        (state.secrets.includes('hidden-stamp') || state.secrets.includes('red-folder'))
      )
    case 'final':
      return done('planner')
    case 'epilogue':
      return Boolean(state.finalResponse)
    default:
      return false
  }
}

export function lockReason(screen: ScreenId, state: GameState): string {
  if (screen === 'secret') {
    const walls = [
      state.evidence.length >= 4 ? 'все улики собраны' : `улики: ${state.evidence.length}/4`,
      state.secrets.includes('mikhaylych-secret') ? 'секрет Михалыча найден' : 'секрет Михалыча не найден',
      state.secrets.includes('hidden-stamp') || state.secrets.includes('red-folder')
        ? 'скрытая печать найдена'
        : 'скрытая печать не найдена',
    ]
    return `Комната 01:03 закрыта. Условия: ${walls.join(' · ')}.`
  }

  if (screen === 'epilogue') return 'Эпилог откроется после того, как ответ будет отправлен.'
  if (screen === 'final') return 'Сначала выберите сценарий и утвердите маршрут в «Планировании».'
  if (screen === 'planner') return 'Сначала пройдите три испытания.'
  if (screen === 'trials') return 'Сначала выйдите на связь с Михалычем.'
  if (screen === 'mikhaylych') return 'Сначала соберите все улики.'
  if (screen === 'evidence') return 'Сначала пройдите первый допрос.'
  if (screen === 'interrogation') return 'Сначала откройте дело.'
  return 'Доступ по спецпропуску пока не подтверждён.'
}

export function latestAvailableScreen(state: GameState): ScreenId {
  for (let i = firstScreens.length - 1; i >= 0; i -= 1) {
    if (isScreenUnlocked(firstScreens[i], state)) return firstScreens[i]
  }
  return 'incident'
}

export function progressPercent(state: GameState): number {
  return Math.round((CORE_SCREENS.filter((screen) => state.completed.includes(screen.id)).length / CORE_SCREENS.length) * 100)
}

export function countSecrets(state: GameState): number {
  return state.secrets.length
}
