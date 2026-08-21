'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../components/AppShell'
import { theme as t } from '../theme'

const TRACK_COLORS = [t.caramel, t.gold, '#D8CBAE', t.green, t.red]

function timeAgo(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today, ${time}`
  if (isYesterday) return `Yesterday, ${time}`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${time}`
}

function ProgressRing({ pct, size = 132, stroke = 12 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.gold} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: t.fontHeading, fontSize: 28, fontWeight: 600, color: '#fff', lineHeight: 1 }}>{pct}%</div>
        <div style={{ fontSize: '10.5px', color: '#B7A48A', marginTop: 5, letterSpacing: '.03em' }}>OVERALL</div>
      </div>
    </div>
  )
}

const panel = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radiusLg, padding: '26px 28px', boxShadow: t.shadow, marginBottom: 20 }
const statCard = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radiusMd, padding: '16px 16px 15px', boxShadow: t.shadow, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }

export default function DashboardClient({ user }) {
  const [data, setData] = useState(null)
  const [activity, setActivity] = useState(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/lms/curriculum').then(r => r.json()).then(j => !j.error && setData(j))
    fetch('/api/lms/activity').then(r => r.json()).then(j => !j.error && setActivity(j.events))
  }, [])

  const continueModule = useMemo(() => {
    if (!data) return null
    for (const chapter of data.chapters) {
      for (const m of chapter.modules) {
        if (m.unlocked && !m.quizPassed) return { chapter, module: m }
      }
    }
    return null
  }, [data])

  const upNext = useMemo(() => {
    if (!data) return []
    const flat = data.chapters.flatMap(ch => ch.modules.map(m => ({ ...m, chapterTitle: ch.title })))
    return flat.slice(0, 4)
  }, [data])

  if (!data) {
    return <AppShell user={user} title="Dashboard" subtitle="Loading…"><div style={{ color: t.textMuted }}>Loading…</div></AppShell>
  }

  const total = data.totalModules
  const completed = data.completedModules
  const inProgress = data.chapters.flatMap(c => c.modules).filter(m => m.unlocked && !m.quizPassed && (m.videoWatched || m.attempts > 0)).length
  const locked = data.chapters.flatMap(c => c.modules).filter(m => !m.unlocked).length

  return (
    <AppShell user={user} title="Dashboard" subtitle={`Welcome back, ${user?.email?.split('@')[0]} — here's where your certification stands.`}>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{
          background: `radial-gradient(120% 160% at 100% 0%, ${t.ink2} 0%, ${t.ink} 55%)`,
          borderRadius: t.radiusLg, padding: '30px 32px', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
          boxShadow: t.shadow, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ maxWidth: 380, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#E4C68C', marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7FCB6C', boxShadow: '0 0 0 3px rgba(127,203,108,0.25)' }} />
              {continueModule ? 'In progress' : 'All caught up'}
            </div>
            <h2 style={{ fontFamily: t.fontHeading, fontSize: 23, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.25 }}>
              {continueModule ? continueModule.module.title : 'Training complete 🎉'}
            </h2>
            <p style={{ color: '#D9C9B4', fontSize: '13.5px', lineHeight: 1.55, margin: '0 0 20px' }}>
              {continueModule
                ? (continueModule.module.description || `Part of ${continueModule.chapter.title}.`)
                : "You've cleared every module. Nice work."}
            </p>
            {continueModule && (
              <button
                onClick={() => router.push(`/training/module/${continueModule.module.id}`)}
                style={{ background: t.gold, color: '#251500', border: 'none', padding: '12px 20px', borderRadius: 999, fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                Continue module
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </button>
            )}
          </div>
          <ProgressRing pct={data.progressPct} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>, bg: t.goldSoft, color: t.goldDark, num: total, label: 'Total modules' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5" /></svg>, bg: t.greenSoft, color: t.green, num: completed, label: 'Completed' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>, bg: t.caramelSoft, color: t.caramel, num: inProgress, label: 'In progress' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>, bg: t.greySoft, color: '#9C907A', num: locked, label: 'Locked' },
          ].map((s, i) => (
            <div key={i} style={statCard}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, color: s.color, display: 'grid', placeItems: 'center', marginBottom: 14 }}>
                <span style={{ width: 17, height: 17, display: 'block' }}>{s.icon}</span>
              </div>
              <div>
                <div style={{ fontFamily: t.fontHeading, fontWeight: 600, fontSize: 26, lineHeight: 1, marginBottom: 4 }}>{s.num}</div>
                <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={panel}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 0 14px' }}>
          <h3 style={{ fontFamily: t.fontHeading, fontSize: 19, fontWeight: 600, margin: 0 }}>Progress by track</h3>
          <span style={{ fontSize: '12.5px', color: t.textMuted }}>{completed} of {total} modules complete</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {data.chapters.map((ch, i) => {
            const chDone = ch.modules.filter(m => m.quizPassed).length
            const chUnlocked = ch.modules.filter(m => m.unlocked).length
            const pct = ch.modules.length ? Math.round((chDone / ch.modules.length) * 100) : 0
            const color = TRACK_COLORS[i % TRACK_COLORS.length]
            const next = ch.modules.find(m => m.unlocked && !m.quizPassed)
            return (
              <div key={ch.id} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 74px', alignItems: 'center', gap: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 14 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: color, flexShrink: 0 }} />
                  {ch.title}
                </div>
                <div>
                  <div style={{ position: 'relative', height: 9, borderRadius: 99, background: t.greySoft, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 99, width: `${pct}%`, background: color, transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ fontSize: '11.5px', color: t.textMuted, marginTop: 4 }}>
                    {chUnlocked === 0 ? `Locked — unlocks after previous tracks` : `${chDone} of ${ch.modules.length} complete${next ? ` · ${next.title} up next` : ''}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '13.5px' }}>{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        <div style={panel}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 0 14px' }}>
            <h3 style={{ fontFamily: t.fontHeading, fontSize: 19, fontWeight: 600, margin: 0 }}>Up next</h3>
          </div>
          {upNext.map((m, i) => {
            const status = m.quizPassed ? 'done' : !m.unlocked ? 'locked' : 'active'
            return (
              <div
                key={m.id}
                onClick={() => m.unlocked && router.push(`/training/module/${m.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '13px 6px',
                  borderBottom: i < upNext.length - 1 ? `1px solid ${t.border}` : 'none',
                  cursor: m.unlocked ? 'pointer' : 'default',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800,
                  background: status === 'done' ? t.greenSoft : status === 'active' ? t.caramel : t.greySoft,
                  color: status === 'done' ? t.green : status === 'active' ? '#fff' : '#B0A48D',
                }}>
                  {status === 'done' ? '✓' : status === 'locked' ? '🔒' : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: 2 }}>{m.title}</div>
                  <div style={{ fontSize: '11.5px', color: t.textMuted }}>{m.chapterTitle}</div>
                </div>
                <div style={{
                  fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap',
                  background: status === 'done' ? t.greenSoft : status === 'active' ? t.caramelSoft : t.greySoft,
                  color: status === 'done' ? t.green : status === 'active' ? t.caramel : '#9C907A',
                }}>
                  {status === 'done' ? 'Completed' : status === 'active' ? 'In progress' : 'Locked'}
                </div>
              </div>
            )
          })}
        </div>

        <div style={panel}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 0 14px' }}>
            <h3 style={{ fontFamily: t.fontHeading, fontSize: 19, fontWeight: 600, margin: 0 }}>Recent activity</h3>
          </div>
          {!activity && <div style={{ color: t.textMuted, fontSize: 13 }}>Loading…</div>}
          {activity?.length === 0 && <div style={{ color: t.textMuted, fontSize: 13 }}>No activity yet.</div>}
          {activity?.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 2px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 5,
                  background: e.type === 'pass' ? t.green : e.type === 'fail' ? t.red : t.caramel,
                }} />
                {i < activity.length - 1 && <div style={{ width: 1.5, flex: 1, background: t.border, marginTop: 4 }} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{e.text}</div>
                <div style={{ fontSize: '11.5px', color: t.textMuted, marginTop: 2 }}>{timeAgo(e.at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </AppShell>
  )
}
