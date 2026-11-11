import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SCREENS } from '../../config/app.config'
import { useGameStore } from '../../store/gameStore'
import { Atmosphere } from '../fx/Atmosphere'
import { DossierMenu } from './DossierMenu'
import { TopBar } from './TopBar'

export function AppShell() {
  const location = useLocation()
  const reduced = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const setCurrentScreen = useGameStore((state) => state.setCurrentScreen)
  const screen = SCREENS.find((item) => item.path === location.pathname)

  useEffect(() => {
    if (screen) setCurrentScreen(screen.id)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname, screen, setCurrentScreen])

  const isBoot = location.pathname === '/'

  return (
    <div className="app-shell min-h-[100dvh] bg-[var(--bg)] text-[var(--fg)]">
      <Atmosphere />
      {!isBoot ? <TopBar onMenu={() => setMenuOpen(true)} /> : null}
      <main
        className={
          isBoot
            ? 'relative z-10 min-h-[100dvh]'
            : 'relative z-10 mx-auto w-full max-w-[820px] px-4 pb-[calc(env(safe-area-inset-bottom)+32px)] pt-5 sm:px-6'
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <DossierMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
