import type { UnlockCondition } from '../types/config'
import type { GameState } from '../types/game'

export function isUnlockMet(condition: UnlockCondition, state: GameState): boolean {
  switch (condition.type) {
    case 'always':
      return true
    case 'screen':
      return state.completed.includes(condition.screen)
    case 'evidence':
      return state.evidence.includes(condition.id)
    case 'secret':
      return state.secrets.includes(condition.id)
    case 'all':
      return condition.of.every((item) => isUnlockMet(item, state))
    case 'any':
      return condition.of.some((item) => isUnlockMet(item, state))
    default:
      return false
  }
}

export function unlockLabel(condition: UnlockCondition): string {
  switch (condition.type) {
    case 'always':
      return 'Доступно'
    case 'screen':
      return 'Откроется по сюжету'
    case 'evidence':
      return 'Нужна улика'
    case 'secret':
      return 'Секретный материал'
    case 'all':
      return 'Нужны все условия'
    case 'any':
      return 'Нужно одно из условий'
    default:
      return 'Закрыто'
  }
}
