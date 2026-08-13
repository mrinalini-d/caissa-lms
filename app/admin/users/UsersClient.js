'use client'
import { useEffect, useState } from 'react'
import AdminShell from '../AdminShell'
import { theme as t } from '../../theme'

const card = { background: t.paperRaised, borderRadius: t.radius, border: `1px solid ${t.line}`, boxShadow: t.shadow }
const input = { padding: '9px 12px', borderRadius: 9, border: `1px solid ${t.line}`, fontSize: '0.85rem', fontFamily: t.fontBody }

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString()
}

const STATS = [
  { key: 'videosWatched', label: 'Videos Watched', icon: '▶', color: t.amberDeep, bg: t.amberTint },
  { key: 'modulesCompleted', label: 'Modules Passed', icon: '✓', color: t.green, bg: t.greenTint },
  { key: 'avgScorePct', label: 'Avg Score', icon: '★', suffix: '%', color: t.ink, bg: '#EFEDE6' },
  { key: 'totalAttempts', label: 'Quiz Attempts', icon: '↻', color: t.ink, bg: '#EFEDE6' },
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

  return (
    <AdminShell user={user} title="Coach Activity" subtitle="Who's attempted training, video/quiz progress, and when">

      {/* Filter bar */}
      <div style={{ ...card, padding: 20, marginBottom: 24, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: t.inkSoft, marginBottom: 4, fontWeight: 600 }}>Name / Email</label>
          <input style={{ ...input, width: 220 }} placeholder="Search…" value={emailFilter} onChange={e => setEmailFilter(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: t.inkSoft, marginBottom: 4, fontWeight: 600 }}>From</label>
          <input style={input} type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: t.inkSoft, marginBottom: 4, fontWeight: 600 }}>To</label>
          <input style={input} type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <button onClick={load} style={{ padding: '10px 20px', background: t.amber, color: t.slate, border: 'none', borderRadius: 9, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Filter</button>
        {(emailFilter || from || to) && (
          <button onClick={() => { setEmailFilter(''); setFrom(''); setTo(''); setTimeout(load, 0) }} style={{ padding: '10px 20px', background: t.paper, color: t.inkSoft, border: `1px solid ${t.line}`, borderRadius: 9, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Clear</button>
        )}
      </div>

      {error && <div style={{ color: '#c0392b' }}>{error}</div>}
      {!users && !error && <div style={{ color: t.inkSoft }}>Loading…</div>}
      {users?.length === 0 && <div style={{ color: t.inkSoft }}>No activity found for these filters.</div>}

      {users?.map(u => {
        const isOpen = expanded === u.email
        return (
          <div key={u.email} style={{ ...card, marginBottom: 16, overflow: 'hidden' }}>
            <div
              onClick={() => setExpanded(isOpen ? null : u.email)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '18px 22px', gap: 20, flexWrap: 'wrap' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(160deg, ${t.amber}, ${t.amberDeep})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 600, fontSize: 15, fontFamily: t.fontHeading,
                }}>
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: t.fontHeading, fontWeight: 600, fontSize: '15px', color: t.ink }}>{u.name}</div>
                  <div style={{ fontSize: '12.5px', color: t.inkSoft }}>{u.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
                {STATS.map(s => (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 78 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, background: s.bg, color: s.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: t.ink, fontFamily: t.fontMono }}>{u[s.key]}{s.suffix || ''}</div>
                      <div style={{ color: t.inkSoft, fontSize: '0.68rem' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
                <div style={{ minWidth: 130 }}>
                  <div style={{ fontWeight: 600, color: t.ink, fontSize: '0.78rem' }}>{fmt(u.lastActivityAt)}</div>
                  <div style={{ color: t.inkSoft, fontSize: '0.68rem' }}>Last Activity</div>
                </div>
                <span style={{ color: t.inkSoft, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: '0 22px 22px', borderTop: `1px solid ${t.line}` }}>
                <h4 style={{ fontFamily: t.fontHeading, fontSize: '0.9rem', fontWeight: 600, margin: '18px 0 10px' }}>Module Progress</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: t.inkSoft }}>
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
                        <tr key={i} style={{ borderTop: `1px solid ${t.line}` }}>
                          <td style={{ padding: '8px' }}>{m.chapterTitle}</td>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{m.moduleTitle}</td>
                          <td style={{ padding: '8px' }}>{m.videoWatched ? `✓ ${fmt(m.videoWatchedAt)}` : '—'}</td>
                          <td style={{ padding: '8px' }}>{m.quizPassed ? <span style={{ color: t.green, fontWeight: 700 }}>✓</span> : '—'}</td>
                          <td style={{ padding: '8px', fontFamily: t.fontMono }}>{m.bestScorePct ?? '—'}%</td>
                          <td style={{ padding: '8px', fontFamily: t.fontMono }}>{m.attempts}</td>
                          <td style={{ padding: '8px' }}>
                            {canRetry && (
                              m.retryAllowed ? (
                                <span style={{
                                  padding: '5px 12px', background: t.greenTint, color: t.green,
                                  borderRadius: 20, fontWeight: 700, fontSize: '0.7rem', whiteSpace: 'nowrap',
                                }}>
                                  ✓ Retry Allowed
                                </span>
                              ) : (
                                <button
                                  onClick={() => allowRetryNow(u.email, m.moduleId)}
                                  disabled={clearing === key}
                                  style={{
                                    padding: '5px 12px', background: t.amberTint, color: t.amberDeep, border: 'none',
                                    borderRadius: 20, fontWeight: 600, fontSize: '0.7rem', cursor: clearing === key ? 'default' : 'pointer',
                                    whiteSpace: 'nowrap',
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
                    <tr style={{ textAlign: 'left', color: t.inkSoft }}>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Date &amp; Time</th>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Chapter</th>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Module</th>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Score</th>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.attempts.map((a, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${t.line}` }}>
                        <td style={{ padding: '8px', fontFamily: t.fontMono, fontSize: '0.76rem' }}>{fmt(a.createdAt)}</td>
                        <td style={{ padding: '8px' }}>{a.chapterTitle}</td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{a.moduleTitle}</td>
                        <td style={{ padding: '8px', fontFamily: t.fontMono }}>{a.scorePct}%</td>
                        <td style={{ padding: '8px', color: a.passed ? t.green : '#c0392b', fontWeight: 700 }}>{a.passed ? 'Passed' : 'Failed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </AdminShell>
  )
}
