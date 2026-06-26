import { NextResponse } from 'next/server'

if (!global._caissaCodes) global._caissaCodes = new Map()
const codes = global._caissaCodes

export async function POST(request) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const code = String(Math.floor(100000 + Math.random() * 900000))
  codes.set(email.toLowerCase(), { code, expiry: Date.now() + 5 * 60 * 1000 })

  console.log(`\n[Caissa LMS] Verification code for ${email}: ${code}\n`)

  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Caissa LMS <onboarding@resend.dev>',
          to: [email],
          subject: 'Your Caissa LMS login code',
          html: `
            <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
              <h2 style="color:#7c3aed;margin-bottom:8px">Caissa LMS</h2>
              <p style="color:#444">Your 6-digit login code is:</p>
              <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#111;margin:24px 0;font-family:monospace">${code}</div>
              <p style="color:#888;font-size:0.85rem">This code expires in 5 minutes.<br>Do not share it with anyone.</p>
            </div>
          `,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        console.error(`[Caissa LMS] Resend error for ${email}:`, JSON.stringify(data))
        return NextResponse.json({ error: 'Failed to send email. Try again.' }, { status: 500 })
      }

      console.log(`[Caissa LMS] Email sent via Resend: ${data.id} → ${email}`)
    } catch (err) {
      console.error(`[Caissa LMS] Email FAILED for ${email}:`, err.message)
      return NextResponse.json({ error: 'Failed to send email. Try again.' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
