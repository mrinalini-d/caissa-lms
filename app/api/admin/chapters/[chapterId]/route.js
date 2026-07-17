import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

export async function PUT(request, { params }) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { chapterId } = await params
  const { title, description, orderIndex } = await request.json()

  const { data, error } = await supabaseAdmin
    .from('chapters')
    .update({ title, description, order_index: orderIndex })
    .eq('id', chapterId)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ chapter: data })
}

export async function DELETE(request, { params }) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { chapterId } = await params

  const { error } = await supabaseAdmin.from('chapters').delete().eq('id', chapterId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
