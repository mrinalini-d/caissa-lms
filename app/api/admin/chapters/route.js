import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

export async function GET() {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: chapters, error } = await supabaseAdmin
    .from('chapters')
    .select('id, title, description, order_index, modules(id)')
    .order('order_index')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    chapters: chapters.map(c => ({
      id: c.id, title: c.title, description: c.description, orderIndex: c.order_index,
      moduleCount: c.modules?.length || 0,
    })),
  })
}

export async function POST(request) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, orderIndex } = await request.json()
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('chapters')
    .insert({ title, description, order_index: orderIndex ?? 0 })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ chapter: data })
}
