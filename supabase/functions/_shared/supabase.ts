import { createClient } from 'npm:@supabase/supabase-js@2'

const url = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!url || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

export const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export interface SessionRow {
  id: string
  telegram_user_id: number
}

export async function getOrCreateSession(input: {
  telegramUserId: number
  username?: string
  firstName: string
  lastName?: string
  languageCode?: string
  initDataHash: string
}): Promise<SessionRow> {
  const { data, error } = await admin
    .from('sessions')
    .upsert(
      {
        telegram_user_id: input.telegramUserId,
        telegram_username: input.username ?? null,
        first_name: input.firstName,
        last_name: input.lastName ?? null,
        language_code: input.languageCode ?? null,
        init_data_hash: input.initDataHash,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_user_id' },
    )
    .select('id, telegram_user_id')
    .single()

  if (error) throw new Error(`Could not open archive session: ${error.message}`)
  return data as SessionRow
}
