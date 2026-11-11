import { expect, test, type Page } from '@playwright/test'

const STORAGE_KEY = 'operation-date-v1'

const emptyPuzzle = { solved: false, attempts: 0, hintsUsed: 0 }

function gameState(overrides: Record<string, unknown> = {}) {
  return {
    state: {
      version: 1,
      currentScreen: 'final',
      completed: ['boot', 'incident', 'interrogation', 'evidence', 'mikhaylych', 'trials', 'planner'],
      flags: {},
      evidence: [],
      puzzles: {
        chronology: { ...emptyPuzzle },
        photo: { ...emptyPuzzle },
        cipher: { ...emptyPuzzle },
        menu: { ...emptyPuzzle },
      },
      secrets: [],
      trials: {
        reactionBest: 0,
        reactionRuns: 0,
        reactionDone: false,
        quizDone: false,
        wheelDone: false,
      },
      planner: { selectedStops: [], orderedStops: [], routeBuilt: false },
      audio: { muted: true, volume: 0, enabled: false },
      updatedAt: new Date().toISOString(),
      ...overrides,
    },
    version: 1,
  }
}

async function seed(page: Page, overrides: Record<string, unknown> = {}) {
  const payload = gameState(overrides)
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value))
    },
    { key: STORAGE_KEY, value: payload },
  )
}

test('boot screen opens the incident', async ({ page }) => {
  await page.goto('/')

  const start = page.getByRole('button', { name: /Открыть дело №0103/i })
  await expect(start).toBeVisible({ timeout: 10_000 })
  await expect(start).not.toHaveClass(/pointer-events-none/)
  await start.click()

  await expect(page).toHaveURL(/\/incident$/)
  await expect(page.getByRole('heading', { name: 'Необъяснимое происшествие' })).toBeVisible()
})

test('locked final route explains the missing steps', async ({ page }) => {
  await page.goto('/final')

  await expect(page.getByText('доступ закрыт')).toBeVisible()
  await expect(page.getByText(/Сначала выберите сценарий и утвердите маршрут/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Вернуться к доступному этапу/i })).toBeVisible()
})

test('demo final answer is stored locally', async ({ page }) => {
  await seed(page)
  await page.goto('/final')

  await page.getByRole('button', { name: /Вскрыть конверт/i }).first().click()
  await page.getByRole('button', { name: 'Да, давай' }).click()
  await page.getByRole('button', { name: /Отправить ответ/i }).click()

  await expect(page.getByRole('heading', { name: 'Дело закрыто' })).toBeVisible()
  await expect(page.getByText(/ответ сохранён на устройстве/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Открыть эпилог/i })).toBeVisible()

  const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'), STORAGE_KEY)
  expect(stored.state.finalResponse).toMatchObject({ type: 'yes', delivery: 'demo' })
  expect(stored.state.completed).toContain('final')
})

test('delivered answer unlocks the epilogue', async ({ page }) => {
  await seed(page, {
    currentScreen: 'epilogue',
    completed: ['boot', 'incident', 'interrogation', 'evidence', 'mikhaylych', 'trials', 'planner', 'final'],
    finalResponse: {
      type: 'yes',
      submittedAt: new Date().toISOString(),
      delivery: 'demo',
    },
  })
  await page.goto('/epilogue')

  await expect(page.getByRole('heading', { name: 'Дело закрыто' })).toBeVisible()
  await expect(page.getByText(/ответ сохранён на этом устройстве \(демо-режим\)/i)).toBeVisible()
})
