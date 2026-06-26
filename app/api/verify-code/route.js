import { NextResponse } from 'next/server'

if (!global._caissaCodes) global._caissaCodes = new Map()
const codes = global._caissaCodes

export async function POST(request) {
  const { email, code } = await request.json()
  if (!email || !code) return NextResponse.json({ error: 'Email and code required' }, { status: 400 })

  const key = email.toLowerCase()
  const stored = codes.get(key)

  if (!stored) {
    return NextResponse.json({ error: 'No code found. Request a new one.' }, { status: 400 })
  }
  if (Date.now() > stored.expiry) {
    codes.delete(key)
    return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  }
  if (stored.code !== code.trim()) {
    return NextResponse.json({ error: 'Incorrect code. Try again.' }, { status: 400 })
  }

  codes.delete(key)

  const response = NextResponse.json({ success: true })
  response.cookies.set('caissa_session', key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
  })
  return response
}
