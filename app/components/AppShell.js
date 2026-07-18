'use client'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { isAdminEmail } from '@/lib/admin'

const NAV_ITEMS = [
  { icon: '⊞', label: 'Dashboard', href: '/dashboard' },
  { icon: '📚', label: 'Training', href: '/training' },
]

export default function AppShell({ user, title, subtitle, children }) {
  const router = useRouter()
  const pathname = usePathname()
  const initials = user?.email?.charAt(0).toUpperCase()
  const navItems = isAdminEmail(user?.email)
    ? [...NAV_ITEMS, { icon: '🛠', label: 'Admin', href: '/admin' }]
    : NAV_ITEMS

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '240px', minWidth: '240px', background: '#ffffff',
        borderRight: '1px solid #f0f0f3',
        display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image src="/cc_logo.png" alt="Caissa" width={36} height={36} />
            <div style={{ color: '#7c3aed', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Caissa Training
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav style={{ flex: 1, padding: '16px 12px 0', overflowY: 'auto' }}>
          {navItems.map(({ icon, label, href }) => {
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
            <h1 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', margin: 0 }}>{title}</h1>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: 0 }}>{subtitle}</p>
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
          {children}
        </main>
      </div>
    </div>
  )
}
