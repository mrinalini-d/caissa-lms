'use client'
import AppShell from '../components/AppShell'

export default function DashboardClient({ user }) {
  return (
    <AppShell user={user} title="Dashboard" subtitle={`Welcome back, ${user?.email?.split('@')[0]}`}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Modules Enrolled', value: '6', sub: 'Total modules', icon: '📚', bg: '#faf5ff' },
          { label: 'Completed', value: '0', sub: 'Modules done', icon: '✅', bg: '#f0fdf4' },
        ].map(({ label, value, sub, icon, bg }) => (
          <div key={label} style={{
            background: 'white', borderRadius: '16px', padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827' }}>{value}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#111827' }}>{label}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>Overall Training Progress</div>
            <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '2px' }}>Complete all 6 modules to earn your Caissa Coach certificate</div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#7c3aed' }}>0%</div>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: '99px', height: '8px' }}>
          <div style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: '99px', height: '8px', width: '0%' }} />
        </div>
        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#9ca3af' }}>0 of 6 modules completed</div>
      </div>

    </AppShell>
  )
}
