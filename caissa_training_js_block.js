/**
 * Caissa Coach Training — NocoBase Custom JS Block
 *
 * Reuses the existing Caissa LMS backend (Next.js + Supabase, already live on
 * Vercel) directly — no data duplicated into NocoBase collections. Cross-
 * origin auth is a shared secret header + the trainee's email (there's no
 * session cookie across origins), so identity comes from NocoBase's own
 * logged-in user, and admin visibility comes from NocoBase's role.
 *
 * ⚠️ SETUP — three things to fill in for your NocoBase environment:
 *   1. BLOCK_SECRET below must match CAISSA_BLOCK_SECRET on Vercel.
 *   2. getCurrentUser() must return { email, isAdmin } for the logged-in
 *      NocoBase user — adjust the ctx.currentUser / role lookup to match
 *      your NocoBase version (see comments inside the function).
 *   3. API_BASE should stay pointed at the caissa-lms Vercel deployment
 *      unless you redeploy it elsewhere.
 */

ctx.element.innerHTML = '';

// ============================================================================
// CONFIG
// ============================================================================

const API_BASE = 'https://caissa-lms-lyart.vercel.app/api/block';
const BLOCK_SECRET = 'ed58d73682a25f37b009242885217289da97bb810f0f3097';
const ADMIN_ROLE_NAMES = ['admin', 'root']; // NocoBase role names treated as admin for this block

let state = {
  view: 'training',          // 'training' | 'module' | 'admin'
  activeModuleId: null,
  curriculum: null,
  currentUser: null,
  adminTab: 'content',       // 'content' | 'activity'
};

// ============================================================================
// STYLES
// ============================================================================

const style = document.createElement('style');
style.textContent = `
  .ct-app { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2A1D14; }
  .ct-app * { box-sizing: border-box; }
  .ct-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
  .ct-tabs { display:flex; gap:8px; }
  .ct-tab { border:1px solid #EBDFC7; background:#fff; color:#8B7C68; padding:9px 18px; border-radius:999px; font-weight:700; font-size:13px; cursor:pointer; }
  .ct-tab.active { background:#3B2417; color:#fff; border-color:#3B2417; }
  .ct-card { background:#fff; border:1px solid #EBDFC7; border-radius:14px; box-shadow:0 1px 2px rgba(43,26,10,.05),0 10px 26px -14px rgba(43,26,10,.18); }
  .ct-track-head { display:flex; align-items:baseline; gap:10px; margin:24px 0 14px; }
  .ct-track-head h3 { font-size:18px; font-weight:700; margin:0; }
  .ct-track-head span { font-size:12.5px; color:#8B7C68; }
  .ct-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .ct-course { padding:18px; display:flex; flex-direction:column; cursor:pointer; transition:transform .15s; }
  .ct-course:hover:not(.locked) { transform:translateY(-2px); }
  .ct-course.locked { opacity:.6; cursor:default; }
  .ct-c-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .ct-badge { width:32px; height:32px; border-radius:9px; display:grid; place-items:center; font-size:12.5px; font-weight:800; flex-shrink:0; }
  .ct-status { font-size:11px; font-weight:700; padding:4px 10px; border-radius:999px; white-space:nowrap; }
  .ct-title { font-weight:700; font-size:14.5px; margin-bottom:8px; }
  .ct-desc { font-size:12.5px; color:#8B7C68; line-height:1.5; margin-bottom:14px; flex:1; }
  .ct-bar { height:6px; border-radius:99px; background:#F1EBDC; overflow:hidden; margin-bottom:6px; }
  .ct-bar-fill { height:100%; border-radius:99px; }
  .ct-lock-row { font-size:11.5px; color:#9C907A; font-weight:600; }
  .ct-btn { border:none; border-radius:999px; font-weight:700; font-size:13.5px; padding:10px 20px; cursor:pointer; }
  .ct-btn-primary { background:#C6892E; color:#251500; }
  .ct-btn-ghost { background:#F1EBDC; color:#3B2417; }
  .ct-btn-danger { background:#F7E3DF; color:#B23B2E; }
  .ct-back { background:none; border:none; color:#9C6A1F; font-weight:700; cursor:pointer; margin-bottom:14px; font-size:13.5px; }
  .ct-module-grid { display:grid; grid-template-columns:1fr 320px; gap:20px; align-items:start; }
  .ct-video-wrap { position:relative; border-radius:12px; overflow:hidden; background:#000; }
  .ct-video-wrap video { width:100%; display:block; aspect-ratio:16/9; object-fit:contain; }
  .ct-video-controls { position:absolute; left:0; right:0; bottom:0; padding:8px 14px 10px; background:linear-gradient(transparent, rgba(0,0,0,.7)); }
  .ct-video-controls input[type=range] { width:100%; margin-bottom:6px; accent-color:#C6892E; }
  .ct-video-controls-row { display:flex; align-items:center; justify-content:space-between; }
  .ct-icon-btn { background:rgba(255,255,255,.15); border:none; border-radius:8px; width:32px; height:32px; color:#fff; cursor:pointer; }
  .ct-lock-overlay { position:absolute; inset:0; background:rgba(43,26,10,.75); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; text-align:center; padding:24px; }
  .ct-option { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; border:1px solid #EBDFC7; margin-bottom:6px; cursor:pointer; }
  .ct-option.correct { background:#E7EFDD; border-color:#9BC08A; }
  .ct-option.wrong { background:#F7E3DF; border-color:#E0A79C; }
  .ct-input { width:100%; padding:9px 12px; border-radius:8px; border:1px solid #EBDFC7; font-size:13.5px; margin-bottom:10px; font-family:inherit; }
  .ct-sidebar-nav { padding:0; }
  .ct-sidebar-chapter { padding:12px 16px; background:#FAF4E7; font-weight:700; font-size:13.5px; border-bottom:1px solid #EBDFC7; }
  .ct-sidebar-mod { display:flex; align-items:center; gap:10px; padding:10px 16px; border-bottom:1px solid #F1EBDC; cursor:pointer; font-size:13px; }
  .ct-sidebar-mod.active { background:#F5E3C0; font-weight:700; }
  .ct-sidebar-num { width:22px; height:22px; border-radius:50%; display:grid; place-items:center; font-size:11px; font-weight:700; flex-shrink:0; }
  .ct-admin-cols { display:grid; grid-template-columns:1fr 1fr 1.3fr; gap:16px; align-items:start; }
  .ct-admin-col { padding:18px; }
  .ct-admin-row { padding:10px 12px; border-radius:8px; background:#FAF4E7; margin-bottom:6px; cursor:pointer; display:flex; justify-content:space-between; gap:8px; }
  .ct-admin-row.active { background:#F5E3C0; }
  .ct-summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
  .ct-summary-card { padding:16px; display:flex; align-items:center; gap:12px; }
  .ct-loading, .ct-error, .ct-empty { padding:40px; text-align:center; color:#8B7C68; }
  .ct-error { color:#B23B2E; }
  @media (max-width: 900px) { .ct-grid { grid-template-columns:1fr; } .ct-module-grid { grid-template-columns:1fr; } .ct-admin-cols { grid-template-columns:1fr; } .ct-summary-grid { grid-template-columns:1fr 1fr; } }
`;
ctx.element.appendChild(style);

const root = document.createElement('div');
root.className = 'ct-app';
ctx.element.appendChild(root);

// ============================================================================
// AUTH — adjust this for your NocoBase version
// ============================================================================

function getCurrentUser() {
  // NocoBase typically exposes the logged-in user via ctx.currentUser or
  // ctx.app / ctx.api helpers depending on version. Try the common shapes;
  // fall back to a visible error so this is obvious to fix rather than
  // silently mis-attributing activity to the wrong person.
  const u = ctx.currentUser || ctx.user || (ctx.api && ctx.api.auth && ctx.api.auth.user);
  const email = u?.email || u?.data?.email;
  const roleName = (u?.role?.name || u?.roleName || u?.data?.role?.name || '').toLowerCase();
  const isAdmin = ADMIN_ROLE_NAMES.includes(roleName);
  if (!email) {
    console.error('[Caissa Block] Could not resolve the current NocoBase user email — check getCurrentUser() in this block.');
  }
  return { email, isAdmin };
}

async function api(path, { method = 'GET', body, admin = false } = {}) {
  const email = state.currentUser?.email;
  const headers = { 'x-caissa-block-secret': BLOCK_SECRET, 'Content-Type': 'application/json' };
  let url = `${API_BASE}/${path}`;
  const jsonBody = (method === 'GET' || method === 'DELETE') ? undefined : { ...body, email };

  if (method === 'GET' || method === 'DELETE') {
    url += `${url.includes('?') ? '&' : '?'}email=${encodeURIComponent(email)}`;
  }

  try {
    // ctx.api.request is NocoBase's request helper (axios-like). If your
    // version doesn't accept absolute cross-origin URLs this way, the
    // catch below falls back to a plain fetch.
    const res = await ctx.api.request({ url, method, headers, data: jsonBody });
    return res.data;
  } catch (err) {
    const r = await fetch(url, { method, headers, body: jsonBody ? JSON.stringify(jsonBody) : undefined });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { data, status: r.status });
    return data;
  }
}

// ============================================================================
// RENDER HELPERS
// ============================================================================

function fmtDate(iso) { return iso ? new Date(iso).toLocaleString() : '—'; }

function moduleStatus(m) {
  if (m.quizPassed) return 'completed';
  if (!m.unlocked) return 'locked';
  return 'inprogress';
}
function modulePct(m) { return m.quizPassed ? 100 : m.videoWatched ? 60 : 0; }

function render() {
  root.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'ct-header';
  header.innerHTML = `
    <h2 style="font-size:24px;font-weight:700;margin:0;">Caissa Coach Training</h2>
    <div class="ct-tabs">
      <button class="ct-tab ${state.view === 'training' || state.view === 'module' ? 'active' : ''}" data-tab="training">Training</button>
      ${state.currentUser?.isAdmin ? `<button class="ct-tab ${state.view === 'admin' ? 'active' : ''}" data-tab="admin">Admin</button>` : ''}
    </div>
  `;
  header.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.tab;
      state.activeModuleId = null;
      render();
    });
  });
  root.appendChild(header);

  const body = document.createElement('div');
  root.appendChild(body);

  if (state.view === 'training') renderTraining(body);
  else if (state.view === 'module') renderModule(body);
  else if (state.view === 'admin') renderAdmin(body);
}

// ============================================================================
// TRAINING VIEW
// ============================================================================

async function loadCurriculum() {
  try {
    state.curriculum = await api('curriculum');
  } catch (err) {
    state.curriculumError = err.message;
  }
  render();
}

function renderTraining(container) {
  if (state.curriculumError) {
    container.innerHTML = `<div class="ct-error">${state.curriculumError}</div>`;
    return;
  }
  if (!state.curriculum) {
    container.innerHTML = `<div class="ct-loading">Loading training…</div>`;
    return;
  }

  const data = state.curriculum;
  data.chapters.forEach(chapter => {
    const unlockedCount = chapter.modules.filter(m => m.unlocked).length;
    const section = document.createElement('div');
    section.innerHTML = `
      <div class="ct-track-head"><h3>${chapter.title}</h3><span>${unlockedCount} / ${chapter.modules.length} unlocked</span></div>
      <div class="ct-grid">
        ${chapter.modules.map((m, i) => {
          const status = moduleStatus(m);
          const locked = status === 'locked';
          const pct = modulePct(m);
          const badgeBg = status === 'completed' ? '#E7EFDD' : status === 'inprogress' ? '#F5E3C0' : '#F1EBDC';
          const badgeColor = status === 'completed' ? '#4C7A3D' : status === 'inprogress' ? '#8A5A2B' : '#B0A48D';
          const statusLabel = status === 'completed' ? 'Completed' : status === 'inprogress' ? 'In progress' : 'Locked';
          return `
            <div class="ct-card ct-course ${locked ? 'locked' : ''}" data-module-id="${m.id}" data-locked="${locked}">
              <div class="ct-c-top">
                <div class="ct-badge" style="background:${badgeBg};color:${badgeColor};">${status === 'completed' ? '✓' : locked ? '🔒' : i + 1}</div>
                <div class="ct-status" style="background:${badgeBg};color:${badgeColor};">${statusLabel}</div>
              </div>
              <div class="ct-title">${m.title}</div>
              <div class="ct-desc">${m.description || ''}</div>
              ${locked
                ? `<div class="ct-lock-row">🔒 Complete the previous module to unlock</div>`
                : m.cooldown
                  ? `<div class="ct-lock-row">⏳ Retry quiz in ${m.cooldown.label}</div>`
                  : `<div class="ct-bar"><div class="ct-bar-fill" style="width:${pct}%;background:${pct === 100 ? '#4C7A3D' : '#C6892E'};"></div></div>
                     <div style="font-size:11.5px;color:#8B7C68;text-align:right;">${pct}%</div>`
              }
            </div>
          `;
        }).join('')}
      </div>
    `;
    container.appendChild(section);
  });

  container.querySelectorAll('.ct-course').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.locked === 'true') return;
      state.activeModuleId = el.dataset.moduleId;
      state.view = 'module';
      state.moduleData = null;
      render();
      loadModule();
    });
  });
}

// ============================================================================
// MODULE VIEW (video + quiz)
// ============================================================================

async function loadModule() {
  try {
    state.moduleData = await api(`module/${state.activeModuleId}`);
    state.quizStarted = false;
    state.quizResult = null;
  } catch (err) {
    state.moduleError = err.message;
  }
  render();
}

function renderModule(container) {
  if (state.moduleError) { container.innerHTML = `<div class="ct-error">${state.moduleError}</div>`; return; }
  if (!state.moduleData) { container.innerHTML = `<div class="ct-loading">Loading…</div>`; return; }

  const m = state.moduleData;
  const back = document.createElement('button');
  back.className = 'ct-back';
  back.textContent = '← Back to Training';
  back.onclick = () => { state.view = 'training'; state.activeModuleId = null; render(); };
  container.appendChild(back);

  const grid = document.createElement('div');
  grid.className = 'ct-module-grid';
  grid.innerHTML = `
    <div class="ct-card" style="padding:20px;">
      <div class="ct-video-wrap" id="ctVideoWrap">
        <video id="ctVideo" src="${m.videoUrl}" ${m.quizStarted ? '' : ''}></video>
        <div class="ct-video-controls">
          <input type="range" id="ctSeek" min="0" max="0" step="0.1" value="0" />
          <div class="ct-video-controls-row">
            <div style="display:flex;align-items:center;gap:10px;">
              <button class="ct-icon-btn" id="ctPlay">▶</button>
              <span id="ctTime" style="color:#fff;font-size:12px;">0:00 / 0:00</span>
            </div>
            <button class="ct-icon-btn" id="ctFullscreen">⛶</button>
          </div>
        </div>
        <div class="ct-lock-overlay" id="ctLockOverlay" style="display:none;">🔒 Video locked while the quiz is in progress</div>
      </div>
      <p id="ctHint" style="font-size:12.5px;color:#8B7C68;margin-top:8px;">${m.videoWatched ? '' : "You can rewind anytime, but skipping ahead is disabled until you finish watching once."}</p>
      ${m.description ? `<div id="ctDesc" style="margin-top:16px;"><h4 style="font-size:14px;margin-bottom:6px;">Description</h4><p style="font-size:13.5px;color:#8B7C68;line-height:1.6;">${m.description}</p></div>` : ''}
      <div id="ctQuizArea" style="margin-top:20px;"></div>
    </div>
    <div class="ct-card" id="ctSidebar" style="padding:16px 0;"></div>
  `;
  container.appendChild(grid);

  renderSidebar(grid.querySelector('#ctSidebar'));
  setupVideo(grid, m);

  if (m.videoWatched && m.hasQuiz && !m.quizPassed) {
    if (state.quizStarted) renderQuiz(grid.querySelector('#ctQuizArea'), m);
    else renderQuizPrompt(grid.querySelector('#ctQuizArea'));
  } else if (m.videoWatched && !m.hasQuiz) {
    grid.querySelector('#ctQuizArea').innerHTML = `
      <div style="text-align:center;padding-top:16px;border-top:1px solid #EBDFC7;">
        <p style="font-size:13.5px;">✅ Module complete — no quiz required. Next module unlocked.</p>
        <button class="ct-btn ct-btn-primary" id="ctBackBtn">Back to Training</button>
      </div>`;
    grid.querySelector('#ctBackBtn').onclick = () => { state.view = 'training'; render(); loadCurriculum(); };
  } else if (m.videoWatched && m.quizPassed) {
    grid.querySelector('#ctQuizArea').innerHTML = `<div style="text-align:center;padding-top:16px;border-top:1px solid #EBDFC7;color:#4C7A3D;font-weight:700;">✓ Quiz already passed</div>`;
  }
}

function renderQuizPrompt(container) {
  container.innerHTML = `
    <div style="text-align:center;padding-top:20px;border-top:1px solid #EBDFC7;">
      <p style="font-size:13.5px;margin-bottom:16px;">✅ Video complete. Ready to test what you learned?</p>
      <button class="ct-btn ct-btn-primary" id="ctStartQuiz">Start Quiz</button>
    </div>`;
  container.querySelector('#ctStartQuiz').onclick = () => {
    state.quizStarted = true;
    const overlay = document.getElementById('ctLockOverlay');
    const video = document.getElementById('ctVideo');
    if (video) video.pause();
    if (overlay) overlay.style.display = 'flex';
    render();
  };
}

async function renderQuiz(container, mod) {
  container.innerHTML = `<div class="ct-loading">Loading quiz…</div>`;
  let quiz;
  try {
    quiz = await api(`quiz/${mod.id}`);
  } catch (err) {
    if (err.data?.cooldown) {
      container.innerHTML = `<div style="padding:16px;background:#FDF3D8;border:1px solid #E4C68C;border-radius:10px;">⏳ You can attempt this quiz again in <strong>${err.data.cooldown.label}</strong>.</div>`;
    } else {
      container.innerHTML = `<div class="ct-error">${err.message}</div>`;
    }
    return;
  }

  state.quizAnswers = state.quizAnswers || {};

  function draw(result) {
    const resultByQ = result ? Object.fromEntries(result.results.map(r => [r.questionId, r])) : {};
    const allAnswered = quiz.questions.every(q => state.quizAnswers[q.id]);

    container.innerHTML = `
      <h3 style="font-size:15px;font-weight:700;margin-bottom:14px;">Quiz — pass ${mod.passScorePct}% to continue</h3>
      ${quiz.questions.map((q, i) => {
        const qr = resultByQ[q.id];
        return `
          <div style="margin-bottom:16px;">
            <div style="font-weight:600;font-size:13.5px;margin-bottom:8px;">${i + 1}. ${q.questionText}</div>
            ${q.options.map(o => {
              let cls = 'ct-option';
              let marker = '';
              if (qr) {
                if (o.id === qr.correctOptionId) { cls += ' correct'; marker = '✓'; }
                else if (o.id === qr.chosenOptionId) { cls += ' wrong'; marker = '✕'; }
              }
              return `
                <label class="${cls}" data-qid="${q.id}" data-oid="${o.id}">
                  <input type="radio" name="q_${q.id}" ${state.quizAnswers[q.id] === o.id ? 'checked' : ''} />
                  <span style="flex:1;font-size:13px;">${o.optionText}</span>
                  ${marker ? `<span style="font-weight:700;">${marker}</span>` : ''}
                </label>`;
            }).join('')}
            ${qr && qr.explanation ? `<div style="margin-top:6px;padding:8px 12px;border-radius:8px;font-size:12.5px;background:${qr.isCorrect ? '#E7EFDD' : '#FDF3D8'};color:${qr.isCorrect ? '#4C7A3D' : '#8A5A2B'};">💡 ${qr.explanation}</div>` : ''}
          </div>`;
      }).join('')}
      ${result ? `<div style="padding:12px 16px;border-radius:8px;margin-bottom:12px;background:${result.passed ? '#E7EFDD' : '#F7E3DF'};color:${result.passed ? '#4C7A3D' : '#B23B2E'};font-weight:700;font-size:13.5px;">
        ${result.passed ? `Passed with ${result.scorePct}%! Next module unlocked.` : `Scored ${result.scorePct}% — need ${mod.passScorePct}%. Try again.`}
      </div>` : ''}
      <button class="ct-btn ct-btn-primary" id="ctSubmitQuiz" ${(!allAnswered || result?.passed) ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''}>
        ${result && !result.passed ? 'Retry Quiz' : 'Submit Quiz'}
      </button>
    `;

    container.querySelectorAll('.ct-option').forEach(opt => {
      opt.addEventListener('click', () => {
        state.quizAnswers[opt.dataset.qid] = opt.dataset.oid;
        draw(null); // clear highlighting on new selection
      });
    });

    const submitBtn = container.querySelector('#ctSubmitQuiz');
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';
        try {
          const res = await api('quiz-submit', { method: 'POST', body: { moduleId: mod.id, answers: state.quizAnswers } });
          draw(res);
          if (res.passed) loadCurriculum();
        } catch (err) {
          if (err.data?.cooldown) {
            container.innerHTML = `<div style="padding:16px;background:#FDF3D8;border:1px solid #E4C68C;border-radius:10px;">⏳ You can attempt this quiz again in <strong>${err.data.cooldown.label}</strong>.</div>`;
          } else {
            alert(err.message);
            draw(null);
          }
        }
      });
    }
  }

  draw(null);
}

function setupVideo(grid, mod) {
  const video = grid.querySelector('#ctVideo');
  const seek = grid.querySelector('#ctSeek');
  const playBtn = grid.querySelector('#ctPlay');
  const fsBtn = grid.querySelector('#ctFullscreen');
  const timeLabel = grid.querySelector('#ctTime');
  const wrap = grid.querySelector('#ctVideoWrap');

  let maxWatched = 0;
  let done = mod.videoWatched;

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  video.addEventListener('loadedmetadata', () => { seek.max = video.duration; });
  video.addEventListener('timeupdate', () => {
    if (video.currentTime > maxWatched) maxWatched = video.currentTime;
    seek.value = video.currentTime;
    timeLabel.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
  });
  video.addEventListener('seeking', () => {
    if (done) return;
    if (video.currentTime > maxWatched + 0.5) video.currentTime = maxWatched;
  });
  video.addEventListener('play', () => { playBtn.textContent = '⏸'; });
  video.addEventListener('pause', () => { playBtn.textContent = '▶'; });
  video.addEventListener('ended', async () => {
    done = true;
    grid.querySelector('#ctHint').textContent = '';
    try {
      const res = await api('video-complete', { method: 'POST', body: { moduleId: mod.id } });
      mod.videoWatched = true;
      mod.hasQuiz = res.hasQuiz;
      state.quizAnswers = {};
      render();
      loadCurriculum();
    } catch (err) { console.error(err); }
  });

  playBtn.addEventListener('click', () => { if (video.paused) video.play(); else video.pause(); });
  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrap.requestFullscreen();
  });
  seek.addEventListener('input', () => {
    const target = Number(seek.value);
    const clamped = !done && target > maxWatched ? maxWatched : target;
    video.currentTime = clamped;
    seek.value = clamped;
  });
}

function renderSidebar(container) {
  const data = state.curriculum;
  if (!data) { container.innerHTML = ''; return; }
  container.innerHTML = `<div style="padding:0 16px 12px;border-bottom:1px solid #EBDFC7;"><h4 style="margin:0;font-size:14px;">Course content</h4><p style="margin:2px 0 0;font-size:11.5px;color:#8B7C68;">${data.completedModules} / ${data.totalModules} completed</p></div>`;
  data.chapters.forEach(ch => {
    const chDiv = document.createElement('div');
    chDiv.innerHTML = `<div class="ct-sidebar-chapter">${ch.title}</div>`;
    ch.modules.forEach((m, i) => {
      const status = moduleStatus(m);
      const isActive = m.id === state.activeModuleId;
      const bg = status === 'completed' ? '#E7EFDD' : isActive ? '#C6892E' : status === 'locked' ? '#F1EBDC' : '#F1EBDC';
      const color = status === 'completed' ? '#4C7A3D' : isActive ? '#fff' : '#9C907A';
      const row = document.createElement('div');
      row.className = `ct-sidebar-mod ${isActive ? 'active' : ''}`;
      row.innerHTML = `<span class="ct-sidebar-num" style="background:${bg};color:${color};">${status === 'completed' ? '✓' : status === 'locked' ? '🔒' : i + 1}</span><span>${m.title}</span>`;
      if (m.unlocked && !isActive) {
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => { state.activeModuleId = m.id; state.moduleData = null; render(); loadModule(); });
      }
      chDiv.appendChild(row);
    });
    container.appendChild(chDiv);
  });
}

// ============================================================================
// ADMIN VIEW
// ============================================================================

function renderAdmin(container) {
  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;';
  tabs.innerHTML = `
    <button class="ct-tab ${state.adminTab === 'content' ? 'active' : ''}" data-atab="content">Content</button>
    <button class="ct-tab ${state.adminTab === 'activity' ? 'active' : ''}" data-atab="activity">Activity</button>
  `;
  tabs.querySelectorAll('[data-atab]').forEach(b => b.addEventListener('click', () => { state.adminTab = b.dataset.atab; render(); }));
  container.appendChild(tabs);

  const body = document.createElement('div');
  container.appendChild(body);
  if (state.adminTab === 'content') renderAdminContent(body);
  else renderAdminActivity(body);
}

// ---- Admin: Content ----

async function adminLoadChapters() {
  state.adminChapters = await api('admin/chapters', { admin: true });
  render();
}
async function adminLoadModules(chapterId) {
  const res = await api(`admin/modules?chapterId=${chapterId}`, { admin: true });
  state.adminModules = res.modules;
  render();
}
async function adminLoadQuestions(moduleId) {
  const res = await api(`admin/questions?moduleId=${moduleId}`, { admin: true });
  state.adminQuestions = res.questions;
  render();
}

function renderAdminContent(container) {
  container.className = 'ct-admin-cols';
  if (!state.adminChapters) { container.innerHTML = `<div class="ct-loading">Loading…</div>`; adminLoadChapters(); return; }

  const chapters = state.adminChapters.chapters;
  const selChapter = state.adminSelChapter;
  const selModule = state.adminSelModule;

  const chapterCol = document.createElement('div');
  chapterCol.className = 'ct-card ct-admin-col';
  chapterCol.innerHTML = `
    <h3 style="margin:0 0 12px;font-size:14.5px;">Chapters</h3>
    ${chapters.map(c => `
      <div class="ct-admin-row ${selChapter?.id === c.id ? 'active' : ''}" data-cid="${c.id}">
        <div><div style="font-weight:600;font-size:13px;">${c.title}</div><div style="font-size:11px;color:#8B7C68;">${c.moduleCount} modules</div></div>
        <button class="ct-btn-danger" data-del-chapter="${c.id}" style="border:none;background:none;color:#B23B2E;cursor:pointer;">✕</button>
      </div>
    `).join('')}
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #EBDFC7;">
      <input class="ct-input" id="newChapterTitle" placeholder="New chapter title" />
      <input class="ct-input" id="newChapterDesc" placeholder="Description" />
      <button class="ct-btn ct-btn-primary" id="addChapterBtn">+ Add Chapter</button>
    </div>
  `;
  container.innerHTML = '';
  container.appendChild(chapterCol);

  chapterCol.querySelectorAll('[data-cid]').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('[data-del-chapter]')) return;
      state.adminSelChapter = chapters.find(c => c.id === row.dataset.cid);
      state.adminSelModule = null;
      state.adminModules = null;
      render();
      adminLoadModules(state.adminSelChapter.id);
    });
  });
  chapterCol.querySelectorAll('[data-del-chapter]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this chapter and all its modules?')) return;
      await api(`admin/chapters/${btn.dataset.delChapter}`, { method: 'DELETE', admin: true });
      state.adminSelChapter = null;
      adminLoadChapters();
    });
  });
  chapterCol.querySelector('#addChapterBtn').addEventListener('click', async () => {
    const title = chapterCol.querySelector('#newChapterTitle').value.trim();
    const description = chapterCol.querySelector('#newChapterDesc').value.trim();
    if (!title) return;
    await api('admin/chapters', { method: 'POST', body: { title, description, orderIndex: chapters.length + 1 }, admin: true });
    adminLoadChapters();
  });

  const moduleCol = document.createElement('div');
  moduleCol.className = 'ct-card ct-admin-col';
  if (!selChapter) {
    moduleCol.innerHTML = `<h3 style="margin:0 0 12px;font-size:14.5px;">Modules</h3><p style="color:#8B7C68;font-size:13px;">Select a chapter.</p>`;
  } else if (!state.adminModules) {
    moduleCol.innerHTML = `<div class="ct-loading">Loading…</div>`;
  } else {
    moduleCol.innerHTML = `
      <h3 style="margin:0 0 12px;font-size:14.5px;">Modules — ${selChapter.title}</h3>
      ${state.adminModules.map(m => `
        <div class="ct-admin-row ${selModule?.id === m.id ? 'active' : ''}" data-mid="${m.id}">
          <div><div style="font-weight:600;font-size:13px;">${m.title}</div><div style="font-size:11px;color:#8B7C68;">${m.questionCount} questions · pass ${m.passScorePct}%</div></div>
          <button data-del-module="${m.id}" style="border:none;background:none;color:#B23B2E;cursor:pointer;">✕</button>
        </div>
      `).join('')}
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #EBDFC7;">
        <input class="ct-input" id="newModTitle" placeholder="Module title" />
        <input class="ct-input" id="newModDesc" placeholder="Description" />
        <input class="ct-input" id="newModPass" type="number" placeholder="Pass score %" value="90" />
        <input class="ct-input" id="newModVideo" placeholder="Video URL (paste link — upload via full admin panel)" />
        <button class="ct-btn ct-btn-primary" id="addModuleBtn">+ Add Module</button>
      </div>
    `;
    moduleCol.querySelectorAll('[data-mid]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('[data-del-module]')) return;
        state.adminSelModule = state.adminModules.find(m => m.id === row.dataset.mid);
        state.adminQuestions = null;
        render();
        adminLoadQuestions(state.adminSelModule.id);
      });
    });
    moduleCol.querySelectorAll('[data-del-module]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this module?')) return;
        await api(`admin/modules/${btn.dataset.delModule}`, { method: 'DELETE', admin: true });
        state.adminSelModule = null;
        adminLoadModules(selChapter.id);
      });
    });
    moduleCol.querySelector('#addModuleBtn').addEventListener('click', async () => {
      const title = moduleCol.querySelector('#newModTitle').value.trim();
      const description = moduleCol.querySelector('#newModDesc').value.trim();
      const passScorePct = Number(moduleCol.querySelector('#newModPass').value) || 90;
      const videoUrl = moduleCol.querySelector('#newModVideo').value.trim();
      if (!title || !videoUrl) { alert('Title and video URL required'); return; }
      await api('admin/modules', { method: 'POST', body: { chapterId: selChapter.id, title, description, videoUrl, passScorePct, orderIndex: state.adminModules.length + 1 }, admin: true });
      adminLoadModules(selChapter.id);
    });
  }
  container.appendChild(moduleCol);

  const quizCol = document.createElement('div');
  quizCol.className = 'ct-card ct-admin-col';
  if (!selModule) {
    quizCol.innerHTML = `<h3 style="margin:0 0 12px;font-size:14.5px;">Quiz</h3><p style="color:#8B7C68;font-size:13px;">Select a module.</p>`;
  } else if (!state.adminQuestions) {
    quizCol.innerHTML = `<div class="ct-loading">Loading…</div>`;
  } else {
    quizCol.innerHTML = `
      <h3 style="margin:0 0 12px;font-size:14.5px;">Quiz — ${selModule.title}</h3>
      ${state.adminQuestions.map((q, qi) => `
        <div class="ct-admin-row" style="cursor:default;flex-direction:column;align-items:stretch;">
          <div style="display:flex;justify-content:space-between;">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px;">${qi + 1}. ${q.questionText}</div>
            <button data-del-question="${q.id}" style="border:none;background:none;color:#B23B2E;cursor:pointer;">✕</button>
          </div>
          ${q.options.map(o => `<div style="font-size:12px;color:${o.isCorrect ? '#4C7A3D' : '#8B7C68'};">${o.isCorrect ? '✓' : '·'} ${o.optionText}</div>`).join('')}
        </div>
      `).join('')}
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #EBDFC7;" id="newQuestionForm">
        <input class="ct-input" id="newQText" placeholder="Question text" />
        <div id="newQOptions">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><input type="radio" name="newQCorrect" checked value="0" /><input class="ct-input" style="margin:0;flex:1;" placeholder="Option 1" /></div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><input type="radio" name="newQCorrect" value="1" /><input class="ct-input" style="margin:0;flex:1;" placeholder="Option 2" /></div>
        </div>
        <button class="ct-btn ct-btn-ghost" id="addOptionBtn" style="margin-bottom:10px;">+ Option</button>
        <textarea class="ct-input" id="newQExplain" placeholder="Explanation (optional)" style="min-height:50px;"></textarea>
        <button class="ct-btn ct-btn-primary" id="addQuestionBtn">+ Add Question</button>
      </div>
    `;
    quizCol.querySelectorAll('[data-del-question]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this question?')) return;
        await api(`admin/questions/${btn.dataset.delQuestion}`, { method: 'DELETE', admin: true });
        adminLoadQuestions(selModule.id);
      });
    });
    quizCol.querySelector('#addOptionBtn').addEventListener('click', () => {
      const optsDiv = quizCol.querySelector('#newQOptions');
      const idx = optsDiv.children.length;
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
      row.innerHTML = `<input type="radio" name="newQCorrect" value="${idx}" /><input class="ct-input" style="margin:0;flex:1;" placeholder="Option ${idx + 1}" />`;
      optsDiv.appendChild(row);
    });
    quizCol.querySelector('#addQuestionBtn').addEventListener('click', async () => {
      const questionText = quizCol.querySelector('#newQText').value.trim();
      const explanation = quizCol.querySelector('#newQExplain').value.trim();
      const optionRows = [...quizCol.querySelectorAll('#newQOptions > div')];
      const options = optionRows.map((row, i) => ({
        optionText: row.querySelector('input[type=text], input:not([type=radio])').value.trim(),
        isCorrect: row.querySelector('input[type=radio]').checked,
      }));
      if (!questionText || options.some(o => !o.optionText)) { alert('Fill in the question and all options'); return; }
      await api('admin/questions', { method: 'POST', body: { moduleId: selModule.id, questionText, explanation, options, orderIndex: state.adminQuestions.length + 1 }, admin: true });
      adminLoadQuestions(selModule.id);
    });
  }
  container.appendChild(quizCol);
}

// ---- Admin: Activity ----

async function adminLoadActivity() {
  const res = await api('admin/activity', { admin: true });
  state.adminActivity = res.users;
  render();
}

function renderAdminActivity(container) {
  if (!state.adminActivity) { container.innerHTML = `<div class="ct-loading">Loading…</div>`; adminLoadActivity(); return; }
  const users = state.adminActivity;

  const summary = {
    coaches: users.length,
    modulesPassed: users.reduce((s, u) => s + u.modulesCompleted, 0),
    videosWatched: users.reduce((s, u) => s + u.videosWatched, 0),
  };

  container.innerHTML = `
    <div class="ct-summary-grid">
      <div class="ct-card ct-summary-card"><div><div style="font-size:22px;font-weight:700;">${summary.coaches}</div><div style="font-size:12px;color:#8B7C68;">Coaches tracked</div></div></div>
      <div class="ct-card ct-summary-card"><div><div style="font-size:22px;font-weight:700;">${summary.modulesPassed}</div><div style="font-size:12px;color:#8B7C68;">Modules passed total</div></div></div>
      <div class="ct-card ct-summary-card"><div><div style="font-size:22px;font-weight:700;">${summary.videosWatched}</div><div style="font-size:12px;color:#8B7C68;">Videos watched total</div></div></div>
    </div>
    ${users.map(u => `
      <div class="ct-card" style="margin-bottom:12px;padding:16px 20px;">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div><div style="font-weight:700;">${u.name}</div><div style="font-size:12px;color:#8B7C68;">${u.email}</div></div>
          <div style="display:flex;gap:20px;font-size:13px;">
            <div><strong>${u.videosWatched}</strong> videos</div>
            <div><strong>${u.modulesCompleted}</strong> passed</div>
            <div><strong>${u.avgScorePct}%</strong> avg</div>
            <div><strong>${u.totalAttempts}</strong> attempts</div>
          </div>
          <div style="font-size:12px;color:#8B7C68;">${fmtDate(u.lastActivityAt)}</div>
        </div>
      </div>
    `).join('')}
  `;
}

// ============================================================================
// BOOT
// ============================================================================

state.currentUser = getCurrentUser();
if (!state.currentUser.email) {
  root.innerHTML = `<div class="ct-error">Could not determine the logged-in user's email. Edit getCurrentUser() in this block for your NocoBase version.</div>`;
} else {
  render();
  loadCurriculum();
}
