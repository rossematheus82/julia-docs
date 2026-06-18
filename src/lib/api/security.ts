import { NextRequest, NextResponse } from 'next/server'

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function readJsonBody<T extends Record<string, unknown>>(
  request: NextRequest,
  maxBytes = 64 * 1024,
): Promise<{ data: T } | { response: NextResponse }> {
  const length = request.headers.get('content-length')
  if (length && Number(length) > maxBytes) {
    return { response: NextResponse.json({ error: 'Payload muito grande' }, { status: 413 }) }
  }

  try {
    return { data: await request.json() as T }
  } catch {
    return { response: NextResponse.json({ error: 'JSON invalido' }, { status: 400 }) }
  }
}

export function safeErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback
  const message = error.message.trim()
  if (!message) return fallback
  return message.slice(0, 200)
}
