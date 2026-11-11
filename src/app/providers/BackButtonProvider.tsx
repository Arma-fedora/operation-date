import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getTelegram, showBackButton } from '../../services/telegram/telegram'

interface BackButtonContextValue {
  register: (handler: () => void) => () => void
}

const BackButtonContext = createContext<BackButtonContextValue | null>(null)

export function BackButtonProvider({ children }: { children: ReactNode }) {
  const stack = useRef<Array<() => void>>([])
  const navigate = useNavigate()
  const location = useLocation()

  const register = useCallback((handler: () => void) => {
    stack.current.push(handler)
    return () => {
      stack.current = stack.current.filter((item) => item !== handler)
    }
  }, [])

  useEffect(() => {
    return showBackButton(() => {
      const handler = stack.current[stack.current.length - 1]
      if (handler) {
        handler()
        return
      }
      if (window.history.length > 1) navigate(-1)
    })
  }, [navigate])

  useEffect(() => {
    const tg = getTelegram()
    if (!tg) return
    try {
      if (location.pathname === '/') tg.BackButton.hide()
      else tg.BackButton.show()
    } catch {
      // BackButton is not available in every client.
    }
  }, [location.pathname])

  return <BackButtonContext.Provider value={{ register }}>{children}</BackButtonContext.Provider>
}

export function useRegisterBackHandler(handler: () => void, active = true): void {
  const context = useContext(BackButtonContext)
  useEffect(() => {
    if (!context || !active) return
    return context.register(handler)
  }, [active, context, handler])
}
