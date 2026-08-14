import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

export async function POST(request) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { moduleIds } = await request.json()
  if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
    return NextResponse.json({ error: 'moduleIds required' }, { status: 400 })
  }

  const results = await Promise.all(
    moduleIds.map((id, i) =>
      supabaseAdmin.from('modules').update({ order_index: i + 1 }).eq('id', id)
    )
  )
  const failed = results.find(r => r.error)
  if (failed) return NextResponse.json({ error: failed.error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
