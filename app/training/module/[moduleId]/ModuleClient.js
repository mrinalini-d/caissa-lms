'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../../../components/AppShell'

function VideoGate({ videoUrl, alreadyWatched, onComplete, locked }) {
  const videoRef = useRef(null)
  const wrapperRef = useRef(null)
  const maxWatchedRef = useRef(0)
  const [done, setDone] = useState(alreadyWatched)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (locked) videoRef.current?.pause()
  }, [locked])

  function handleTimeUpdate(e) {
    const t = e.target.currentTime
    if (t > maxWatchedRef.current) maxWatchedRef.current = t
  }

  function handleSeeking(e) {
    // Block seeking ahead of the furthest point actually watched.
    if (e.target.currentTime > maxWatchedRef.current + 0.5) {
      e.target.currentTime = maxWatchedRef.current
    }
  }

  function handleEnded() {
    setDone(true)
    setPlaying(false)
    onComplete()
  }

  function togglePlay() {
    if (locked) return
    if (videoRef.current.paused) videoRef.current.play()
    else videoRef.current.pause()
  }

  function toggleFullscreen() {
    if (locked) return
    if (document.fullscreenElement) document.exitFullscreen()
    else wrapperRef.current.requestFullscreen()
  }

  return (
    <div>
      <div ref={wrapperRef} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
        <video
          ref={videoRef}
          src={videoUrl}
          controlsList="nodownload noplaybackrate nofullscreen"
          disablePictureInPicture
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onEnded={handleEnded}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={togglePlay}
          style={{ width: '100%', display: 'block' }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
        }}>
          <button onClick={togglePlay} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            width: 36, height: 36, color: 'white', fontSize: '1rem', cursor: 'pointer',
          }}>
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={toggleFullscreen} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            width: 36, height: 36, color: 'white', fontSize: '1rem', cursor: 'pointer',
          }}>
            ⛶
          </button>
        </div>

        {locked && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(15,14,26,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', padding: 24,
          }}>
            🔒 Video locked while the quiz is in progress
          </div>
        )}
      </div>
      {!done && !locked && (
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 8 }}>
          You must watch the entire video before the quiz unlocks. Skipping ahead is disabled.
        </p>
      )}
    </div>
  )
}

function Quiz({ moduleId, passScorePct, onPassed }) {
  const [questions, setQuestions] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/lms/quiz/${moduleId}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) setError(json.error)
        else setQuestions(json.questions)
      })
  }, [moduleId])

  async function handleSubmit() {
    setSubmitting(true)
    const res = await fetch('/api/lms/quiz-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, answers }),
    })
    const json = await res.json()
    setSubmitting(false)
    if (json.error) { setError(json.error); return }
    setResult(json)
    if (json.passed) onPassed()
  }

  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>
  if (!questions) return <p style={{ color: '#9ca3af' }}>Loading quiz…</p>

  const allAnswered = questions.every(q => answers[q.id])

  return (
    <div>
      <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: 16, fontSize: '0.95rem' }}>Quiz — pass {passScorePct}% to continue</h3>
      {questions.map((q, i) => (
        <div key={q.id} style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 600, color: '#111827', marginBottom: 8, fontSize: '0.88rem' }}>{i + 1}. {q.questionText}</div>
          {q.options.map(o => (
            <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #f3f4f6', marginBottom: 6, cursor: 'pointer' }}>
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === o.id}
                onChange={() => setAnswers(a => ({ ...a, [q.id]: o.id }))}
              />
              <span style={{ fontSize: '0.85rem', color: '#374151' }}>{o.optionText}</span>
            </label>
          ))}
        </div>
      ))}

      {result && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 12,
          background: result.passed ? '#dcfce7' : '#fef2f2',
          color: result.passed ? '#15803d' : '#dc2626', fontWeight: 600, fontSize: '0.85rem',
        }}>
          {result.passed
            ? `Passed with ${result.scorePct}%! Next module unlocked.`
            : `Scored ${result.scorePct}% — need ${passScorePct}%. Try again.`}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting || result?.passed}
        style={{
          padding: '10px 20px', background: allAnswered && !result?.passed ? '#7c3aed' : '#e5e7eb',
          color: allAnswered && !result?.passed ? 'white' : '#9ca3af', border: 'none', borderRadius: 8,
          fontWeight: 600, cursor: allAnswered && !result?.passed ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'Submitting…' : result && !result.passed ? 'Retry Quiz' : 'Submit Quiz'}
      </button>
    </div>
  )
}

const card = { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }

export default function ModuleClient({ moduleId, user }) {
  const [module_, setModule] = useState(null)
  const [videoDone, setVideoDone] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/lms/module/${moduleId}`)
      .then(res => res.json())
      .then(json => {
        setModule(json)
        setVideoDone(json.videoWatched)
      })
  }, [moduleId])

  async function markVideoComplete() {
    setVideoDone(true)
    await fetch('/api/lms/video-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId }),
    })
  }

  return (
    <AppShell user={user} title={module_?.title || 'Loading…'} subtitle="">
      {!module_ ? (
        <div style={{ color: '#9ca3af' }}>Loading…</div>
      ) : (
        <div style={{ maxWidth: 1100 }}>
          <button onClick={() => router.push('/training')} style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 600, cursor: 'pointer', marginBottom: 16, fontSize: '0.85rem' }}>
            ← Back to Training
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* Left: video + description */}
            <div style={card}>
              <VideoGate
                videoUrl={module_.videoUrl}
                alreadyWatched={module_.videoWatched}
                onComplete={markVideoComplete}
                locked={quizStarted}
              />
              {module_.description && (
                <div style={{ marginTop: 18, opacity: quizStarted ? 0.35 : 1, pointerEvents: quizStarted ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: 6 }}>Description</h4>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{module_.description}</p>
                </div>
              )}
            </div>

            {/* Right: quiz panel */}
            <div style={card}>
              {!videoDone && (
                <div style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', padding: '40px 12px' }}>
                  Watch the full video to unlock the quiz.
                </div>
              )}

              {videoDone && !quizStarted && (
                <div style={{ textAlign: 'center', padding: '32px 12px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>✅</div>
                  <p style={{ fontSize: '0.88rem', color: '#374151', marginBottom: 20 }}>
                    Video complete. Ready to test what you learned?
                  </p>
                  <button
                    onClick={() => setQuizStarted(true)}
                    style={{
                      padding: '11px 28px', background: '#7c3aed', color: 'white', border: 'none',
                      borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                    }}
                  >
                    Start Quiz
                  </button>
                </div>
              )}

              {quizStarted && (
                <Quiz
                  moduleId={moduleId}
                  passScorePct={module_.passScorePct}
                  onPassed={() => router.push('/training')}
                />
              )}
            </div>

          </div>
        </div>
      )}
    </AppShell>
  )
}
