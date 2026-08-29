import { NextResponse } from 'next/server'
import { isAdminEmail } from './admin'

const SECRET = process.env.CAISSA_BLOCK_SECRET

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-caissa-block-secret',
}

export function corsJson(body, init = {}) {
  return NextResponse.json(body, { ...init, headers: { ...CORS_HEADERS, ...(init.headers || {}) } })
}

// Verifies the shared secret the NocoBase block sends, and returns the trainee
// email it claims to act as. There's no session cookie across origins, so the
// block passes its own identity explicitly — the secret just proves the
// request came from the block, not an arbitrary caller on the internet.
export function verifyBlockRequest(request, email) {
  const secret = request.headers.get('x-caissa-block-secret')
  if (!secret || secret !== SECRET) return { error: corsJson({ error: 'Unauthorized' }, { status: 401 }) }
  if (!email) return { error: corsJson({ error: 'email required' }, { status: 400 }) }
  return { email }
}

export function requireBlockAdmin(request, email) {
  const check = verifyBlockRequest(request, email)
  if (check.error) return check
  if (!isAdminEmail(email)) return { error: corsJson({ error: 'Forbidden' }, { status: 403 }) }
  return { email }
}
