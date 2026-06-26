'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyForm() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  async function handleVerify() {
    if (code.length !== 6) { setError('Enter the 6-digit code'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleVerify()
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

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📬</div>
          <p style={{ fontWeight: '600', marginBottom: '4px' }}>Check your email</p>
          <p style={{ color: '#666', fontSize: '0.85rem' }}>
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        <label style={{ fontSize: '0.85rem', color: '#444', fontWeight: '500' }}>
          Verification code
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={handleKeyDown}
          placeholder="000000"
          autoFocus
          style={{
            width: '100%', padding: '12px', marginTop: '6px', marginBottom: '16px',
            border: '1px solid #ddd', borderRadius: '8px', fontSize: '1.4rem',
            letterSpacing: '8px', textAlign: 'center', boxSizing: 'border-box',
            fontFamily: 'monospace'
          }}
        />

        {error && (
          <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '12px' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          style={{
            width: '100%', padding: '11px', background: '#1a1a1a',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '0.95rem', cursor: code.length === 6 ? 'pointer' : 'not-allowed',
            fontWeight: '500', opacity: code.length !== 6 ? 0.6 : 1
          }}
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>

        <button
          onClick={() => router.push('/login')}
          style={{
            width: '100%', marginTop: '12px', padding: '10px', background: 'transparent',
            color: '#666', border: 'none', fontSize: '0.85rem', cursor: 'pointer'
          }}
        >
          ← Back to login
        </button>
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
