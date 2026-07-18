import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const { email, code } = await request.json()
  if (!email || !code) return NextResponse.json({ error: 'Email and code required' }, { status: 400 })

  const key = email.toLowerCase()

  const { data: stored, error: fetchErr } = await supabaseAdmin
    .from('login_codes')
    .select('code, expires_at')
    .eq('email', key)
    .maybeSingle()
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  if (!stored) {
    return NextResponse.json({ error: 'No code found. Request a new one.' }, { status: 400 })
  }
  if (Date.now() > new Date(stored.expires_at).getTime()) {
    await supabaseAdmin.from('login_codes').delete().eq('email', key)
    return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  }
  if (stored.code !== code.trim()) {
    return NextResponse.json({ error: 'Incorrect code. Try again.' }, { status: 400 })
  }

  await supabaseAdmin.from('login_codes').delete().eq('email', key)

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
