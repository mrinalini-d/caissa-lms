import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

if (!global._caissaCodes) global._caissaCodes = new Map()
const codes = global._caissaCodes

export async function POST(request) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const code = String(Math.floor(100000 + Math.random() * 900000))
  codes.set(email.toLowerCase(), { code, expiry: Date.now() + 5 * 60 * 1000 })

  console.log(`\n[Caissa LMS] Verification code for ${email}: ${code}\n`)

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ''),
        },
      })

      const info = await transporter.sendMail({
        from: `"Caissa LMS" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your Caissa LMS login code',
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
            <h2 style="color:#7c3aed;margin-bottom:8px">Caissa LMS</h2>
            <p style="color:#444">Your 6-digit login code is:</p>
            <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#111;margin:24px 0;font-family:monospace">${code}</div>
            <p style="color:#888;font-size:0.85rem">This code expires in 5 minutes.<br>Do not share it with anyone.</p>
          </div>
        `,
      })

      console.log(`[Caissa LMS] Email sent: ${info.messageId} → ${email}`)
    } catch (err) {
      console.error(`[Caissa LMS] Email FAILED for ${email}:`, err.message)
      return NextResponse.json({ error: 'Failed to send email. Try again.' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
