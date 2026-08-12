'use client'
import { useRouter, usePathname } from 'next/navigation'
import { theme as t } from '../theme'

const NAV_ITEMS = [
  { icon: '📦', label: 'Content', href: '/admin/content' },
  { icon: '📈', label: 'Activity', href: '/admin/users' },
  { icon: '🗂', label: 'Storage', href: '/admin/storage' },
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
    <div style={{ display: 'flex', height: '100vh', fontFamily: t.fontBody, overflow: 'hidden', background: t.paper }}>
      <aside style={{
        width: '248px', minWidth: '248px', background: t.paperRaised,
        borderRight: `1px solid ${t.line}`,
        padding: '28px 18px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', marginBottom: 28 }}
        >
          <img src="/cc_logo.png" alt="Caissa" width={64} height={64} style={{ borderRadius: 12 }} />
        </button>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ icon, label, href }) => {
            const isActive = pathname?.startsWith(href)
            return (
              <button key={label} onClick={() => router.push(href)} style={{
                display: 'flex', alignItems: 'center', gap: '11px', width: '100%',
                padding: '10px 12px', borderRadius: '9px', border: 'none', marginBottom: '2px', position: 'relative',
                background: isActive ? t.amberTint : 'transparent',
                color: isActive ? t.amberDeep : t.inkSoft,
                fontSize: '14px', fontWeight: isActive ? '600' : '500',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}>
                {isActive && (
                  <span style={{ position: 'absolute', left: -18, top: 8, bottom: 8, width: 3, background: t.amber, borderRadius: 2 }} />
                )}
                <span style={{ fontSize: '1.1rem', width: '20px', textAlign: 'center' }}>{icon}</span>
                {label}
              </button>
            )
          })}
        </nav>

        <div style={{ paddingTop: 18, borderTop: `1px solid ${t.line}` }}>
          <button onClick={() => router.push('/dashboard')} style={{
            width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none',
            background: 'transparent', color: t.inkSoft, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left',
          }}>
            ← Back to Trainee View
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          padding: '28px 44px 0', display: 'flex',
          alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontFamily: t.fontHeading, fontWeight: 600, fontSize: 26, color: t.ink, margin: 0, letterSpacing: '-0.01em' }}>{title}</h1>
            <p style={{ fontSize: '14.5px', color: t.inkSoft, margin: '5px 0 0' }}>{subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: `linear-gradient(160deg, ${t.amber}, ${t.amberDeep})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '600', fontSize: '14px', fontFamily: t.fontHeading,
              }}>{initials}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: t.ink }}>{user?.email?.split('@')[0]}</div>
                <div style={{ fontSize: '12px', color: t.inkSoft }}>Admin</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              padding: '8px 16px', background: t.paperRaised, color: t.ink,
              border: `1px solid ${t.line}`, borderRadius: '9px',
              fontSize: '13.5px', fontWeight: '600', cursor: 'pointer',
            }}>Sign out</button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 44px 60px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
