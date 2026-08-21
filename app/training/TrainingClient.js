'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../components/AppShell'
import { theme as t } from '../theme'

const FILTERS = [
  { key: 'all', label: 'All courses' },
  { key: 'inprogress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'locked', label: 'Locked' },
]

function moduleStatus(m) {
  if (m.quizPassed) return 'completed'
  if (!m.unlocked) return 'locked'
  return 'inprogress'
}

function modulePct(m) {
  if (m.quizPassed) return 100
  if (m.videoWatched) return 60
  return 0
}

function ProgressRing({ pct }) {
  const size = 112, stroke = 10
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
        <div style={{ fontFamily: t.fontHeading, fontSize: 24, fontWeight: 600, color: '#fff', lineHeight: 1 }}>{pct}%</div>
        <div style={{ fontSize: '10.5px', color: '#B7A48A', marginTop: 5 }}>OVERALL</div>
      </div>
    </div>
  )
}

export default function TrainingClient({ user }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/lms/curriculum')
      .then(res => res.json())
      .then(json => { if (json.error) setError(json.error); else setData(json) })
      .catch(() => setError('Failed to load training content'))
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

  if (error) {
    return <AppShell user={user} title="Courses" subtitle="Something went wrong"><div style={{ color: '#c0392b' }}>{error}</div></AppShell>
  }
  if (!data) {
    return <AppShell user={user} title="Courses" subtitle="Loading…"><div style={{ color: t.inkSoft }}>Loading training…</div></AppShell>
  }

  return (
    <AppShell user={user} title="Courses" subtitle="Every module you need to activate your coaching account, organized by track">

      {/* Hero / continue */}
      {continueModule && (() => {
        const isNew = !continueModule.module.videoWatched && !(continueModule.module.attempts > 0)
        return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
          background: `radial-gradient(120% 160% at 100% 0%, ${t.ink2} 0%, ${t.ink} 55%)`,
          borderRadius: t.radiusLg, padding: '30px 32px', overflow: 'hidden', marginBottom: 34, boxShadow: t.shadow, position: 'relative',
        }}>
          <div style={{ maxWidth: 440, color: '#fff', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#E4C68C', marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7FCB6C', boxShadow: '0 0 0 3px rgba(127,203,108,0.25)' }} />
              {isNew ? 'Start here' : 'Continue where you left off'}
            </div>
            <h2 style={{ fontFamily: t.fontHeading, fontSize: 23, fontWeight: 600, color: '#fff', margin: '0 0 8px', lineHeight: 1.25 }}>{continueModule.module.title}</h2>
            <p style={{ fontSize: '13.5px', color: '#D9C9B4', lineHeight: 1.55, margin: '0 0 20px' }}>
              {continueModule.module.description || `Part of ${continueModule.chapter.title}.`}
            </p>
            <button
              onClick={() => router.push(`/training/module/${continueModule.module.id}`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: t.gold, color: '#251500', fontWeight: 700, fontSize: '13.5px', padding: '12px 20px', borderRadius: 999, border: 'none', cursor: 'pointer' }}
            >
              {isNew ? 'Start module' : 'Resume module'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </button>
          </div>
          <ProgressRing pct={data.progressPct} />
        </div>
        )
      })()}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: `1px solid ${filter === f.key ? t.ink : t.line}`,
              background: filter === f.key ? t.ink : t.paperRaised, color: filter === f.key ? '#fff' : t.inkSoft,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {data.chapters.map(chapter => {
        const filtered = chapter.modules.filter(m => filter === 'all' || moduleStatus(m) === filter)
        if (filtered.length === 0) return null
        const unlockedCount = chapter.modules.filter(m => m.unlocked).length

        return (
          <div key={chapter.id}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '30px 0 16px' }}>
              <h3 style={{ fontFamily: t.fontHeading, fontSize: 17, color: t.ink }}>{chapter.title}</h3>
              <span style={{ fontSize: '12.5px', color: t.inkSoft, fontFamily: t.fontMono }}>
                {unlockedCount} / {chapter.modules.length} unlocked
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {filtered.map((m, i) => {
                const status = moduleStatus(m)
                const pct = modulePct(m)
                const locked = status === 'locked'
                const iconBg = status === 'completed' ? t.greenTint : status === 'inprogress' ? t.amberTint : '#EFEDE6'
                const iconColor = status === 'completed' ? t.green : status === 'inprogress' ? t.amberDeep : t.locked
                const statusLabel = status === 'completed' ? 'Completed' : status === 'inprogress' ? 'In progress' : 'Locked'

                return (
                  <div
                    key={m.id}
                    onClick={() => !locked && router.push(`/training/module/${m.id}`)}
                    style={{
                      background: t.paperRaised, border: `1px solid ${t.line}`, borderRadius: t.radius,
                      padding: 20, display: 'flex', flexDirection: 'column', boxShadow: t.shadow,
                      cursor: locked ? 'default' : 'pointer', transition: 'transform .15s, border-color .15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: t.fontMono, fontWeight: 700, fontSize: 14, background: iconBg, color: iconColor,
                      }}>
                        {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : i + 1}
                      </div>
                      <div style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase',
                        padding: '4px 9px', borderRadius: 20, background: iconBg, color: iconColor,
                      }}>
                        {statusLabel}
                      </div>
                    </div>

                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: locked ? t.locked : t.ink }}>{m.title}</h4>
                    <p style={{ fontSize: 13, color: t.inkSoft, lineHeight: 1.55, margin: '0 0 16px', flex: 1 }}>
                      {m.description || '—'}
                    </p>

                    {locked ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '12.5px', color: t.locked, fontWeight: 600, marginTop: 'auto' }}>
                        🔒 Complete the previous module to unlock
                      </div>
                    ) : m.cooldown ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '12.5px', color: t.amberDeep, fontWeight: 600, marginTop: 'auto' }}>
                        ⏳ You can re-attempt the quiz in {m.cooldown.label}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
                        <div style={{ flex: 1, height: 6, background: '#EFEDE6', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? t.green : t.amber, borderRadius: 6 }} />
                        </div>
                        <div style={{ fontFamily: t.fontMono, fontSize: '11.5px', fontWeight: 600, color: t.inkSoft, width: 34, textAlign: 'right' }}>{pct}%</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </AppShell>
  )
}
