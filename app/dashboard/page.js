'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: modulesData } = await supabase
        .from('modules')
        .select('*, courses(title)')
        .order('order_index')

      const { data: progressData } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)

      setModules(modulesData || [])
      setProgress(progressData || [])
      setLoading(false)
    }
    loadDashboard()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function getModuleStatus(module, index) {
    const done = progress.find(p => p.module_id === module.id)
    if (done?.quiz_passed) return 'completed'
    if (index === 0) return 'unlocked'
    const prevModule = modules[index - 1]
    const prevDone = progress.find(p => p.module_id === prevModule?.id)
    if (prevDone?.quiz_passed) return 'unlocked'
    return 'locked'
  }

  const completedCount = progress.filter(p => p.quiz_passed).length
  const progressPct = modules.length ? Math.round((completedCount / modules.length) * 100) : 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      Loading...
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#f4f4f5', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#111', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Caissa LMS</div>
          <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Coach Training Portal</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: '#ccc' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Welcome */}
        <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '4px' }}>
          Welcome 👋
        </h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Complete all modules to become a certified Caissa coach.
        </p>

        {/* Progress Bar */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>Overall Progress</span>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{progressPct}%</span>
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: '99px', height: '10px' }}>
            <div style={{ background: '#111', borderRadius: '99px', height: '10px', width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#888' }}>
            {completedCount} of {modules.length} modules completed
          </div>
        </div>

        {/* Modules */}
        {modules.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#888', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            No modules available yet. Check back soon.
          </div>
        ) : (
          modules.map((module, index) => {
            const status = getModuleStatus(module, index)
            return (
              <div
                key={module.id}
                onClick={() => status !== 'locked' && router.push(`/dashboard/module/${module.id}`)}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  marginBottom: '16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  cursor: status === 'locked' ? 'not-allowed' : 'pointer',
                  opacity: status === 'locked' ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: status === 'completed' ? '1.5px solid #22c55e' : '1.5px solid transparent',
                  transition: 'box-shadow 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: status === 'completed' ? '#22c55e' : status === 'unlocked' ? '#111' : '#e5e7eb',
                    color: status === 'locked' ? '#888' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', flexShrink: 0
                  }}>
                    {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{module.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
                      {status === 'completed' ? 'Completed' : status === 'locked' ? 'Complete previous module to unlock' : 'Click to start'}
                    </div>
                  </div>
                </div>
                {status !== 'locked' && (
                  <div style={{ fontSize: '1.2rem', color: '#888' }}>→</div>
                )}
              </div>
            )
          })
        )}

        {/* Completion Banner */}
        {modules.length > 0 && completedCount === modules.length && (
          <div style={{ background: '#111', color: 'white', borderRadius: '12px', padding: '24px', textAlign: 'center', marginTop: '8px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>All modules completed!</div>
            <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '4px' }}>You are now a certified Caissa coach.</div>
          </div>
        )}
      </div>
    </main>
  )
}
