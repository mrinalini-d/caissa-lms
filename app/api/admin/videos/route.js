import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

const BUCKET = 'videos'

export async function GET() {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list('', {
    limit: 200,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const videos = (data || [])
    .filter(f => f.id) // skip folder placeholders
    .map(f => ({
      name: f.name,
      sizeBytes: f.metadata?.size,
      createdAt: f.created_at,
      publicUrl: supabaseAdmin.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
    }))

  return NextResponse.json({ videos })
}

export async function DELETE(request) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const name = request.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([name])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
