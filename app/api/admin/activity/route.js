import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

export async function GET(request) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const params = request.nextUrl.searchParams
  const emailFilter = params.get('email')?.trim().toLowerCase()
  const from = params.get('from') // yyyy-mm-dd
  const to = params.get('to')     // yyyy-mm-dd

  const { data: modules, error: modErr } = await supabaseAdmin
    .from('modules')
    .select('id, title, chapter_id, chapters(title)')
  if (modErr) return NextResponse.json({ error: modErr.message }, { status: 500 })
  const moduleInfo = Object.fromEntries(modules.map(m => [m.id, { title: m.title, chapterTitle: m.chapters?.title }]))

  let progressQuery = supabaseAdmin
    .from('user_progress')
    .select('user_email, module_id, video_watched, video_watched_at, quiz_passed, best_score_pct, attempts, completed_at, updated_at')
  if (emailFilter) progressQuery = progressQuery.ilike('user_email', `%${emailFilter}%`)
  if (from) progressQuery = progressQuery.gte('updated_at', from)
  if (to) progressQuery = progressQuery.lte('updated_at', `${to}T23:59:59`)
  const { data: progress, error: progErr } = await progressQuery
  if (progErr) return NextResponse.json({ error: progErr.message }, { status: 500 })

  let attemptsQuery = supabaseAdmin
    .from('quiz_attempts')
    .select('user_email, module_id, score_pct, passed, answers, created_at')
    .order('created_at', { ascending: false })
  if (emailFilter) attemptsQuery = attemptsQuery.ilike('user_email', `%${emailFilter}%`)
  if (from) attemptsQuery = attemptsQuery.gte('created_at', from)
  if (to) attemptsQuery = attemptsQuery.lte('created_at', `${to}T23:59:59`)
  const { data: attempts, error: attErr } = await attemptsQuery
  if (attErr) return NextResponse.json({ error: attErr.message }, { status: 500 })

  const byUser = {}
  function getUser(email) {
    if (!byUser[email]) {
      byUser[email] = {
        email,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        videosWatched: 0,
        modulesCompleted: 0,
        totalAttempts: 0,
        avgScorePct: 0,
        lastActivityAt: null,
        modules: [],
        attempts: [],
      }
    }
    return byUser[email]
  }

  for (const p of progress) {
    const u = getUser(p.user_email)
    if (p.video_watched) u.videosWatched++
    if (p.quiz_passed) u.modulesCompleted++
    const info = moduleInfo[p.module_id] || {}
    u.modules.push({
      moduleTitle: info.title,
      chapterTitle: info.chapterTitle,
      videoWatched: p.video_watched,
      videoWatchedAt: p.video_watched_at,
      quizPassed: p.quiz_passed,
      bestScorePct: p.best_score_pct,
      attempts: p.attempts,
      completedAt: p.completed_at,
    })
    if (!u.lastActivityAt || p.updated_at > u.lastActivityAt) u.lastActivityAt = p.updated_at
  }

  for (const a of attempts) {
    const u = getUser(a.user_email)
    const info = moduleInfo[a.module_id] || {}
    u.totalAttempts++
    u.attempts.push({
      moduleTitle: info.title,
      chapterTitle: info.chapterTitle,
      scorePct: a.score_pct,
      passed: a.passed,
      answers: a.answers,
      createdAt: a.created_at,
    })
    if (!u.lastActivityAt || a.created_at > u.lastActivityAt) u.lastActivityAt = a.created_at
  }

  const users = Object.values(byUser).map(u => ({
    ...u,
    avgScorePct: u.attempts.length
      ? Math.round(u.attempts.reduce((s, a) => s + a.scorePct, 0) / u.attempts.length)
      : 0,
  })).sort((a, b) => (b.lastActivityAt || '').localeCompare(a.lastActivityAt || ''))

  return NextResponse.json({ users })
}
