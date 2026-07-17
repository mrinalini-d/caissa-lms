'use client'
import { useEffect, useState } from 'react'
import AdminShell from '../AdminShell'

const card = { background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const input = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.85rem' }

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString()
}

export default function UsersClient({ user }) {
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)
  const [emailFilter, setEmailFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expanded, setExpanded] = useState(null)

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
    <AdminShell user={user} title="User Activity" subtitle="Track training progress, quiz scores, and time spent per coach">
      <div style={{ ...card, marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', marginBottom: 4 }}>Name / Email</label>
          <input style={input} placeholder="Search…" value={emailFilter} onChange={e => setEmailFilter(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', marginBottom: 4 }}>From</label>
          <input style={input} type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', marginBottom: 4 }}>To</label>
          <input style={input} type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <button onClick={load} style={{ padding: '9px 18px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Filter</button>
        {(emailFilter || from || to) && (
          <button onClick={() => { setEmailFilter(''); setFrom(''); setTo(''); setTimeout(load, 0) }} style={{ padding: '9px 18px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Clear</button>
        )}
      </div>

      {error && <div style={{ color: '#dc2626' }}>{error}</div>}
      {!users && !error && <div style={{ color: '#9ca3af' }}>Loading…</div>}

      {users?.length === 0 && <div style={{ color: '#9ca3af' }}>No activity found for these filters.</div>}

      {users?.map(u => (
        <div key={u.email} style={{ ...card, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(expanded === u.email ? null : u.email)}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{u.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{u.email}</div>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: '0.82rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#7c3aed' }}>{u.videosWatched}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>Videos Watched</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#15803d' }}>{u.modulesCompleted}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>Modules Passed</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#111827' }}>{u.avgScorePct}%</div>
                <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>Avg Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#111827' }}>{u.totalAttempts}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>Quiz Attempts</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.75rem' }}>{fmt(u.lastActivityAt)}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>Last Activity</div>
              </div>
              <span style={{ color: '#9ca3af' }}>{expanded === u.email ? '▲' : '▼'}</span>
            </div>
          </div>

          {expanded === u.email && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8 }}>Module Progress</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#9ca3af' }}>
                    <th style={{ padding: '6px 8px' }}>Chapter</th>
                    <th style={{ padding: '6px 8px' }}>Module</th>
                    <th style={{ padding: '6px 8px' }}>Video Watched</th>
                    <th style={{ padding: '6px 8px' }}>Quiz Passed</th>
                    <th style={{ padding: '6px 8px' }}>Best Score</th>
                    <th style={{ padding: '6px 8px' }}>Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {u.modules.map((m, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px 8px' }}>{m.chapterTitle}</td>
                      <td style={{ padding: '6px 8px' }}>{m.moduleTitle}</td>
                      <td style={{ padding: '6px 8px' }}>{m.videoWatched ? `✓ ${fmt(m.videoWatchedAt)}` : '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{m.quizPassed ? '✓' : '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{m.bestScorePct ?? '—'}%</td>
                      <td style={{ padding: '6px 8px' }}>{m.attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8 }}>Quiz Attempt History</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#9ca3af' }}>
                    <th style={{ padding: '6px 8px' }}>Date</th>
                    <th style={{ padding: '6px 8px' }}>Chapter</th>
                    <th style={{ padding: '6px 8px' }}>Module</th>
                    <th style={{ padding: '6px 8px' }}>Score</th>
                    <th style={{ padding: '6px 8px' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {u.attempts.map((a, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px 8px' }}>{fmt(a.createdAt)}</td>
                      <td style={{ padding: '6px 8px' }}>{a.chapterTitle}</td>
                      <td style={{ padding: '6px 8px' }}>{a.moduleTitle}</td>
                      <td style={{ padding: '6px 8px' }}>{a.scorePct}%</td>
                      <td style={{ padding: '6px 8px', color: a.passed ? '#15803d' : '#dc2626', fontWeight: 600 }}>{a.passed ? 'Passed' : 'Failed'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </AdminShell>
  )
}
