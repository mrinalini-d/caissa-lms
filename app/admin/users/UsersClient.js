'use client'
import { useEffect, useMemo, useState } from 'react'
import AdminShell from '../AdminShell'
import { theme as t } from '../../theme'

const card = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radiusMd, boxShadow: t.shadow }
const input = { width: '100%', border: `1px solid ${t.border}`, background: t.bg, borderRadius: t.radiusSm, padding: '10px 12px', fontFamily: t.fontBody, fontSize: '13.5px', color: t.text }

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString()
}

const METRICS = [
  {
    key: 'videosWatched', label: 'Videos', bg: t.goldSoft, color: t.goldDark,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M8 5v14l11-7L8 5Z" /></svg>,
  },
  {
    key: 'modulesCompleted', label: 'Modules', bg: t.greenSoft, color: t.green,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>,
  },
  {
    key: 'avgScorePct', label: 'Avg score', suffix: '%', bg: t.redSoft, color: t.red, goodBg: t.greenSoft, goodColor: t.green,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" /></svg>,
  },
  {
    key: 'totalAttempts', label: 'Attempts', bg: t.caramelSoft, color: t.caramel,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>,
  },
]

export default function UsersClient({ user }) {
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)
  const [emailFilter, setEmailFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [clearing, setClearing] = useState(null) // `${email}:${moduleId}` | null

  async function allowRetryNow(email, moduleId) {
    setClearing(`${email}:${moduleId}`)
    await fetch('/api/admin/clear-cooldown', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: email, moduleId }),
    })
    setClearing(null)
    load()
  }

  function load() {
    const qs = new URLSearchParams()
    if (emailFilter) qs.set('email', emailFilter)
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    fetch(`/api/admin/activity?${qs.toString()}`)
      .then(r => r.json())
      .then(j => { if (j.error) setError(j.error); else setUsers(j.users) })
  }

  useEffect(load, [])

  const summary = useMemo(() => {
    if (!users) return null
    const withAttempts = users.filter(u => u.totalAttempts > 0)
    return {
      coaches: users.length,
      modulesPassed: users.reduce((s, u) => s + u.modulesCompleted, 0),
      videosWatched: users.reduce((s, u) => s + u.videosWatched, 0),
      avgScore: withAttempts.length ? Math.round(withAttempts.reduce((s, u) => s + u.avgScorePct, 0) / withAttempts.length) : 0,
    }
  }, [users])

  return (
    <AdminShell user={user} title="Coach Activity" subtitle="Who's attempted training, video/quiz progress, and when">

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { num: summary.coaches, label: 'Coaches tracked', bg: t.goldSoft, color: t.goldDark, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg> },
            { num: summary.modulesPassed, label: 'Modules passed total', bg: t.greenSoft, color: t.green, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5" /></svg> },
            { num: summary.videosWatched, label: 'Videos watched total', bg: t.caramelSoft, color: t.caramel, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z" /></svg> },
            { num: `${summary.avgScore}%`, label: 'Average quiz score', bg: t.greySoft, color: t.grey, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20a8 8 0 1 0-8-8" /><path d="M4 4v6h6" /></svg> },
          ].map((s, i) => (
            <div key={i} style={{ ...card, padding: '16px 16px 15px 16px', display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: s.bg, color: s.color }}>
                <span style={{ width: 17, height: 17, display: 'block' }}>{s.icon}</span>
              </div>
              <div>
                <div style={{ fontFamily: t.fontHeading, fontWeight: 600, fontSize: 22, lineHeight: 1, marginBottom: 3 }}>{s.num}</div>
                <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 24, display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 7 }}>Name / Email</label>
          <input style={input} placeholder="Search coaches…" value={emailFilter} onChange={e => setEmailFilter(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 7 }}>From</label>
          <input style={input} type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 7 }}>To</label>
          <input style={input} type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <button onClick={load} style={{ background: t.gold, color: '#251500', border: 'none', padding: '10.5px 22px', borderRadius: t.radiusSm, fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Filter</button>
      </div>

      {error && <div style={{ color: t.red }}>{error}</div>}
      {!users && !error && <div style={{ color: t.textMuted }}>Loading…</div>}
      {users?.length === 0 && <div style={{ color: t.textMuted }}>No activity found for these filters.</div>}

      {users?.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 0 14px' }}>
            <h3 style={{ fontFamily: t.fontHeading, fontSize: 19, fontWeight: 600, margin: 0 }}>All coaches</h3>
            <span style={{ fontSize: '12.5px', color: t.textMuted }}>{users.length} results</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {users.map(u => {
              const isOpen = expanded === u.email
              const goodScore = u.avgScorePct >= 70
              return (
                <div key={u.email} style={{ ...card, overflow: 'hidden' }}>
                  <div
                    onClick={() => setExpanded(isOpen ? null : u.email)}
                    style={{ display: 'grid', gridTemplateColumns: '220px repeat(4, 1fr) 150px 28px', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${t.gold}, ${t.goldDark})`,
                        display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 14,
                      }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 1 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: t.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                      </div>
                    </div>

                    {METRICS.map(m => {
                      const isScore = m.key === 'avgScorePct'
                      const bg = isScore ? (goodScore ? m.goodBg : m.bg) : m.bg
                      const color = isScore ? (goodScore ? m.goodColor : m.color) : m.color
                      return (
                        <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <span style={{ width: 14, height: 14, display: 'block' }}>{m.icon}</span>
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1, marginBottom: 2, color: isScore ? color : t.text }}>{u[m.key]}{m.suffix || ''}</div>
                            <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>{m.label}</div>
                          </div>
                        </div>
                      )
                    })}

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700 }}>{fmt(u.lastActivityAt)}</div>
                      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>Last activity</div>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', justifySelf: 'end',
                      color: t.textMuted, background: isOpen ? t.goldSoft : 'transparent',
                      transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease, background .2s ease',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${t.border}`, background: '#FBF6EA', padding: '18px 20px 20px' }}>
                      <h4 style={{ fontFamily: t.fontHeading, fontSize: '0.9rem', fontWeight: 600, margin: '0 0 10px' }}>Module Progress</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: t.textMuted }}>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Chapter</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Module</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Video Watched</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Quiz Passed</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Best Score</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Attempts</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {u.modules.map((m, i) => {
                            const canRetry = m.attempts > 0 && !m.quizPassed
                            const key = `${u.email}:${m.moduleId}`
                            return (
                              <tr key={i} style={{ borderTop: `1px solid ${t.border}` }}>
                                <td style={{ padding: '8px' }}>{m.chapterTitle}</td>
                                <td style={{ padding: '8px', fontWeight: 600 }}>{m.moduleTitle}</td>
                                <td style={{ padding: '8px' }}>{m.videoWatched ? `✓ ${fmt(m.videoWatchedAt)}` : '—'}</td>
                                <td style={{ padding: '8px' }}>{m.quizPassed ? <span style={{ color: t.green, fontWeight: 700 }}>✓</span> : '—'}</td>
                                <td style={{ padding: '8px', fontFamily: t.fontMono }}>{m.bestScorePct ?? '—'}%</td>
                                <td style={{ padding: '8px', fontFamily: t.fontMono }}>{m.attempts}</td>
                                <td style={{ padding: '8px' }}>
                                  {canRetry && (
                                    m.retryAllowed ? (
                                      <span style={{ padding: '5px 12px', background: t.greenSoft, color: t.green, borderRadius: 20, fontWeight: 700, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                                        ✓ Retry Allowed
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => allowRetryNow(u.email, m.moduleId)}
                                        disabled={clearing === key}
                                        style={{
                                          padding: '5px 12px', background: t.goldSoft, color: t.goldDark, border: 'none',
                                          borderRadius: 20, fontWeight: 600, fontSize: '0.7rem', cursor: clearing === key ? 'default' : 'pointer', whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {clearing === key ? 'Enabling…' : '⚡ Allow Retry Now'}
                                      </button>
                                    )
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>

                      <h4 style={{ fontFamily: t.fontHeading, fontSize: '0.9rem', fontWeight: 600, margin: '0 0 10px' }}>Quiz Attempt History</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: t.textMuted }}>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Date &amp; Time</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Chapter</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Module</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Score</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600 }}>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {u.attempts.map((a, i) => (
                            <tr key={i} style={{ borderTop: `1px solid ${t.border}` }}>
                              <td style={{ padding: '8px', fontFamily: t.fontMono, fontSize: '0.76rem' }}>{fmt(a.createdAt)}</td>
                              <td style={{ padding: '8px' }}>{a.chapterTitle}</td>
                              <td style={{ padding: '8px', fontWeight: 600 }}>{a.moduleTitle}</td>
                              <td style={{ padding: '8px', fontFamily: t.fontMono }}>{a.scorePct}%</td>
                              <td style={{ padding: '8px', color: a.passed ? t.green : t.red, fontWeight: 700 }}>{a.passed ? 'Passed' : 'Failed'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </AdminShell>
  )
}
