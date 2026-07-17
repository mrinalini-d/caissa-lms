import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

export async function PUT(request, { params }) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { questionId } = await params
  const { questionText, orderIndex, options } = await request.json()
  if (!Array.isArray(options) || options.length < 2 || !options.some(o => o.isCorrect)) {
    return NextResponse.json({ error: 'At least 2 options required, one marked correct' }, { status: 400 })
  }

  const { error: qErr } = await supabaseAdmin
    .from('questions')
    .update({ question_text: questionText, order_index: orderIndex })
    .eq('id', questionId)
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  // Replace options wholesale — simplest way to keep them in sync with the edit form.
  const { error: delErr } = await supabaseAdmin.from('options').delete().eq('question_id', questionId)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  const { error: insErr } = await supabaseAdmin.from('options').insert(
    options.map((o, i) => ({
      question_id: questionId, option_text: o.optionText, is_correct: !!o.isCorrect, order_index: i,
    }))
  )
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request, { params }) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { questionId } = await params

  const { error } = await supabaseAdmin.from('questions').delete().eq('id', questionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
