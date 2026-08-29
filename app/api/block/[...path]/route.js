import { supabaseAdmin } from '@/lib/supabase'
import { getQuizCooldown } from '@/lib/quizCooldown'
import { corsJson, verifyBlockRequest, requireBlockAdmin, CORS_HEADERS } from '@/lib/blockAuth'

const BUCKET = 'videos'

export async function OPTIONS(request) {
  // A 204 response must not have a body — NextResponse.json() always writes
  // one, so this needs the plain Response constructor instead.
  // Echo back whatever headers the browser says it wants to send (NocoBase's
  // client attaches several custom headers beyond Authorization — x-role,
  // x-hostname, x-timezone, etc. — that vary by version) instead of trying
  // to enumerate them all statically.
  const requested = request.headers.get('access-control-request-headers')
  const headers = { ...CORS_HEADERS }
  if (requested) headers['Access-Control-Allow-Headers'] = requested
  return new Response(null, { status: 204, headers })
}

// ─────────────────────────── trainee-facing ───────────────────────────

async function getCurriculum(email) {
  const { data: chapters, error: chErr } = await supabaseAdmin
    .from('chapters').select('id, title, description, order_index').order('order_index')
  if (chErr) return corsJson({ error: chErr.message }, { status: 500 })

  const { data: modules, error: modErr } = await supabaseAdmin
    .from('modules')
    .select('id, chapter_id, title, description, video_url, duration_seconds, order_index, pass_score_pct')
    .order('order_index')
  if (modErr) return corsJson({ error: modErr.message }, { status: 500 })

  const { data: progress, error: progErr } = await supabaseAdmin
    .from('user_progress')
    .select('module_id, video_watched, quiz_passed, best_score_pct, attempts, completed_at')
    .eq('user_email', email)
  if (progErr) return corsJson({ error: progErr.message }, { status: 500 })

  const progressByModule = Object.fromEntries((progress || []).map(p => [p.module_id, p]))
  const needsCooldown = (progress || []).filter(p => p.attempts > 0 && !p.quiz_passed)
  const cooldownEntries = await Promise.all(needsCooldown.map(async p => [p.module_id, await getQuizCooldown(email, p.module_id)]))
  const cooldownByModule = Object.fromEntries(cooldownEntries.filter(([, c]) => c))

  const chapterOrder = Object.fromEntries(chapters.map(c => [c.id, c.order_index]))
  const flatModules = [...modules].sort((a, b) => {
    const d = (chapterOrder[a.chapter_id] ?? 0) - (chapterOrder[b.chapter_id] ?? 0)
    return d !== 0 ? d : a.order_index - b.order_index
  })

  let previousPassed = true
  const unlockedByModule = {}
  for (const m of flatModules) {
    unlockedByModule[m.id] = previousPassed
    previousPassed = progressByModule[m.id]?.quiz_passed || false
  }

  const chaptersWithModules = chapters.map(ch => ({
    ...ch,
    modules: flatModules.filter(m => m.chapter_id === ch.id).map(m => {
      const p = progressByModule[m.id]
      return {
        id: m.id, title: m.title, description: m.description, videoUrl: m.video_url,
        durationSeconds: m.duration_seconds, passScorePct: m.pass_score_pct,
        unlocked: unlockedByModule[m.id], videoWatched: p?.video_watched || false,
        quizPassed: p?.quiz_passed || false, bestScorePct: p?.best_score_pct ?? null,
        attempts: p?.attempts || 0, cooldown: cooldownByModule[m.id] || null,
      }
    }),
  }))

  const totalModules = flatModules.length
  const completedModules = flatModules.filter(m => progressByModule[m.id]?.quiz_passed).length

  return corsJson({
    chapters: chaptersWithModules, totalModules, completedModules,
    progressPct: totalModules ? Math.round((completedModules / totalModules) * 100) : 0,
  })
}

async function getModule(email, moduleId) {
  const { data: mod, error } = await supabaseAdmin
    .from('modules').select('id, title, description, video_url, pass_score_pct, questions(id)').eq('id', moduleId).single()
  if (error) return corsJson({ error: error.message }, { status: 404 })

  const { data: progress } = await supabaseAdmin
    .from('user_progress').select('video_watched, quiz_passed, best_score_pct, attempts')
    .eq('user_email', email).eq('module_id', moduleId).maybeSingle()

  const cooldown = (progress?.attempts > 0 && !progress?.quiz_passed) ? await getQuizCooldown(email, moduleId) : null

  return corsJson({
    id: mod.id, title: mod.title, description: mod.description, videoUrl: mod.video_url,
    passScorePct: mod.pass_score_pct, hasQuiz: (mod.questions?.length || 0) > 0,
    videoWatched: progress?.video_watched || false, quizPassed: progress?.quiz_passed || false,
    bestScorePct: progress?.best_score_pct ?? null, attempts: progress?.attempts || 0, cooldown,
  })
}

async function postVideoComplete(email, body) {
  const { moduleId } = body
  if (!moduleId) return corsJson({ error: 'moduleId required' }, { status: 400 })

  const { count } = await supabaseAdmin.from('questions').select('id', { count: 'exact', head: true }).eq('module_id', moduleId)
  const hasQuiz = (count || 0) > 0

  const { error } = await supabaseAdmin.from('user_progress').upsert(
    {
      user_email: email, module_id: moduleId, video_watched: true, video_watched_at: new Date().toISOString(),
      ...(hasQuiz ? {} : { quiz_passed: true, completed_at: new Date().toISOString() }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_email,module_id' }
  )
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({ ok: true, hasQuiz })
}

async function getQuiz(email, moduleId) {
  // Video-completion gate intentionally not enforced here — the JS block
  // allows jumping straight to the quiz.
  const cooldown = await getQuizCooldown(email, moduleId)
  if (cooldown) return corsJson({ error: `You need to wait ${cooldown.label} before retrying this quiz.`, cooldown }, { status: 429 })

  const { data: questions, error } = await supabaseAdmin
    .from('questions').select('id, question_text, order_index, options(id, option_text, order_index)')
    .eq('module_id', moduleId).order('order_index')
  if (error) return corsJson({ error: error.message }, { status: 500 })

  return corsJson({
    questions: (questions || []).map(q => ({
      id: q.id, questionText: q.question_text,
      options: (q.options || []).sort((a, b) => a.order_index - b.order_index).map(o => ({ id: o.id, optionText: o.option_text })),
    })),
  })
}

async function postQuizSubmit(email, body) {
  const { moduleId, answers } = body
  if (!moduleId || !answers) return corsJson({ error: 'moduleId and answers required' }, { status: 400 })

  // Video-completion gate intentionally not enforced here — the JS block
  // allows jumping straight to the quiz.
  const cooldown = await getQuizCooldown(email, moduleId)
  if (cooldown) return corsJson({ error: `You need to wait ${cooldown.label} before retrying this quiz.`, cooldown }, { status: 429 })

  const { data: mod, error: modErr } = await supabaseAdmin.from('modules').select('pass_score_pct').eq('id', moduleId).single()
  if (modErr) return corsJson({ error: modErr.message }, { status: 500 })

  const { data: questions, error: qErr } = await supabaseAdmin
    .from('questions').select('id, explanation, options(id, is_correct)').eq('module_id', moduleId)
  if (qErr) return corsJson({ error: qErr.message }, { status: 500 })

  let correctCount = 0
  const results = []
  for (const q of questions) {
    const chosenOptionId = answers[q.id]
    const correctOption = q.options.find(o => o.is_correct)
    const isCorrect = !!correctOption && chosenOptionId === correctOption.id
    if (isCorrect) correctCount++
    results.push({ questionId: q.id, correctOptionId: correctOption?.id ?? null, chosenOptionId: chosenOptionId ?? null, isCorrect, explanation: q.explanation || null })
  }

  const total = questions.length
  const scorePct = total ? Math.round((correctCount / total) * 100) : 0
  const passed = scorePct >= mod.pass_score_pct

  const { error: attemptErr } = await supabaseAdmin.from('quiz_attempts').insert({ user_email: email, module_id: moduleId, score_pct: scorePct, passed, answers })
  if (attemptErr) return corsJson({ error: attemptErr.message }, { status: 500 })

  const { data: existing } = await supabaseAdmin
    .from('user_progress').select('attempts, best_score_pct, quiz_passed').eq('user_email', email).eq('module_id', moduleId).maybeSingle()

  const { error: upsertErr } = await supabaseAdmin.from('user_progress').upsert(
    {
      user_email: email, module_id: moduleId, quiz_passed: passed || existing?.quiz_passed || false,
      best_score_pct: Math.max(existing?.best_score_pct || 0, scorePct), attempts: (existing?.attempts || 0) + 1,
      completed_at: passed ? new Date().toISOString() : undefined, updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_email,module_id' }
  )
  if (upsertErr) return corsJson({ error: upsertErr.message }, { status: 500 })

  return corsJson({ scorePct, passed, correctCount, total, results })
}

// ─────────────────────────── admin ───────────────────────────

async function adminGetChapters() {
  const { data, error } = await supabaseAdmin.from('chapters').select('id, title, description, order_index, modules(id)').order('order_index')
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({ chapters: data.map(c => ({ id: c.id, title: c.title, description: c.description, orderIndex: c.order_index, moduleCount: c.modules?.length || 0 })) })
}

async function adminCreateChapter(body) {
  const { title, description, orderIndex } = body
  if (!title) return corsJson({ error: 'title required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('chapters').insert({ title, description, order_index: orderIndex ?? 0 }).select().single()
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({ chapter: data })
}

async function adminDeleteChapter(id) {
  const { error } = await supabaseAdmin.from('chapters').delete().eq('id', id)
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({ ok: true })
}

async function adminGetModules(chapterId) {
  let q = supabaseAdmin.from('modules').select('id, chapter_id, title, description, video_url, order_index, pass_score_pct, questions(id)').order('order_index')
  if (chapterId) q = q.eq('chapter_id', chapterId)
  const { data, error } = await q
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({
    modules: data.map(m => ({
      id: m.id, chapterId: m.chapter_id, title: m.title, description: m.description, videoUrl: m.video_url,
      orderIndex: m.order_index, passScorePct: m.pass_score_pct, questionCount: m.questions?.length || 0,
    })),
  })
}

async function adminCreateModule(body) {
  const { chapterId, title, description, videoUrl, orderIndex, passScorePct } = body
  if (!chapterId || !title || !videoUrl) return corsJson({ error: 'chapterId, title and videoUrl required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('modules').insert({
    chapter_id: chapterId, title, description, video_url: videoUrl, order_index: orderIndex ?? 0, pass_score_pct: passScorePct ?? 90,
  }).select().single()
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({ module: data })
}

async function adminUpdateModule(id, body) {
  const { title, description, videoUrl, orderIndex, passScorePct } = body
  const { data, error } = await supabaseAdmin.from('modules').update({
    title, description, video_url: videoUrl, order_index: orderIndex, pass_score_pct: passScorePct,
  }).eq('id', id).select().single()
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({ module: data })
}

async function adminDeleteModule(id) {
  const { error } = await supabaseAdmin.from('modules').delete().eq('id', id)
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({ ok: true })
}

async function adminGetQuestions(moduleId) {
  if (!moduleId) return corsJson({ error: 'moduleId required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('questions').select('id, module_id, question_text, explanation, order_index, options(id, option_text, is_correct, order_index)')
    .eq('module_id', moduleId).order('order_index')
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({
    questions: data.map(q => ({
      id: q.id, moduleId: q.module_id, questionText: q.question_text, explanation: q.explanation, orderIndex: q.order_index,
      options: (q.options || []).sort((a, b) => a.order_index - b.order_index).map(o => ({ id: o.id, optionText: o.option_text, isCorrect: o.is_correct })),
    })),
  })
}

async function adminCreateQuestion(body) {
  const { moduleId, questionText, explanation, orderIndex, options } = body
  if (!moduleId || !questionText || !Array.isArray(options) || options.length < 2) return corsJson({ error: 'moduleId, questionText and at least 2 options required' }, { status: 400 })
  if (!options.some(o => o.isCorrect)) return corsJson({ error: 'At least one option must be marked correct' }, { status: 400 })

  const { data: question, error: qErr } = await supabaseAdmin
    .from('questions').insert({ module_id: moduleId, question_text: questionText, explanation: explanation || null, order_index: orderIndex ?? 0 }).select().single()
  if (qErr) return corsJson({ error: qErr.message }, { status: 500 })

  const { error: oErr } = await supabaseAdmin.from('options').insert(
    options.map((o, i) => ({ question_id: question.id, option_text: o.optionText, is_correct: !!o.isCorrect, order_index: i }))
  )
  if (oErr) return corsJson({ error: oErr.message }, { status: 500 })
  return corsJson({ questionId: question.id })
}

async function adminUpdateQuestion(id, body) {
  const { questionText, explanation, orderIndex, options } = body
  if (!Array.isArray(options) || options.length < 2 || !options.some(o => o.isCorrect)) return corsJson({ error: 'At least 2 options required, one marked correct' }, { status: 400 })

  const { error: qErr } = await supabaseAdmin.from('questions').update({ question_text: questionText, explanation: explanation || null, order_index: orderIndex }).eq('id', id)
  if (qErr) return corsJson({ error: qErr.message }, { status: 500 })

  const { error: delErr } = await supabaseAdmin.from('options').delete().eq('question_id', id)
  if (delErr) return corsJson({ error: delErr.message }, { status: 500 })

  const { error: insErr } = await supabaseAdmin.from('options').insert(
    options.map((o, i) => ({ question_id: id, option_text: o.optionText, is_correct: !!o.isCorrect, order_index: i }))
  )
  if (insErr) return corsJson({ error: insErr.message }, { status: 500 })
  return corsJson({ ok: true })
}

async function adminDeleteQuestion(id) {
  const { error } = await supabaseAdmin.from('questions').delete().eq('id', id)
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({ ok: true })
}

async function adminUploadUrl(body) {
  const { fileName } = body
  if (!fileName) return corsJson({ error: 'fileName required' }, { status: 400 })

  const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets()
  if (listErr) return corsJson({ error: listErr.message }, { status: 500 })
  if (!buckets?.some(b => b.name === BUCKET)) {
    const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
    if (createErr) return corsJson({ error: createErr.message }, { status: 500 })
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${Date.now()}-${safeName}`
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error) return corsJson({ error: error.message }, { status: 500 })
  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

  return corsJson({ path, token: data.token, signedUrl: data.signedUrl, publicUrl: pub.publicUrl })
}

async function adminGetVideos() {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) return corsJson({ error: error.message }, { status: 500 })
  const videos = (data || []).filter(f => f.id).map(f => ({
    name: f.name, sizeBytes: f.metadata?.size, createdAt: f.created_at,
    publicUrl: supabaseAdmin.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
  }))
  return corsJson({ videos })
}

async function adminGetActivity(params) {
  const emailFilter = params.get('filterEmail')?.trim().toLowerCase()
  const from = params.get('from')
  const to = params.get('to')

  const { data: modules, error: modErr } = await supabaseAdmin.from('modules').select('id, title, chapter_id, chapters(title)')
  if (modErr) return corsJson({ error: modErr.message }, { status: 500 })
  const moduleInfo = Object.fromEntries(modules.map(m => [m.id, { title: m.title, chapterTitle: m.chapters?.title }]))

  let progressQuery = supabaseAdmin.from('user_progress')
    .select('user_email, module_id, video_watched, video_watched_at, quiz_passed, best_score_pct, attempts, completed_at, cooldown_cleared_at, updated_at')
  if (emailFilter) progressQuery = progressQuery.ilike('user_email', `%${emailFilter}%`)
  if (from) progressQuery = progressQuery.gte('updated_at', from)
  if (to) progressQuery = progressQuery.lte('updated_at', `${to}T23:59:59`)
  const { data: progress, error: progErr } = await progressQuery
  if (progErr) return corsJson({ error: progErr.message }, { status: 500 })

  let attemptsQuery = supabaseAdmin.from('quiz_attempts').select('user_email, module_id, score_pct, passed, created_at').order('created_at', { ascending: false })
  if (emailFilter) attemptsQuery = attemptsQuery.ilike('user_email', `%${emailFilter}%`)
  if (from) attemptsQuery = attemptsQuery.gte('created_at', from)
  if (to) attemptsQuery = attemptsQuery.lte('created_at', `${to}T23:59:59`)
  const { data: attempts, error: attErr } = await attemptsQuery
  if (attErr) return corsJson({ error: attErr.message }, { status: 500 })

  const lastAttemptAt = {}
  for (const a of attempts) {
    const key = `${a.user_email}:${a.module_id}`
    if (!(key in lastAttemptAt)) lastAttemptAt[key] = a.created_at
  }

  const byUser = {}
  function getUser(email) {
    if (!byUser[email]) byUser[email] = { email, name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), videosWatched: 0, modulesCompleted: 0, totalAttempts: 0, avgScorePct: 0, lastActivityAt: null, modules: [], attempts: [] }
    return byUser[email]
  }

  for (const p of progress) {
    const u = getUser(p.user_email)
    if (p.video_watched) u.videosWatched++
    if (p.quiz_passed) u.modulesCompleted++
    const info = moduleInfo[p.module_id] || {}
    const lastAttempt = lastAttemptAt[`${p.user_email}:${p.module_id}`]
    u.modules.push({
      moduleId: p.module_id, moduleTitle: info.title, chapterTitle: info.chapterTitle, videoWatched: p.video_watched,
      videoWatchedAt: p.video_watched_at, quizPassed: p.quiz_passed, bestScorePct: p.best_score_pct, attempts: p.attempts,
      completedAt: p.completed_at, retryAllowed: !!(p.cooldown_cleared_at && lastAttempt && p.cooldown_cleared_at >= lastAttempt),
    })
    if (!u.lastActivityAt || p.updated_at > u.lastActivityAt) u.lastActivityAt = p.updated_at
  }
  for (const a of attempts) {
    const u = getUser(a.user_email)
    const info = moduleInfo[a.module_id] || {}
    u.totalAttempts++
    u.attempts.push({ moduleTitle: info.title, chapterTitle: info.chapterTitle, scorePct: a.score_pct, passed: a.passed, createdAt: a.created_at })
    if (!u.lastActivityAt || a.created_at > u.lastActivityAt) u.lastActivityAt = a.created_at
  }

  const users = Object.values(byUser).map(u => ({ ...u, avgScorePct: u.attempts.length ? Math.round(u.attempts.reduce((s, a) => s + a.scorePct, 0) / u.attempts.length) : 0 }))
    .sort((a, b) => (b.lastActivityAt || '').localeCompare(a.lastActivityAt || ''))

  return corsJson({ users })
}

async function adminClearCooldown(body) {
  const { targetEmail, moduleId } = body
  if (!targetEmail || !moduleId) return corsJson({ error: 'targetEmail and moduleId required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('user_progress').upsert(
    { user_email: targetEmail, module_id: moduleId, cooldown_cleared_at: new Date().toISOString() },
    { onConflict: 'user_email,module_id' }
  )
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson({ ok: true })
}

// ─────────────────────────── dispatcher ───────────────────────────

export async function GET(request, { params }) {
  const { path } = await params
  const sp = request.nextUrl.searchParams
  const email = sp.get('email')

  if (path[0] === 'admin') {
    const auth = requireBlockAdmin(request, email)
    if (auth.error) return auth.error
    if (path[1] === 'chapters') return adminGetChapters()
    if (path[1] === 'modules') return adminGetModules(sp.get('chapterId'))
    if (path[1] === 'questions') return adminGetQuestions(sp.get('moduleId'))
    if (path[1] === 'videos') return adminGetVideos()
    if (path[1] === 'activity') return adminGetActivity(sp)
    return corsJson({ error: 'Not found' }, { status: 404 })
  }

  const auth = verifyBlockRequest(request, email)
  if (auth.error) return auth.error
  if (path[0] === 'curriculum') return getCurriculum(email)
  if (path[0] === 'module') return getModule(email, path[1])
  if (path[0] === 'quiz') return getQuiz(email, path[1])
  return corsJson({ error: 'Not found' }, { status: 404 })
}

export async function POST(request, { params }) {
  const { path } = await params
  const body = await request.json()
  const email = body.email

  if (path[0] === 'admin') {
    const auth = requireBlockAdmin(request, email)
    if (auth.error) return auth.error
    if (path[1] === 'chapters') return adminCreateChapter(body)
    if (path[1] === 'modules') return adminCreateModule(body)
    if (path[1] === 'questions') return adminCreateQuestion(body)
    if (path[1] === 'upload-url') return adminUploadUrl(body)
    if (path[1] === 'clear-cooldown') return adminClearCooldown(body)
    return corsJson({ error: 'Not found' }, { status: 404 })
  }

  const auth = verifyBlockRequest(request, email)
  if (auth.error) return auth.error
  if (path[0] === 'video-complete') return postVideoComplete(email, body)
  if (path[0] === 'quiz-submit') return postQuizSubmit(email, body)
  return corsJson({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request, { params }) {
  const { path } = await params
  const body = await request.json()
  const email = body.email

  const auth = requireBlockAdmin(request, email)
  if (auth.error) return auth.error
  if (path[0] === 'admin' && path[1] === 'modules') return adminUpdateModule(path[2], body)
  if (path[0] === 'admin' && path[1] === 'questions') return adminUpdateQuestion(path[2], body)
  return corsJson({ error: 'Not found' }, { status: 404 })
}

export async function DELETE(request, { params }) {
  const { path } = await params
  const sp = request.nextUrl.searchParams
  const email = sp.get('email')

  const auth = requireBlockAdmin(request, email)
  if (auth.error) return auth.error
  if (path[0] === 'admin' && path[1] === 'chapters') return adminDeleteChapter(path[2])
  if (path[0] === 'admin' && path[1] === 'modules') return adminDeleteModule(path[2])
  if (path[0] === 'admin' && path[1] === 'questions') return adminDeleteQuestion(path[2])
  return corsJson({ error: 'Not found' }, { status: 404 })
}
