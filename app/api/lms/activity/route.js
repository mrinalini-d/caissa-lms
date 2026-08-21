import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserEmail } from '@/lib/session'

export async function GET() {
  const userEmail = await getUserEmail()
  if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: modules } = await supabaseAdmin.from('modules').select('id, title, chapter_id, chapters(title)')
  const moduleInfo = Object.fromEntries((modules || []).map(m => [m.id, { title: m.title, chapterTitle: m.chapters?.title }]))

  const { data: progress } = await supabaseAdmin
    .from('user_progress')
    .select('module_id, video_watched_at, quiz_passed, completed_at')
    .eq('user_email', userEmail)
    .not('video_watched_at', 'is', null)

  const { data: attempts } = await supabaseAdmin
    .from('quiz_attempts')
    .select('module_id, score_pct, passed, created_at')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(10)

  const events = []
  for (const p of progress || []) {
    const info = moduleInfo[p.module_id] || {}
    events.push({
      type: 'video',
      text: `Started ${info.title || 'a module'}`,
      at: p.video_watched_at,
    })
  }
  for (const a of attempts || []) {
    const info = moduleInfo[a.module_id] || {}
    events.push({
      type: a.passed ? 'pass' : 'fail',
      text: a.passed
        ? `Completed quiz — ${info.title || 'module'}`
        : `Attempted quiz — ${info.title || 'module'} (${a.score_pct}%)`,
      at: a.created_at,
    })
  }

  events.sort((a, b) => (b.at || '').localeCompare(a.at || ''))

  return NextResponse.json({ events: events.slice(0, 6) })
}
