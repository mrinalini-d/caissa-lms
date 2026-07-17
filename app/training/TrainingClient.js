'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../components/AppShell'

const STATUS_STYLE = {
  completed: { label: 'Completed', bg: '#dcfce7', color: '#15803d' },
  inprogress: { label: 'In Progress', bg: '#ede9fe', color: '#7c3aed' },
  locked: { label: 'Locked', bg: '#f3f4f6', color: '#9ca3af' },
}

function moduleStatus(m) {
  if (m.quizPassed) return 'completed'
  if (!m.unlocked) return 'locked'
  return 'inprogress'
}

export default function TrainingClient({ user }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/lms/curriculum')
      .then(res => res.json())
      .then(json => {
        if (json.error) setError(json.error)
        else setData(json)
      })
      .catch(() => setError('Failed to load training content'))
  }, [])

  return (
    <AppShell user={user} title="Onboarding Training" subtitle="Complete all required training to become an active coach">
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}
      {!data && !error && <div style={{ color: '#9ca3af' }}>Loading training…</div>}

      {data && (
        <>
          {/* Overall progress */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>Overall Progress</div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>
                  {data.completedModules} of {data.totalModules} modules completed
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed' }}>{data.progressPct}%</div>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: 99, height: 8 }}>
              <div style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 99, height: 8, width: `${data.progressPct}%`, transition: 'width 0.3s' }} />
            </div>
          </div>

          {data.chapters.map(chapter => (
            <div key={chapter.id} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: 12 }}>{chapter.title}</h2>
              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {chapter.modules.map((m, i) => {
                  const status = moduleStatus(m)
                  const style = STATUS_STYLE[status]
                  return (
                    <div
                      key={m.id}
                      onClick={() => m.unlocked && router.push(`/training/module/${m.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px',
                        borderBottom: i < chapter.modules.length - 1 ? '1px solid #f3f4f6' : 'none',
                        cursor: m.unlocked ? 'pointer' : 'not-allowed', opacity: m.unlocked ? 1 : 0.6,
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: status === 'completed' ? '#22c55e' : status === 'inprogress' ? '#7c3aed' : '#e5e7eb',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                      }}>
                        {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.92rem' }}>{m.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{m.description}</div>
                      </div>
                      <div style={{
                        padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                        background: style.bg, color: style.color,
                      }}>{style.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </AppShell>
  )
}
