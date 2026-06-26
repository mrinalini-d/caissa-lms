'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSendCode() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      setLoading(false)
    } else {
      router.push(`/verify?email=${encodeURIComponent(email)}`)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Left panel */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', color: 'white',
        minHeight: '100vh',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image src="/cc_logo.svg" alt="Caissa" width={40} height={40} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', letterSpacing: '0.05em' }}>CAISSA LMS</div>
            <div style={{ fontSize: '0.7rem', color: '#c4b5fd', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Coach Training Portal</div>
          </div>
        </div>

        {/* Tagline */}
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.8rem', color: '#c4b5fd', marginBottom: '24px' }}>
            ♟ Certified Coach Program
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', lineHeight: '1.15', margin: '0 0 16px' }}>
            Train smarter.<br />Coach better.
          </h1>
          <p style={{ color: '#c4b5fd', fontSize: '1rem', lineHeight: '1.7', maxWidth: '360px', margin: 0 }}>
            Access structured modules, expert lessons, and certifications to become a top-rated Caissa chess coach.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '32px' }}>
          {[['120+', 'Lessons'], ['6', 'Modules'], ['1', 'Certification']].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#a78bfa' }}>{n}</div>
              <div style={{ fontSize: '0.78rem', color: '#c4b5fd' }}>{l}</div>
            </div>
          ))}
        </div>
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
            Welcome back
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
            Sign in to continue your training
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && email && handleSendCode()}
            placeholder="you@example.com"
            autoFocus
            style={{
              width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb',
              borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
              fontFamily: 'inherit',
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
          onClick={handleSendCode}
          disabled={loading || !email}
          style={{
            width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
            background: email && !loading ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#e5e7eb',
            color: email && !loading ? 'white' : '#9ca3af',
            fontSize: '0.95rem', fontWeight: '600', cursor: email ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
        >
          {loading ? 'Sending code…' : 'Send Login Code →'}
        </button>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: '24px' }}>
          We'll send a 6-digit code to your email
        </p>
      </div>
    </div>
  )
}
