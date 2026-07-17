import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAdminEmail } from '@/lib/session'

const BUCKET = 'videos'

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: '500MB' })
  }
}

export async function POST(request) {
  if (!(await getAdminEmail())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { fileName } = await request.json()
  if (!fileName) return NextResponse.json({ error: 'fileName required' }, { status: 400 })

  await ensureBucket()

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${Date.now()}-${safeName}`

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
  })
}
