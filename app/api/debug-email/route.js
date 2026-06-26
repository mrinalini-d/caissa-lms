import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPass) {
    return NextResponse.json({ error: 'Env vars missing', gmailUser: !!gmailUser, gmailPass: !!gmailPass })
  }

  const cleanPass = gmailPass.replace(/\s/g, '')

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: cleanPass },
    })

    await transporter.verify()

    return NextResponse.json({
      status: 'SMTP connection OK',
      gmailUser,
      passLength: cleanPass.length,
    })
  } catch (err) {
    return NextResponse.json({
      status: 'FAILED',
      error: err.message,
      code: err.code,
      responseCode: err.responseCode,
      response: err.response,
      gmailUser,
      passLength: cleanPass.length,
    }, { status: 500 })
  }
}
