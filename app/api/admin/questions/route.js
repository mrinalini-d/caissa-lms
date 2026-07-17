import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

export async function GET(request) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const moduleId = request.nextUrl.searchParams.get('moduleId')
  if (!moduleId) return NextResponse.json({ error: 'moduleId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('id, module_id, question_text, order_index, options(id, option_text, is_correct, order_index)')
    .eq('module_id', moduleId)
    .order('order_index')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    questions: data.map(q => ({
      id: q.id, moduleId: q.module_id, questionText: q.question_text, orderIndex: q.order_index,
      options: (q.options || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map(o => ({ id: o.id, optionText: o.option_text, isCorrect: o.is_correct })),
    })),
  })
}

export async function POST(request) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { moduleId, questionText, orderIndex, options } = await request.json()
  if (!moduleId || !questionText || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json({ error: 'moduleId, questionText and at least 2 options required' }, { status: 400 })
  }
  if (!options.some(o => o.isCorrect)) {
    return NextResponse.json({ error: 'At least one option must be marked correct' }, { status: 400 })
  }

  const { data: question, error: qErr } = await supabaseAdmin
    .from('questions')
    .insert({ module_id: moduleId, question_text: questionText, order_index: orderIndex ?? 0 })
    .select()
    .single()
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  const { error: oErr } = await supabaseAdmin.from('options').insert(
    options.map((o, i) => ({
      question_id: question.id, option_text: o.optionText, is_correct: !!o.isCorrect, order_index: i,
    }))
  )
  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })

  return NextResponse.json({ questionId: question.id })
}
