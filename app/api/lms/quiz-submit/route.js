import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserEmail } from '@/lib/session'

export async function POST(request) {
  const userEmail = await getUserEmail()
  if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleId, answers } = await request.json() // answers: { questionId: optionId }
  if (!moduleId || !answers) return NextResponse.json({ error: 'moduleId and answers required' }, { status: 400 })

  const { data: progress } = await supabaseAdmin
    .from('user_progress')
    .select('video_watched')
    .eq('user_email', userEmail)
    .eq('module_id', moduleId)
    .maybeSingle()

  if (!progress?.video_watched) {
    return NextResponse.json({ error: 'Watch the full video before starting the quiz' }, { status: 403 })
  }

  const { data: module_, error: modErr } = await supabaseAdmin
    .from('modules')
    .select('pass_score_pct')
    .eq('id', moduleId)
    .single()
  if (modErr) return NextResponse.json({ error: modErr.message }, { status: 500 })

  const { data: questions, error: qErr } = await supabaseAdmin
    .from('questions')
    .select('id, options(id, is_correct)')
    .eq('module_id', moduleId)
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  let correctCount = 0
  for (const q of questions) {
    const chosenOptionId = answers[q.id]
    const correctOption = q.options.find(o => o.is_correct)
    if (correctOption && chosenOptionId === correctOption.id) correctCount++
  }

  const total = questions.length
  const scorePct = total ? Math.round((correctCount / total) * 100) : 0
  const passed = scorePct >= module_.pass_score_pct

  const { error: attemptErr } = await supabaseAdmin.from('quiz_attempts').insert({
    user_email: userEmail,
    module_id: moduleId,
    score_pct: scorePct,
    passed,
    answers,
  })
  if (attemptErr) return NextResponse.json({ error: attemptErr.message }, { status: 500 })

  const { data: existing } = await supabaseAdmin
    .from('user_progress')
    .select('attempts, best_score_pct')
    .eq('user_email', userEmail)
    .eq('module_id', moduleId)
    .maybeSingle()

  const newAttempts = (existing?.attempts || 0) + 1
  const newBest = Math.max(existing?.best_score_pct || 0, scorePct)

  const { error: upsertErr } = await supabaseAdmin
    .from('user_progress')
    .upsert(
      {
        user_email: userEmail,
        module_id: moduleId,
        quiz_passed: passed || existing?.quiz_passed || false,
        best_score_pct: newBest,
        attempts: newAttempts,
        completed_at: passed ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email,module_id' }
    )
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  return NextResponse.json({ scorePct, passed, correctCount, total })
}
