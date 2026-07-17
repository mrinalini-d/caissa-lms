import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserEmail } from '@/lib/session'

export async function GET() {
  const userEmail = await getUserEmail()
  if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: chapters, error: chErr } = await supabaseAdmin
    .from('chapters')
    .select('id, title, description, order_index')
    .order('order_index')

  if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 })

  const { data: modules, error: modErr } = await supabaseAdmin
    .from('modules')
    .select('id, chapter_id, title, description, video_url, duration_seconds, order_index, pass_score_pct')
    .order('order_index')

  if (modErr) return NextResponse.json({ error: modErr.message }, { status: 500 })

  const { data: progress, error: progErr } = await supabaseAdmin
    .from('user_progress')
    .select('module_id, video_watched, quiz_passed, best_score_pct, attempts, completed_at')
    .eq('user_email', userEmail)

  if (progErr) return NextResponse.json({ error: progErr.message }, { status: 500 })

  const progressByModule = Object.fromEntries((progress || []).map(p => [p.module_id, p]))

  // Flatten modules in chapter order → module order to compute sequential unlock.
  const chapterOrder = Object.fromEntries(chapters.map(c => [c.id, c.order_index]))
  const flatModules = [...modules].sort((a, b) => {
    const chDiff = (chapterOrder[a.chapter_id] ?? 0) - (chapterOrder[b.chapter_id] ?? 0)
    return chDiff !== 0 ? chDiff : a.order_index - b.order_index
  })

  let previousPassed = true
  const unlockedByModule = {}
  for (const m of flatModules) {
    unlockedByModule[m.id] = previousPassed
    previousPassed = progressByModule[m.id]?.quiz_passed || false
  }

  const chaptersWithModules = chapters.map(ch => ({
    ...ch,
    modules: flatModules
      .filter(m => m.chapter_id === ch.id)
      .map(m => {
        const p = progressByModule[m.id]
        return {
          id: m.id,
          title: m.title,
          description: m.description,
          videoUrl: m.video_url,
          durationSeconds: m.duration_seconds,
          passScorePct: m.pass_score_pct,
          unlocked: unlockedByModule[m.id],
          videoWatched: p?.video_watched || false,
          quizPassed: p?.quiz_passed || false,
          bestScorePct: p?.best_score_pct ?? null,
          attempts: p?.attempts || 0,
        }
      }),
  }))

  const totalModules = flatModules.length
  const completedModules = flatModules.filter(m => progressByModule[m.id]?.quiz_passed).length

  return NextResponse.json({
    chapters: chaptersWithModules,
    totalModules,
    completedModules,
    progressPct: totalModules ? Math.round((completedModules / totalModules) * 100) : 0,
  })
}
