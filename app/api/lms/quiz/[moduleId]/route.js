import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserEmail } from '@/lib/session'

export async function GET(request, { params }) {
  const userEmail = await getUserEmail()
  if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleId } = await params

  const { data: progress } = await supabaseAdmin
    .from('user_progress')
    .select('video_watched')
    .eq('user_email', userEmail)
    .eq('module_id', moduleId)
    .maybeSingle()

  if (!progress?.video_watched) {
    return NextResponse.json({ error: 'Watch the full video before starting the quiz' }, { status: 403 })
  }

  const { data: questions, error } = await supabaseAdmin
    .from('questions')
    .select('id, question_text, order_index, options(id, option_text, order_index)')
    .eq('module_id', moduleId)
    .order('order_index')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Never send is_correct to the client.
  const safeQuestions = (questions || []).map(q => ({
    id: q.id,
    questionText: q.question_text,
    options: (q.options || [])
      .sort((a, b) => a.order_index - b.order_index)
      .map(o => ({ id: o.id, optionText: o.option_text })),
  }))

  return NextResponse.json({ questions: safeQuestions })
}
