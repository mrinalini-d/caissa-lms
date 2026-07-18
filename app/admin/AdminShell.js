'use client'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'

const NAV_ITEMS = [
  { icon: '📦', label: 'Content', href: '/admin/content' },
  { icon: '📈', label: 'Activity', href: '/admin/users' },
]

export default function AdminShell({ user, title, subtitle, children }) {
  const router = useRouter()
  const pathname = usePathname()
  const initials = user?.email?.charAt(0).toUpperCase()

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      <aside style={{
        width: '240px', minWidth: '240px', background: '#ffffff',
        borderRight: '1px solid #f0f0f3',
        display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            <Image src="/cc_logo.png" alt="Caissa" width={48} height={48} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ icon, label, href }) => {
            const isActive = pathname?.startsWith(href)
            return (
              <button key={label} onClick={() => router.push(href)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '11px 14px', borderRadius: '10px', border: 'none', marginBottom: '4px',
                background: isActive ? '#f3eeff' : 'transparent',
                color: isActive ? '#7c3aed' : '#6b7280',
                fontSize: '0.85rem', fontWeight: isActive ? '600' : '500',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '1.1rem', width: '20px', textAlign: 'center' }}>{icon}</span>
                {label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid #f3f4f6' }}>
          <button onClick={() => router.push('/dashboard')} style={{
            width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none',
            background: 'transparent', color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left',
          }}>
            ← Back to Trainee View
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          background: 'white', borderBottom: '1px solid #f3f4f6',
          padding: '0 32px', height: '64px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', margin: 0 }}>{title}</h1>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: 0 }}>{subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '700', fontSize: '0.9rem',
              }}>{initials}</div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#111827' }}>{user?.email?.split('@')[0]}</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Admin</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              padding: '7px 14px', background: '#faf5ff', color: '#7c3aed',
              border: '1px solid #ede9fe', borderRadius: '8px',
              fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
            }}>Sign out</button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#f4f5f7' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
