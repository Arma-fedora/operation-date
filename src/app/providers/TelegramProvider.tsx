import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  getInitData,
  getTelegram,
  getTelegramTheme,
  getTelegramUser,
  initializeTelegram,
  isTelegramEnvironment,
  type TelegramUser,
} from '../../services/telegram/telegram'

interface TelegramContextValue {
  user: TelegramUser
  isTelegram: boolean
  initData: string
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

const TelegramContext = createContext<TelegramContextValue | null>(null)

const THEME_KEY = 'operation-date-theme'

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isTelegram, setIsTelegram] = useState(false)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    return getTelegramTheme()
  })

  useEffect(() => {
    const ok = initializeTelegram()
    setIsTelegram(ok || isTelegramEnvironment())
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    const tg = getTelegram()
    const header = theme === 'light' ? '#e9e1d0' : '#080a09'
    try {
      tg?.setHeaderColor(header)
      tg?.setBackgroundColor(header)
    } catch {
      // Colour setters are optional in older clients.
    }
  }, [theme])

  useEffect(() => {
    const tg = getTelegram()
    if (!tg?.onEvent) return
    const onThemeChanged = () => {
      const stored = localStorage.getItem(THEME_KEY)
      if (!stored) setThemeState(tg.colorScheme)
    }
    tg.onEvent('themeChanged', onThemeChanged)
    return () => tg.offEvent?.('themeChanged', onThemeChanged)
  }, [])

  const setTheme = (next: 'light' | 'dark') => {
    localStorage.setItem(THEME_KEY, next)
    setThemeState(next)
  }

  const value = useMemo<TelegramContextValue>(
    () => ({
      user: getTelegramUser(),
      isTelegram,
      initData: getInitData(),
      theme,
      setTheme,
    }),
    [isTelegram, theme],
  )

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
}

export function useTelegram(): TelegramContextValue {
  const context = useContext(TelegramContext)
  if (!context) throw new Error('useTelegram must be used inside TelegramProvider')
  return context
}
