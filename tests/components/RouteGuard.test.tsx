import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RouteGuard } from '../../src/app/guards/RouteGuard'
import { useGameStore } from '../../src/store/gameStore'
import type { ScreenId } from '../../src/types/game'

function renderGuard(screenId: ScreenId, children = 'доступный этап') {
  return render(
    <MemoryRouter>
      <RouteGuard screen={screenId}>{children}</RouteGuard>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useGameStore.setState(useGameStore.getInitialState(), true)
})

describe('RouteGuard', () => {
  it('renders unlocked screens', () => {
    renderGuard('incident')
    expect(screen.getByText('доступный этап')).toBeInTheDocument()
  })

  it('blocks locked screens and explains what is missing', () => {
    renderGuard('interrogation')
    expect(screen.getByText('доступ закрыт')).toBeInTheDocument()
    expect(screen.getByText(/Вернуться к доступному этапу/i)).toBeInTheDocument()
  })

  it('opens the next screen after the previous one is completed', () => {
    useGameStore.setState({ completed: ['incident'] })
    renderGuard('interrogation')
    expect(screen.getByText('доступный этап')).toBeInTheDocument()
  })

  it('shows the secret room requirements', () => {
    useGameStore.setState({ completed: ['evidence'] })
    renderGuard('secret')
    expect(screen.getByText(/улики: 0\/4/)).toBeInTheDocument()
    expect(screen.getByText(/секрет Михалыча не найден/i)).toBeInTheDocument()
  })
})
