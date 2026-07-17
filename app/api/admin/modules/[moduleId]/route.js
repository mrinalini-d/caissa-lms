import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

export async function PUT(request, { params }) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { moduleId } = await params
  const { title, description, videoUrl, orderIndex, passScorePct } = await request.json()

  const { data, error } = await supabaseAdmin
    .from('modules')
    .update({
      title, description, video_url: videoUrl,
      order_index: orderIndex, pass_score_pct: passScorePct,
    })
    .eq('id', moduleId)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ module: data })
}

export async function DELETE(request, { params }) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { moduleId } = await params

  const { error } = await supabaseAdmin.from('modules').delete().eq('id', moduleId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
