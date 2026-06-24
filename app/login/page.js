'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif',
      background: '#f9f9f9'
    }}>
      <div style={{
        background: 'white', padding: '40px', borderRadius: '12px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>
          Caissa LMS
        </h1>
        <p style={{ color: '#666', marginBottom: '24px', fontSize: '0.9rem' }}>
          Coach Training Portal
        </p>

        {sent ? (
          <div style={{ textAlign: 'center', color: '#333' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📬</div>
            <p style={{ fontWeight: 'bold' }}>Check your email</p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '8px' }}>
              We sent a login link to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <>
            <label style={{ fontSize: '0.85rem', color: '#444', fontWeight: '500' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '10px 12px', marginTop: '6px',
                marginBottom: '16px', border: '1px solid #ddd', borderRadius: '8px',
                fontSize: '0.95rem', boxSizing: 'border-box'
              }}
            />
            {error && (
              <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '12px' }}>
                {error}
              </p>
            )}
            <button
              onClick={handleLogin}
              disabled={loading || !email}
              style={{
                width: '100%', padding: '11px', background: '#1a1a1a',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '0.95rem', cursor: 'pointer', fontWeight: '500'
              }}
            >
              {loading ? 'Sending...' : 'Send Login Link'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
