'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

  function handleKeyDown(e) {
    if (e.key === 'Enter' && email) handleSendCode()
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

        <label style={{ fontSize: '0.85rem', color: '#444', fontWeight: '500' }}>
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="you@example.com"
          autoFocus
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
          onClick={handleSendCode}
          disabled={loading || !email}
          style={{
            width: '100%', padding: '11px', background: '#1a1a1a',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '0.95rem', cursor: 'pointer', fontWeight: '500',
            opacity: !email ? 0.6 : 1
          }}
        >
          {loading ? 'Sending...' : 'Send Login Code'}
        </button>
      </div>
    </main>
  )
}
