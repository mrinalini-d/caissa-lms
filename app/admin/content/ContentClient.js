'use client'
import { useEffect, useState } from 'react'
import AdminShell from '../AdminShell'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

const card = { background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const input = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.85rem', marginBottom: 10 }
const btnPrimary = { padding: '9px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }
const btnGhost = { padding: '9px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }
const listRow = (active) => ({
  padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6,
  background: active ? '#ede9fe' : '#f9fafb', border: active ? '1px solid #c4b5fd' : '1px solid transparent',
})

export default function ContentClient({ user }) {
  const [chapters, setChapters] = useState(null)
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [modules, setModules] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [questions, setQuestions] = useState(null)

  const [newChapter, setNewChapter] = useState({ title: '', description: '' })
  const [newModule, setNewModule] = useState({ title: '', description: '', passScorePct: 70 })
  const [uploadState, setUploadState] = useState(null) // { progress, fileName } | null
  const [pendingVideoUrl, setPendingVideoUrl] = useState('')
  const [videoLibrary, setVideoLibrary] = useState(null)
  const [videoSource, setVideoSource] = useState('upload') // 'upload' | 'existing' | 'link'

  const [editModule, setEditModule] = useState(null) // { id, title, description, passScorePct, videoUrl, videoSource, uploadState } | null

  const [newQuestion, setNewQuestion] = useState({ questionText: '', explanation: '', options: [{ optionText: '', isCorrect: true }, { optionText: '', isCorrect: false }] })
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [editQuestion, setEditQuestion] = useState(null) // { id, orderIndex, questionText, explanation, options } | null

  function loadChapters() {
    fetch('/api/admin/chapters').then(r => r.json()).then(j => setChapters(j.chapters || []))
  }
  function loadModules(chapterId) {
    fetch(`/api/admin/modules?chapterId=${chapterId}`).then(r => r.json()).then(j => setModules(j.modules || []))
  }
  function loadQuestions(moduleId) {
    fetch(`/api/admin/questions?moduleId=${moduleId}`).then(r => r.json()).then(j => setQuestions(j.questions || []))
  }

  useEffect(loadChapters, [])
  useEffect(() => {
    fetch('/api/admin/videos').then(r => r.json()).then(j => setVideoLibrary(j.videos || []))
  }, [])
  useEffect(() => {
    if (selectedChapter) { loadModules(selectedChapter.id); setSelectedModule(null); setQuestions(null) }
  }, [selectedChapter])
  useEffect(() => {
    if (selectedModule) loadQuestions(selectedModule.id)
    setShowQuizForm(false)
  }, [selectedModule])

  async function createChapter() {
    if (!newChapter.title) return
    await fetch('/api/admin/chapters', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newChapter, orderIndex: (chapters?.length || 0) + 1 }),
    })
    setNewChapter({ title: '', description: '' })
    loadChapters()
  }

  async function deleteChapter(id) {
    if (!confirm('Delete this chapter and all its modules/questions?')) return
    await fetch(`/api/admin/chapters/${id}`, { method: 'DELETE' })
    setSelectedChapter(null)
    loadChapters()
  }

  async function handleVideoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadState({ progress: 0, fileName: file.name })

    const res = await fetch('/api/admin/upload-url', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name }),
    })
    const { path, token, publicUrl, error } = await res.json()
    if (error) { alert(error); setUploadState(null); return }

    const { error: upErr } = await supabaseBrowser.storage.from('videos').uploadToSignedUrl(path, token, file)
    if (upErr) { alert(upErr.message); setUploadState(null); return }

    setPendingVideoUrl(publicUrl)
    setUploadState({ progress: 100, fileName: file.name })
  }

  async function createModule() {
    if (!newModule.title || !pendingVideoUrl) { alert('Title and video required'); return }
    await fetch('/api/admin/modules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId: selectedChapter.id, title: newModule.title, description: newModule.description,
        videoUrl: pendingVideoUrl, passScorePct: Number(newModule.passScorePct) || 70,
        orderIndex: (modules?.length || 0) + 1,
      }),
    })
    setNewModule({ title: '', description: '', passScorePct: 70 })
    setPendingVideoUrl('')
    setUploadState(null)
    loadModules(selectedChapter.id)
  }

  function startEditModule(m) {
    setEditModule({
      id: m.id, orderIndex: m.orderIndex, title: m.title, description: m.description || '',
      passScorePct: m.passScorePct, videoUrl: m.videoUrl, videoSource: 'link', uploadState: null,
    })
  }

  async function saveEditModule() {
    if (!editModule.title || !editModule.videoUrl) { alert('Title and video required'); return }
    await fetch(`/api/admin/modules/${editModule.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editModule.title, description: editModule.description,
        videoUrl: editModule.videoUrl, passScorePct: Number(editModule.passScorePct) || 70,
        orderIndex: editModule.orderIndex ?? 0,
      }),
    })
    setEditModule(null)
    loadModules(selectedChapter.id)
  }

  async function handleEditVideoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditModule(m => ({ ...m, uploadState: { progress: 0, fileName: file.name } }))

    const res = await fetch('/api/admin/upload-url', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name }),
    })
    const { path, token, publicUrl, error } = await res.json()
    if (error) { alert(error); setEditModule(m => ({ ...m, uploadState: null })); return }

    const { error: upErr } = await supabaseBrowser.storage.from('videos').uploadToSignedUrl(path, token, file)
    if (upErr) { alert(upErr.message); setEditModule(m => ({ ...m, uploadState: null })); return }

    setEditModule(m => ({ ...m, videoUrl: publicUrl, uploadState: { progress: 100, fileName: file.name } }))
  }

  async function deleteModule(id) {
    if (!confirm('Delete this module and its questions?')) return
    await fetch(`/api/admin/modules/${id}`, { method: 'DELETE' })
    setSelectedModule(null)
    if (editModule?.id === id) setEditModule(null)
    loadModules(selectedChapter.id)
  }

  function updateOption(i, field, value) {
    setNewQuestion(q => {
      const options = [...q.options]
      if (field === 'isCorrect') {
        options.forEach((o, idx) => { o.isCorrect = idx === i })
      } else {
        options[i] = { ...options[i], [field]: value }
      }
      return { ...q, options }
    })
  }

  async function createQuestion() {
    if (!newQuestion.questionText || newQuestion.options.some(o => !o.optionText)) {
      alert('Fill in the question and all options'); return
    }
    await fetch('/api/admin/questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId: selectedModule.id, ...newQuestion, orderIndex: (questions?.length || 0) + 1 }),
    })
    setNewQuestion({ questionText: '', explanation: '', options: [{ optionText: '', isCorrect: true }, { optionText: '', isCorrect: false }] })
    loadQuestions(selectedModule.id)
  }

  async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' })
    loadQuestions(selectedModule.id)
  }

  async function removeQuiz() {
    if (!confirm(`Remove the entire quiz for "${selectedModule.title}"? All ${questions.length} question(s) will be deleted, and the module will auto-complete on video watch.`)) return
    await Promise.all(questions.map(q => fetch(`/api/admin/questions/${q.id}`, { method: 'DELETE' })))
    setShowQuizForm(false)
    loadQuestions(selectedModule.id)
    loadModules(selectedChapter.id)
  }

  function startEditQuestion(q) {
    setEditQuestion({
      id: q.id, orderIndex: q.orderIndex, questionText: q.questionText, explanation: q.explanation || '',
      options: q.options.map(o => ({ optionText: o.optionText, isCorrect: o.isCorrect })),
    })
  }

  function updateEditOption(i, field, value) {
    setEditQuestion(q => {
      const options = [...q.options]
      if (field === 'isCorrect') {
        options.forEach((o, idx) => { o.isCorrect = idx === i })
      } else {
        options[i] = { ...options[i], [field]: value }
      }
      return { ...q, options }
    })
  }

  async function saveEditQuestion() {
    if (!editQuestion.questionText || editQuestion.options.some(o => !o.optionText)) {
      alert('Fill in the question and all options'); return
    }
    await fetch(`/api/admin/questions/${editQuestion.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: editQuestion.questionText, explanation: editQuestion.explanation, options: editQuestion.options,
        orderIndex: editQuestion.orderIndex ?? 0,
      }),
    })
    setEditQuestion(null)
    loadQuestions(selectedModule.id)
  }

  return (
    <AdminShell user={user} title="Course Content" subtitle="Manage chapters, module videos, and MCQ quizzes">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: 20, alignItems: 'start' }}>

        {/* Chapters column */}
        <div style={card}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>Chapters</h3>
          {chapters?.map(c => (
            <div key={c.id} style={listRow(selectedChapter?.id === c.id)} onClick={() => setSelectedChapter(c)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{c.moduleCount} module{c.moduleCount === 1 ? '' : 's'}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteChapter(c.id) }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
            <input style={input} placeholder="New chapter title (e.g. Caissa)" value={newChapter.title} onChange={e => setNewChapter({ ...newChapter, title: e.target.value })} />
            <input style={input} placeholder="Description" value={newChapter.description} onChange={e => setNewChapter({ ...newChapter, description: e.target.value })} />
            <button style={btnPrimary} onClick={createChapter}>+ Add Chapter</button>
          </div>
        </div>

        {/* Modules column */}
        <div style={card}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>
            Modules {selectedChapter && `— ${selectedChapter.title}`}
          </h3>
          {!selectedChapter && <p style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Select a chapter to view its modules.</p>}
          {selectedChapter && (
            <>
              {modules?.map(m => (
                <div key={m.id} style={listRow(selectedModule?.id === m.id)} onClick={() => setSelectedModule(m)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <video src={m.videoUrl} muted style={{ width: 72, height: 44, borderRadius: 6, background: '#000', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{m.questionCount} question{m.questionCount === 1 ? '' : 's'} · pass {m.passScorePct}%</div>
                      <a
                        href={m.videoUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        style={{ fontSize: '0.7rem', color: '#7c3aed', wordBreak: 'break-all', display: 'block', marginTop: 2 }}
                      >
                        {m.videoUrl}
                      </a>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); startEditModule(m) }} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer' }}>✎</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteModule(m.id) }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                <input style={input} placeholder="Module title" value={newModule.title} onChange={e => setNewModule({ ...newModule, title: e.target.value })} />
                <input style={input} placeholder="Description" value={newModule.description} onChange={e => setNewModule({ ...newModule, description: e.target.value })} />
                <input style={input} type="number" placeholder="Pass score %" value={newModule.passScorePct} onChange={e => setNewModule({ ...newModule, passScorePct: e.target.value })} />
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>Video</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <button
                    onClick={() => { setVideoSource('upload'); setPendingVideoUrl(''); setUploadState(null) }}
                    style={{ ...btnGhost, flex: 1, background: videoSource === 'upload' ? '#ede9fe' : '#f3f4f6', color: videoSource === 'upload' ? '#7c3aed' : '#374151' }}
                  >
                    Upload new
                  </button>
                  <button
                    onClick={() => { setVideoSource('existing'); setPendingVideoUrl(''); setUploadState(null) }}
                    style={{ ...btnGhost, flex: 1, background: videoSource === 'existing' ? '#ede9fe' : '#f3f4f6', color: videoSource === 'existing' ? '#7c3aed' : '#374151' }}
                  >
                    Use existing
                  </button>
                  <button
                    onClick={() => { setVideoSource('link'); setPendingVideoUrl(''); setUploadState(null) }}
                    style={{ ...btnGhost, flex: 1, background: videoSource === 'link' ? '#ede9fe' : '#f3f4f6', color: videoSource === 'link' ? '#7c3aed' : '#374151' }}
                  >
                    Paste link
                  </button>
                </div>

                {videoSource === 'upload' && (
                  <>
                    <input style={input} type="file" accept="video/*" onChange={handleVideoSelect} />
                    {uploadState && (
                      <p style={{ fontSize: '0.75rem', color: uploadState.progress === 100 ? '#15803d' : '#9ca3af', marginTop: -4, marginBottom: 10 }}>
                        {uploadState.progress === 100 ? `✓ Uploaded ${uploadState.fileName}` : `Uploading ${uploadState.fileName}…`}
                      </p>
                    )}
                  </>
                )}

                {videoSource === 'existing' && (
                  <select
                    style={input}
                    value={pendingVideoUrl}
                    onChange={e => setPendingVideoUrl(e.target.value)}
                  >
                    <option value="">
                      {videoLibrary === null ? 'Loading videos…' : videoLibrary.length === 0 ? 'No videos in storage yet' : 'Select an uploaded video…'}
                    </option>
                    {videoLibrary?.map(v => (
                      <option key={v.name} value={v.publicUrl}>
                        {v.name} ({(v.sizeBytes / 1024 / 1024).toFixed(1)} MB)
                      </option>
                    ))}
                  </select>
                )}

                {videoSource === 'link' && (
                  <input
                    style={input} placeholder="https://... direct video URL"
                    value={pendingVideoUrl} onChange={e => setPendingVideoUrl(e.target.value)}
                  />
                )}
                <button style={btnPrimary} onClick={createModule}>+ Add Module</button>
              </div>
            </>
          )}
        </div>

        {/* Questions column */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
              Quiz {selectedModule && `— ${selectedModule.title}`}
            </h3>
            {questions?.length > 0 && (
              <button onClick={removeQuiz} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                Remove Quiz
              </button>
            )}
          </div>
          {!selectedModule && <p style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Select a module to manage its quiz.</p>}
          {selectedModule && (
            <>
              {questions?.map((q, qi) => (
                <div key={q.id} style={{ ...listRow(false), cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>{qi + 1}. {q.questionText}</div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => startEditQuestion(q)} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer' }}>✎</button>
                      <button onClick={() => deleteQuestion(q.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                  {q.options.map(o => (
                    <div key={o.id} style={{ fontSize: '0.78rem', color: o.isCorrect ? '#15803d' : '#6b7280', display: 'flex', gap: 6 }}>
                      {o.isCorrect ? '✓' : '·'} {o.optionText}
                    </div>
                  ))}
                </div>
              ))}

              {questions?.length === 0 && !showQuizForm && (
                <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 12 }}>
                    No quiz yet — trainees unlock the next module just by watching the video.
                  </p>
                  <button style={btnPrimary} onClick={() => setShowQuizForm(true)}>+ Add Quiz</button>
                </div>
              )}

              {(questions?.length > 0 || showQuizForm) && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                  <input style={input} placeholder="Question text" value={newQuestion.questionText} onChange={e => setNewQuestion({ ...newQuestion, questionText: e.target.value })} />
                  {newQuestion.options.map((o, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <input
                        type="radio" name="correct" checked={o.isCorrect}
                        onChange={() => updateOption(i, 'isCorrect', true)}
                      />
                      <input
                        style={{ ...input, marginBottom: 0, flex: 1 }} placeholder={`Option ${i + 1}`}
                        value={o.optionText} onChange={e => updateOption(i, 'optionText', e.target.value)}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <button style={btnGhost} onClick={() => setNewQuestion(q => ({ ...q, options: [...q.options, { optionText: '', isCorrect: false }] }))}>+ Option</button>
                  </div>
                  <textarea
                    style={{ ...input, resize: 'vertical', minHeight: 60 }}
                    placeholder="Answer explanation (optional) — shown to trainees after they submit"
                    value={newQuestion.explanation}
                    onChange={e => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  />
                  <button style={btnPrimary} onClick={createQuestion}>+ Add Question</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {editModule && (
        <div
          onClick={() => setEditModule(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,14,26,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ ...card, width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Edit Module</h3>
              <button onClick={() => setEditModule(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
            </div>

            <input style={input} placeholder="Module title" value={editModule.title} onChange={e => setEditModule({ ...editModule, title: e.target.value })} />
            <input style={input} placeholder="Description" value={editModule.description} onChange={e => setEditModule({ ...editModule, description: e.target.value })} />
            <input style={input} type="number" placeholder="Pass score %" value={editModule.passScorePct} onChange={e => setEditModule({ ...editModule, passScorePct: e.target.value })} />

            <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>Video</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {['upload', 'existing', 'link'].map(src => (
                <button
                  key={src}
                  onClick={() => setEditModule({ ...editModule, videoSource: src, uploadState: null })}
                  style={{ ...btnGhost, flex: 1, background: editModule.videoSource === src ? '#ede9fe' : '#f3f4f6', color: editModule.videoSource === src ? '#7c3aed' : '#374151' }}
                >
                  {src === 'upload' ? 'Upload new' : src === 'existing' ? 'Use existing' : 'Paste link'}
                </button>
              ))}
            </div>

            {editModule.videoSource === 'upload' && (
              <>
                <input style={input} type="file" accept="video/*" onChange={handleEditVideoSelect} />
                {editModule.uploadState && (
                  <p style={{ fontSize: '0.75rem', color: editModule.uploadState.progress === 100 ? '#15803d' : '#9ca3af', marginTop: -4, marginBottom: 10 }}>
                    {editModule.uploadState.progress === 100 ? `✓ Uploaded ${editModule.uploadState.fileName}` : `Uploading ${editModule.uploadState.fileName}…`}
                  </p>
                )}
              </>
            )}

            {editModule.videoSource === 'existing' && (
              <select
                style={input}
                value={editModule.videoUrl}
                onChange={e => setEditModule({ ...editModule, videoUrl: e.target.value })}
              >
                <option value="">
                  {videoLibrary === null ? 'Loading videos…' : videoLibrary.length === 0 ? 'No videos in storage yet' : 'Select an uploaded video…'}
                </option>
                {videoLibrary?.map(v => (
                  <option key={v.name} value={v.publicUrl}>
                    {v.name} ({(v.sizeBytes / 1024 / 1024).toFixed(1)} MB)
                  </option>
                ))}
              </select>
            )}

            {editModule.videoSource === 'link' && (
              <input
                style={input} placeholder="https://... direct video URL"
                value={editModule.videoUrl} onChange={e => setEditModule({ ...editModule, videoUrl: e.target.value })}
              />
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button style={{ ...btnGhost, flex: 1 }} onClick={() => setEditModule(null)}>Cancel</button>
              <button style={{ ...btnPrimary, flex: 1 }} onClick={saveEditModule}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {editQuestion && (
        <div
          onClick={() => setEditQuestion(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,14,26,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ ...card, width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Edit Question</h3>
              <button onClick={() => setEditQuestion(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
            </div>

            <input style={input} placeholder="Question text" value={editQuestion.questionText} onChange={e => setEditQuestion({ ...editQuestion, questionText: e.target.value })} />
            {editQuestion.options.map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <input
                  type="radio" name="edit-correct" checked={o.isCorrect}
                  onChange={() => updateEditOption(i, 'isCorrect', true)}
                />
                <input
                  style={{ ...input, marginBottom: 0, flex: 1 }} placeholder={`Option ${i + 1}`}
                  value={o.optionText} onChange={e => updateEditOption(i, 'optionText', e.target.value)}
                />
              </div>
            ))}
            <div style={{ marginTop: 8, marginBottom: 10 }}>
              <button style={btnGhost} onClick={() => setEditQuestion(q => ({ ...q, options: [...q.options, { optionText: '', isCorrect: false }] }))}>+ Option</button>
            </div>
            <textarea
              style={{ ...input, resize: 'vertical', minHeight: 60 }}
              placeholder="Answer explanation (optional) — shown to trainees after they submit"
              value={editQuestion.explanation}
              onChange={e => setEditQuestion({ ...editQuestion, explanation: e.target.value })}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button style={{ ...btnGhost, flex: 1 }} onClick={() => setEditQuestion(null)}>Cancel</button>
              <button style={{ ...btnPrimary, flex: 1 }} onClick={saveEditQuestion}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
