'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Left panel */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image src="/cc_logo.png" alt="Caissa" width={40} height={40} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', letterSpacing: '0.05em' }}>CAISSA LMS</div>
            <div style={{ fontSize: '0.7rem', color: '#c4b5fd', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Coach Training Portal</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📬</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: '1.2', margin: '0 0 12px' }}>
            Check your inbox
          </h1>
          <p style={{ color: '#c4b5fd', fontSize: '1rem', lineHeight: '1.7', maxWidth: '340px', margin: 0 }}>
            We sent a 6-digit verification code to<br />
            <strong style={{ color: 'white' }}>{email}</strong>
          </p>
        </div>

        <p style={{ color: '#7c6fcd', fontSize: '0.82rem' }}>
          Didn't receive it? Check your spam folder or go back to request a new code.
        </p>
      </div>

      {/* Right panel */}
      <div style={{
        width: '480px', background: 'white', display: 'flex',
        flexDirection: 'column', justifyContent: 'center', padding: '64px 56px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <Image src="/cc_logo.png" alt="Caissa" width={64} height={64} style={{ borderRadius: '16px' }} />
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>
            Enter your code
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
            Type the 6-digit code from your email
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Verification code
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            placeholder="000000"
            autoFocus
            style={{
              width: '100%', padding: '16px 14px', border: '1.5px solid #e5e7eb',
              borderRadius: '10px', fontSize: '2rem', letterSpacing: '12px',
              textAlign: 'center', fontFamily: 'monospace', outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          style={{
            width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
            background: code.length === 6 && !loading ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#e5e7eb',
            color: code.length === 6 && !loading ? 'white' : '#9ca3af',
            fontSize: '0.95rem', fontWeight: '600', cursor: code.length === 6 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
        >
          {loading ? 'Verifying…' : 'Verify & Sign In →'}
        </button>

        <button
          onClick={() => router.push('/login')}
          style={{
            width: '100%', marginTop: '12px', padding: '12px', background: 'transparent',
            color: '#7c3aed', border: '1.5px solid #ede9fe', borderRadius: '10px',
            fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ← Back to login
        </button>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
