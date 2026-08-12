'use client'
import { useEffect, useState } from 'react'
import AdminShell from '../AdminShell'

const card = { background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }

function formatSize(bytes) {
  if (!bytes) return '—'
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function StorageClient({ user }) {
  const [videos, setVideos] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(null)

  function load() {
    fetch('/api/admin/videos')
      .then(r => r.json())
      .then(j => { if (j.error) setError(j.error); else setVideos(j.videos) })
  }

  useEffect(load, [])

  function copyLink(url, name) {
    navigator.clipboard.writeText(url)
    setCopied(name)
    setTimeout(() => setCopied(null), 1500)
  }

  async function deleteVideo(name) {
    if (!confirm(`Delete "${name}" from storage? Any module still using it will break.`)) return
    await fetch(`/api/admin/videos?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
    load()
  }

  return (
    <AdminShell user={user} title="Storage" subtitle="All uploaded videos and their links">
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}
      {!videos && !error && <div style={{ color: '#9ca3af' }}>Loading videos…</div>}
      {videos?.length === 0 && <div style={{ color: '#9ca3af' }}>No videos uploaded yet.</div>}

      {videos?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {videos.map(v => (
            <div key={v.name} style={card}>
              <video src={v.publicUrl} controls style={{ width: '100%', aspectRatio: '16/9', background: '#000', display: 'block' }} />
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', marginBottom: 4, wordBreak: 'break-word' }}>
                  {v.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: 8 }}>
                  {formatSize(v.sizeBytes)} · {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}
                </div>
                <a
                  href={v.publicUrl} target="_blank" rel="noreferrer"
                  style={{ fontSize: '0.72rem', color: '#7c3aed', wordBreak: 'break-all', display: 'block', marginBottom: 10 }}
                >
                  {v.publicUrl}
                </a>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => copyLink(v.publicUrl, v.name)}
                    style={{ flex: 1, padding: '7px 10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {copied === v.name ? '✓ Copied' : 'Copy link'}
                  </button>
                  <button
                    onClick={() => deleteVideo(v.name)}
                    style={{ padding: '7px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
