export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export function fail(message: string, status = 400): Response {
  return json({ ok: false, error: message }, status)
}

export class PublicError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'PublicError'
    this.status = status
  }
}
