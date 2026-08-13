import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

export async function POST(request) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userEmail, moduleId } = await request.json()
  if (!userEmail || !moduleId) return NextResponse.json({ error: 'userEmail and moduleId required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('user_progress')
    .upsert(
      { user_email: userEmail, module_id: moduleId, cooldown_cleared_at: new Date().toISOString() },
      { onConflict: 'user_email,module_id' }
    )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
