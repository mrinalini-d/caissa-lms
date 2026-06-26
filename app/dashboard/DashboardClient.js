'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const NAV_ITEMS = [
  { icon: '⊞', label: 'Dashboard' },
  { icon: '📚', label: 'My Courses' },
  { icon: '🔖', label: 'Bookmarks' },
  { icon: '♟', label: 'Practice' },
  { icon: '📊', label: 'Performance' },
  { icon: '🎓', label: 'Certificates' },
]

const BOTTOM_NAV = [
  { icon: '⚙', label: 'Settings' },
  { icon: '❓', label: 'Help & Support' },
]

const MOCK_MODULES = [
  { id: 1, title: 'Foundations of Chess', lessons: 6, color: '#7c3aed' },
  { id: 2, title: 'Tactics', lessons: 12, color: '#2563eb' },
  { id: 3, title: 'Strategy', lessons: 10, color: '#059669' },
  { id: 4, title: 'Openings', lessons: 12, color: '#d97706' },
  { id: 5, title: 'Middlegame', lessons: 14, color: '#dc2626' },
  { id: 6, title: 'Endgame', lessons: 8, color: '#7c3aed' },
]

export default function DashboardClient({ user }) {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const router = useRouter()
  const initials = user?.email?.charAt(0).toUpperCase()

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '240px', minWidth: '240px', background: '#0f0e1a',
        display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image src="/cc_logo.svg" alt="Caissa" width={36} height={36} />
            <div style={{ color: '#a78bfa', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Caissa Training
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav style={{ flex: 1, padding: '12px 12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ icon, label }) => {
            const isActive = activeNav === label
            return (
              <button key={label} onClick={() => setActiveNav(label)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: isActive ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: isActive ? '#a78bfa' : '#6b7280',
                fontSize: '0.875rem', fontWeight: isActive ? '600' : '400',
                cursor: 'pointer', textAlign: 'left', marginBottom: '2px', transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>{icon}</span>
                {label}
                {isActive && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }} />}
              </button>
            )
          })}
        </nav>

        {/* Bottom nav */}
        <div style={{ padding: '0 12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {BOTTOM_NAV.map(({ icon, label }) => (
            <button key={label} style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
              padding: '10px 12px', borderRadius: '8px', border: 'none',
              background: 'transparent', color: '#6b7280',
              fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', marginBottom: '2px',
            }}>
              <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Upgrade card */}
        <div style={{ margin: '8px 12px 16px', background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#ddd6fe', fontWeight: '600', marginBottom: '4px' }}>💎 Go Premium</div>
          <div style={{ fontSize: '0.72rem', color: '#c4b5fd', lineHeight: '1.5', marginBottom: '12px' }}>
            Unlock all courses, practice sets and more.
          </div>
          <button style={{
            width: '100%', padding: '8px', background: 'white', color: '#7c3aed',
            border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer',
          }}>Upgrade Now</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{
          background: 'white', borderBottom: '1px solid #f3f4f6',
          padding: '0 32px', height: '64px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: 0 }}>Welcome back, {user?.email?.split('@')[0]}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#9ca3af' }}>🔔</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '700', fontSize: '0.9rem',
              }}>{initials}</div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#111827' }}>{user?.email?.split('@')[0]}</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Coach Trainee</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              padding: '7px 14px', background: '#faf5ff', color: '#7c3aed',
              border: '1px solid #ede9fe', borderRadius: '8px',
              fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
            }}>Sign out</button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#f4f5f7' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
            {[
              { label: 'Modules Enrolled', value: '6', sub: 'Total modules', icon: '📚', color: '#7c3aed', bg: '#faf5ff' },
              { label: 'Completed', value: '0', sub: 'Modules done', icon: '✅', color: '#059669', bg: '#f0fdf4' },
              { label: 'Certification', value: '0%', sub: 'Progress to cert', icon: '🎓', color: '#d97706', bg: '#fffbeb' },
            ].map(({ label, value, sub, icon, bg }) => (
              <div key={label} style={{
                background: 'white', borderRadius: '16px', padding: '20px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827' }}>{value}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#111827' }}>{label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall progress */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>Overall Training Progress</div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '2px' }}>Complete all 6 modules to earn your Caissa Coach certificate</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#7c3aed' }}>0%</div>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: '99px', height: '8px' }}>
              <div style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: '99px', height: '8px', width: '0%' }} />
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#9ca3af' }}>0 of 6 modules completed</div>
          </div>

          {/* Modules grid */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', margin: 0 }}>Training Modules</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {MOCK_MODULES.map((mod, index) => {
              const isFirst = index === 0
              const isLocked = index > 0
              return (
                <div key={mod.id} style={{
                  background: 'white', borderRadius: '16px', padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: isFirst ? '1.5px solid #ede9fe' : '1.5px solid transparent',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.6 : 1, transition: 'box-shadow 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '10px',
                        background: isLocked ? '#f3f4f6' : `${mod.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0,
                      }}>
                        {isLocked ? '🔒' : '♟'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#111827' }}>
                          {index + 1}. {mod.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                          {mod.lessons} Lessons
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
                      background: isFirst ? '#faf5ff' : '#f3f4f6',
                      color: isFirst ? '#7c3aed' : '#9ca3af', flexShrink: 0,
                    }}>
                      {isFirst ? 'Start' : 'Locked'}
                    </span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: '99px', height: '4px' }}>
                    <div style={{ background: mod.color, borderRadius: '99px', height: '4px', width: '0%' }} />
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#9ca3af' }}>
                    0 / {mod.lessons} lessons complete
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
