import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { APP_CONFIG } from '../../config/app.config'
import { getInitData } from '../telegram/telegram'
import type { FinalResponseType, GameState } from '../../types/game'

let client: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  if (!APP_CONFIG.supabaseUrl || !APP_CONFIG.supabaseAnonKey) return null
  if (!client) {
    client = createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

export function remoteAvailable(): boolean {
  return Boolean(!APP_CONFIG.demoMode && getClient() && getInitData())
}

async function invoke<T>(action: string, payload: unknown): Promise<T> {
  const supabase = getClient()
  const initData = getInitData()
  if (!supabase || !initData) throw new Error('Remote mode is not configured')
  const { data, error } = await supabase.functions.invoke('game-api', {
    body: { action, initData, payload },
  })
  if (error) throw new Error(error.message || 'Не удалось связаться с архивом')
  return data as T
}

export async function syncProgress(state: GameState): Promise<void> {
  if (!remoteAvailable()) return
  await invoke('save-progress', {
    state,
    clientVersion: APP_CONFIG.version,
  })
}

export interface FinalSubmission {
  type: FinalResponseType
  preferredDate?: string
  preferredTime?: string
  message?: string
  scenario?: string
}

export async function submitFinalResponse(
  submission: FinalSubmission,
  state: GameState,
): Promise<{ delivery: 'telegram' | 'demo' | 'pending'; responseId?: string }> {
  if (!remoteAvailable()) {
    await new Promise((resolve) => window.setTimeout(resolve, 850))
    return { delivery: 'demo' }
  }
  const result = await invoke<{
    delivery?: 'telegram'
    notified?: boolean
    responseId?: string
  }>('submit-final', {
    ...submission,
    progressSnapshot: {
      completed: state.completed,
      evidence: state.evidence,
      puzzles: state.puzzles,
      secrets: state.secrets,
      trials: state.trials,
      planner: state.planner,
      secretChoice: state.secretChoice,
      flags: state.flags,
    },
  })
  const delivery = result.delivery ?? 'telegram'
  return {
    delivery: delivery === 'telegram' && result.notified === false ? 'pending' : delivery,
    responseId: result.responseId,
  }
}

export async function bootstrapSession(): Promise<Partial<GameState> | null> {
  if (!remoteAvailable()) return null
  try {
    let timer: number | undefined
    const result = await Promise.race([
      invoke<{ state?: Partial<GameState> }>('bootstrap', {}),
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error('Archive bootstrap timed out')), 8000)
      }),
    ]).finally(() => {
      if (timer) window.clearTimeout(timer)
    })
    return result.state ?? null
  } catch {
    return null
  }
}
