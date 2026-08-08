import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  const info = {
    urlPresent: !!url,
    urlLength: url?.length,
    urlPreview: url ? `${url.slice(0, 20)}...${url.slice(-10)}` : null,
    anonPresent: !!anon,
    servicePresent: !!service,
  }

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: anon || '', Authorization: `Bearer ${anon || ''}` },
    })
    info.fetchStatus = res.status
    info.fetchOk = res.ok
  } catch (err) {
    info.fetchError = err.message
    info.fetchErrorCause = err.cause?.message || String(err.cause)
  }

  return NextResponse.json(info)
}
