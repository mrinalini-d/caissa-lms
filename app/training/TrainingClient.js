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
  const r = 50
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference
  return (
    <div style={{ position: 'relative', width: 118, height: 118 }}>
      <svg viewBox="0 0 118 118" width={118} height={118} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="59" cy="59" r={r} fill="none" stroke="#39445A" strokeWidth="9" />
        <circle cx="59" cy="59" r={r} fill="none" stroke={t.amber} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: t.fontHeading, fontSize: 24, fontWeight: 600, color: '#fff' }}>{pct}%</div>
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
      {continueModule && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', background: t.slate, borderRadius: 20, overflow: 'hidden', marginBottom: 34, boxShadow: t.shadow }}>
          <div style={{ padding: '30px 32px', color: '#fff', position: 'relative' }}>
            <div style={{ fontFamily: t.fontMono, fontSize: '11.5px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: t.amber, marginBottom: 10 }}>
              Continue where you left off
            </div>
            <h2 style={{ fontFamily: t.fontHeading, fontSize: 23, color: '#fff', marginBottom: 8 }}>{continueModule.module.title}</h2>
            <p style={{ fontSize: 14, color: '#B7BECC', maxWidth: 440, lineHeight: 1.55, margin: '0 0 20px' }}>
              {continueModule.module.description || `Part of ${continueModule.chapter.title}.`}
            </p>
            <button
              onClick={() => router.push(`/training/module/${continueModule.module.id}`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: t.amber, color: t.slate, fontWeight: 700, fontSize: '13.5px', padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
            >
              Resume module →
            </button>
          </div>
          <div style={{ background: t.slateSoft, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 26, borderLeft: '1px solid #2E384A' }}>
            <ProgressRing pct={data.progressPct} />
            <div style={{ marginTop: 14, fontSize: 12, color: '#AEB4C2', textAlign: 'center' }}>Overall onboarding progress</div>
          </div>
        </div>
      )}

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
