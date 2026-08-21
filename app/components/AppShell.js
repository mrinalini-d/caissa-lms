'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import { theme as t } from '../theme'

const NAV_ITEMS = [
  {
    label: 'Dashboard', href: '/dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  },
  {
    label: 'Training', href: '/training',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /></svg>,
  },
]

const ADMIN_ITEM = {
  label: 'Admin', href: '/admin',
  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M3 17l5-5 4 4 9-9" /><path d="M14 7h7v7" /></svg>,
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

  const pct = progress?.totalModules ? Math.round((progress.completedModules / progress.totalModules) * 100) : 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: t.fontBody, background: t.bg, color: t.text }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 264, flexShrink: 0, background: t.surface, borderRight: `1px solid ${t.border}`,
        padding: '28px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px 8px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}
          >
            <img src="/cc_logo.png" alt="Caissa" width={124} height={124} style={{ borderRadius: 12 }} />
          </button>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {navItems.map(({ icon, label, href }) => {
              const isActive = pathname?.startsWith(href)
              return (
                <button key={label} onClick={() => router.push(href)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                  padding: '11px 12px', borderRadius: t.radiusSm, border: 'none', textAlign: 'left',
                  background: isActive ? t.goldSoft : 'transparent',
                  color: isActive ? t.goldDark : t.textMuted,
                  fontWeight: 600, fontSize: '14.5px', fontFamily: 'inherit', cursor: 'pointer',
                }}>
                  <span style={{ opacity: isActive ? 1 : 0.8, display: 'flex' }}>{icon}</span>
                  {label}
                </button>
              )
            })}
          </nav>
        </div>

        <div style={{ background: t.caramelSoft, border: '1px solid #E2CFA9', borderRadius: t.radiusMd, padding: '14px 14px 15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.caramel }} />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: t.caramel, textTransform: 'uppercase', letterSpacing: '.05em' }}>Coach Trainee</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 9 }}>
            {progress ? `${progress.completedModules} of ${progress.totalModules} modules cleared` : 'Loading…'}
          </div>
          <div style={{ height: 5, borderRadius: 99, background: '#E2CFA9', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: t.caramel, borderRadius: 99 }} />
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, padding: '32px 40px 60px', maxWidth: 1320 }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 26 }}>
          <div>
            <h1 style={{ fontFamily: t.fontHeading, fontWeight: 600, fontSize: 34, margin: '0 0 5px', letterSpacing: '-0.01em' }}>{title}</h1>
            <p style={{ margin: 0, color: t.textMuted, fontSize: '14.5px' }}>{subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 999, border: `1px solid ${t.border}`, background: t.surface,
              display: 'grid', placeItems: 'center', position: 'relative', cursor: 'pointer',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18" style={{ color: t.textMuted }}>
                <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" /><path d="M10 21a2 2 0 0 0 4 0" />
              </svg>
              <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: '50%', background: t.red, border: `1.5px solid ${t.surface}` }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px 4px 4px', borderRadius: 999, border: `1px solid ${t.border}`, background: t.surface }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg, ${t.gold}, ${t.goldDark})`,
                display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: '13.5px', flexShrink: 0,
              }}>{initials}</div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{user?.email?.split('@')[0]}</div>
                <div style={{ fontSize: '11.5px', color: t.textMuted }}>Coach Trainee</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              background: t.ink, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 999,
              fontWeight: 700, fontSize: '13.5px', cursor: 'pointer',
            }}>
              Sign out
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
