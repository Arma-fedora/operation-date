import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FinalPage } from '../../src/pages/FinalPage'
import { ToastProvider } from '../../src/app/providers/ToastProvider'
import { useGameStore } from '../../src/store/gameStore'
import { submitFinalResponse } from '../../src/services/api/gameApi'

vi.mock('../../src/services/api/gameApi', () => ({
  submitFinalResponse: vi.fn(),
}))

const futureDate = (days: number) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

function renderFinal() {
  return render(
    <MemoryRouter initialEntries={['/final']}>
      <ToastProvider>
        <FinalPage />
      </ToastProvider>
    </MemoryRouter>,
  )
}

function openEnvelope() {
  fireEvent.click(screen.getAllByRole('button', { name: /вскрыть конверт/i })[0])
}

beforeEach(() => {
  localStorage.clear()
  useGameStore.setState(useGameStore.getInitialState(), true)
  vi.mocked(submitFinalResponse).mockReset()
  vi.mocked(submitFinalResponse).mockResolvedValue({ delivery: 'demo' })
})

describe('FinalPage', () => {
  it('submits a simple yes answer and shows the demo delivery status', async () => {
    renderFinal()
    openEnvelope()

    fireEvent.click(screen.getByRole('button', { name: /Да, давай/i }))
    fireEvent.click(screen.getByRole('button', { name: /Отправить ответ/i }))

    await waitFor(() => expect(submitFinalResponse).toHaveBeenCalledTimes(1))
    expect(useGameStore.getState().finalResponse).toMatchObject({ type: 'yes', delivery: 'demo' })
    expect(await screen.findByText(/ответ сохранён на устройстве/i)).toBeInTheDocument()
  })

  it('requires a date for the other-date option', async () => {
    renderFinal()
    openEnvelope()

    fireEvent.click(screen.getByRole('button', { name: /Предложить другую дату/i }))
    const submit = screen.getByRole('button', { name: /Отправить ответ/i })
    expect(submit).toBeDisabled()

    const dateInput = screen.getByLabelText(/дата · обязательна/i)
    fireEvent.change(dateInput, { target: { value: futureDate(7) } })
    expect(submit).toBeEnabled()

    fireEvent.click(submit)
    await waitFor(() => expect(submitFinalResponse).toHaveBeenCalledTimes(1))
    expect(vi.mocked(submitFinalResponse).mock.calls[0][0]).toMatchObject({
      type: 'other_date',
      preferredDate: futureDate(7),
    })
  })

  it('keeps the answer editable when delivery fails', async () => {
    vi.mocked(submitFinalResponse).mockRejectedValueOnce(new Error('Сеть недоступна'))
    renderFinal()
    openEnvelope()

    fireEvent.click(screen.getByRole('button', { name: /Да, давай/i }))
    fireEvent.click(screen.getByRole('button', { name: /Отправить ответ/i }))

    expect(await screen.findByText('Сеть недоступна')).toBeInTheDocument()
    expect(useGameStore.getState().finalResponse).toBeUndefined()
  })

  it('renders an already delivered answer without the form', () => {
    useGameStore.setState({
      finalResponse: {
        type: 'yes',
        submittedAt: new Date().toISOString(),
        delivery: 'telegram',
      },
    })

    renderFinal()

    expect(screen.getByText('Дело закрыто')).toBeInTheDocument()
    expect(screen.getByText(/ответ доставлен в telegram/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Изменить ответ/i })).toBeInTheDocument()
  })
})
