import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

export async function GET(request) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = request.nextUrl.searchParams.get('chapterId')
  let query = supabaseAdmin
    .from('modules')
    .select('id, chapter_id, title, description, video_url, duration_seconds, order_index, pass_score_pct, questions(id)')
    .order('order_index')
  if (chapterId) query = query.eq('chapter_id', chapterId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    modules: data.map(m => ({
      id: m.id, chapterId: m.chapter_id, title: m.title, description: m.description,
      videoUrl: m.video_url, durationSeconds: m.duration_seconds, orderIndex: m.order_index,
      passScorePct: m.pass_score_pct, questionCount: m.questions?.length || 0,
    })),
  })
}

export async function POST(request) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { chapterId, title, description, videoUrl, orderIndex, passScorePct } = await request.json()
  if (!chapterId || !title || !videoUrl) {
    return NextResponse.json({ error: 'chapterId, title and videoUrl required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('modules')
    .insert({
      chapter_id: chapterId, title, description, video_url: videoUrl,
      order_index: orderIndex ?? 0, pass_score_pct: passScorePct ?? 70,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ module: data })
}
