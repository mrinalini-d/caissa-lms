import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserEmail } from '@/lib/session'

export async function POST(request) {
  const userEmail = await getUserEmail()
  if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleId } = await request.json()
  if (!moduleId) return NextResponse.json({ error: 'moduleId required' }, { status: 400 })

  const { count: questionCount } = await supabaseAdmin
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('module_id', moduleId)

  // Modules with no quiz auto-complete on video watch — nothing to gate on.
  const hasQuiz = (questionCount || 0) > 0

  const { error } = await supabaseAdmin
    .from('user_progress')
    .upsert(
      {
        user_email: userEmail,
        module_id: moduleId,
        video_watched: true,
        video_watched_at: new Date().toISOString(),
        ...(hasQuiz ? {} : { quiz_passed: true, completed_at: new Date().toISOString() }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email,module_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, hasQuiz })
}
