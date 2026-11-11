import type { ReactNode } from 'react'
import { TelegramProvider } from './TelegramProvider'
import { BootstrapProvider } from './BootstrapProvider'
import { BackButtonProvider } from './BackButtonProvider'
import { AudioProvider } from './AudioProvider'
import { ToastProvider } from './ToastProvider'
import { ProgressSyncProvider } from './ProgressSyncProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TelegramProvider>
      <BootstrapProvider>
        <ToastProvider>
          <BackButtonProvider>
            <AudioProvider>
              <ProgressSyncProvider />
              {children}
            </AudioProvider>
          </BackButtonProvider>
        </ToastProvider>
      </BootstrapProvider>
    </TelegramProvider>
  )
}
