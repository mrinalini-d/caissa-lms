'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import { theme as t } from '../theme'

const NAV_ITEMS = [
  {
    label: 'Dashboard', href: '/dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  },
  {
    label: 'Training', href: '/training',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
  },
]

const ADMIN_ITEM = {
  label: 'Admin', href: '/admin',
  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></svg>,
}

export default function AppShell({ user, title, subtitle, children }) {
  const router = useRouter()
  const pathname = usePathname()
  const initials = user?.email?.charAt(0).toUpperCase()
  const navItems = isAdminEmail(user?.email) ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    fetch('/api/lms/curriculum').then(r => r.json()).then(j => !j.error && setProgress(j)).catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: t.fontBody, overflow: 'hidden', background: t.paper }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '248px', minWidth: '248px', background: t.slate, color: '#D8DCE6',
        padding: '28px 18px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', marginBottom: 28 }}
        >
          <img src="/cc_logo.png" alt="Caissa" width={48} height={48} style={{ borderRadius: 10 }} />
        </button>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {navItems.map(({ icon, label, href }) => {
            const isActive = pathname?.startsWith(href)
            return (
              <div
                key={label}
                onClick={() => router.push(href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 9,
                  marginBottom: 2, fontSize: 14, fontWeight: 500, cursor: 'pointer', position: 'relative',
                  background: isActive ? t.slateSoft : 'transparent',
                  color: isActive ? '#fff' : '#AEB4C2',
                  transition: 'background .15s, color .15s',
                }}
              >
                {isActive && (
                  <span style={{ position: 'absolute', left: -18, top: 8, bottom: 8, width: 3, background: t.amber, borderRadius: 2 }} />
                )}
                <span style={{ opacity: 0.85, display: 'flex' }}>{icon}</span>
                {label}
              </div>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 18, borderTop: '1px solid #2E384A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 11px', background: t.slateSoft, borderRadius: 10, fontSize: 12.5, color: '#AEB4C2' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.amber, flexShrink: 0 }} />
            {progress ? `Trainee — ${progress.completedModules} of ${progress.totalModules} modules cleared` : 'Trainee'}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{
          padding: '28px 44px 0', display: 'flex',
          alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontFamily: t.fontHeading, fontWeight: 600, fontSize: 26, color: t.ink, margin: 0, letterSpacing: '-0.01em' }}>{title}</h1>
            <p style={{ fontSize: '14.5px', color: t.inkSoft, margin: '5px 0 0' }}>{subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: t.paperRaised, border: `1px solid ${t.line}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.inkSoft, cursor: 'pointer',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `linear-gradient(160deg, ${t.amber}, ${t.amberDeep})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 600, fontSize: 14, fontFamily: t.fontHeading,
              }}>{initials}</div>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>{user?.email?.split('@')[0]}</div>
                <div style={{ fontSize: 12, color: t.inkSoft }}>Coach Trainee</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              padding: '8px 16px', borderRadius: 9, border: `1px solid ${t.line}`, background: t.paperRaised,
              fontSize: 13.5, fontWeight: 600, color: t.ink, cursor: 'pointer',
            }}>
              Sign out
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 44px 60px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
