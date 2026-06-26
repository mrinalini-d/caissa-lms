'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadDashboard() {
      const res = await fetch('/api/me')
      const { user } = await res.json()
      if (!user) { router.push('/login'); return }
      setUser(user)
      setLoading(false)
    }
    loadDashboard()
  }, [])

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      Loading...
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#f4f4f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#111', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Caissa LMS</div>
          <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Coach Training Portal</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: '#ccc' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '4px' }}>Welcome 👋</h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Complete all modules to become a certified Caissa coach.
        </p>

        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#888', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          No modules available yet. Check back soon.
        </div>
      </div>
    </main>
  )
}
