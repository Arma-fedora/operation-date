export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    auth_date?: number
    query_id?: string
    start_param?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  isExpanded: boolean
  viewportHeight?: number
  viewportStableHeight?: number
  ready: () => void
  expand: () => void
  close: () => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  enableClosingConfirmation?: () => void
  disableVerticalSwipes?: () => void
  requestFullscreen?: () => void
  exitFullscreen?: () => void
  onEvent?: (event: string, callback: () => void) => void
  offEvent?: (event: string, callback: () => void) => void
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

export const DEMO_USER: TelegramUser = {
  id: 1000103,
  first_name: 'Гость',
  username: 'demo_inspector',
  language_code: 'ru',
}

export function getTelegram(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp
}

export function isTelegramEnvironment(): boolean {
  return Boolean(getTelegram()?.initData)
}

export function initializeTelegram(): boolean {
  const tg = getTelegram()
  if (!tg) return false
  try {
    tg.ready()
    tg.expand()
    tg.setHeaderColor('#080a09')
    tg.setBackgroundColor('#080a09')
    tg.disableVerticalSwipes?.()
    if (tg.version && Number.parseFloat(tg.version) >= 8) {
      // Fullscreen is requested later, after a user gesture, to avoid platform errors.
    }
    return Boolean(tg.initData)
  } catch {
    return false
  }
}

export function getTelegramUser(): TelegramUser {
  return getTelegram()?.initDataUnsafe?.user ?? DEMO_USER
}

export function getInitData(): string {
  return getTelegram()?.initData ?? ''
}

export function getTelegramTheme(): 'light' | 'dark' {
  return getTelegram()?.colorScheme ?? 'dark'
}

export function haptic(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection',
): void {
  const feedback = getTelegram()?.HapticFeedback
  if (!feedback) return
  try {
    if (type === 'success' || type === 'error' || type === 'warning') {
      feedback.notificationOccurred(type)
    } else if (type === 'selection') {
      feedback.selectionChanged()
    } else {
      feedback.impactOccurred(type)
    }
  } catch {
    // Haptics can be unavailable in desktop Telegram; not a fatal error.
  }
}

export function requestFullscreen(): void {
  const tg = getTelegram()
  if (!tg?.requestFullscreen) return
  try {
    tg.requestFullscreen()
  } catch {
    // Some clients reject fullscreen requests outside a gesture. Safe to ignore.
  }
}

export function showBackButton(callback: () => void): () => void {
  const button = getTelegram()?.BackButton
  if (!button) return () => undefined
  try {
    button.onClick(callback)
    button.show()
    return () => {
      button.offClick(callback)
      button.hide()
    }
  } catch {
    return () => undefined
  }
}
