import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserEmail } from '@/lib/session'
import { getQuizCooldown } from '@/lib/quizCooldown'

export async function GET(request, { params }) {
  const userEmail = await getUserEmail()
  if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleId } = await params

  const { data: module_, error } = await supabaseAdmin
    .from('modules')
    .select('id, title, description, video_url, pass_score_pct, questions(id)')
    .eq('id', moduleId)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: progress } = await supabaseAdmin
    .from('user_progress')
    .select('video_watched, quiz_passed, best_score_pct, attempts')
    .eq('user_email', userEmail)
    .eq('module_id', moduleId)
    .maybeSingle()

  const cooldown = (progress?.attempts > 0 && !progress?.quiz_passed)
    ? await getQuizCooldown(userEmail, moduleId)
    : null

  return NextResponse.json({
    id: module_.id,
    title: module_.title,
    description: module_.description,
    videoUrl: module_.video_url,
    passScorePct: module_.pass_score_pct,
    hasQuiz: (module_.questions?.length || 0) > 0,
    videoWatched: progress?.video_watched || false,
    quizPassed: progress?.quiz_passed || false,
    bestScorePct: progress?.best_score_pct ?? null,
    attempts: progress?.attempts || 0,
    cooldown,
  })
}
