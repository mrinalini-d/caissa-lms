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
 *   2. getCurrentUser() calls NocoBase's own auth:check action — adjust the
 *      fallback lookup if your version doesn't support that action.
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
// ICONS — small inline SVGs (currentColor) instead of emoji
// ============================================================================

const ICONS = {
  lock: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>`,
  checkCircle: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.2 2.2L16 10"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  play: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7L8 5Z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`,
  fullscreen: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
  info: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>`,
  book: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>`,
  users: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.7"/><path d="M15.5 13.2A5 5 0 0 1 21.5 19.9"/></svg>`,
};

// ============================================================================
// STYLES — light blue-grey, professional
// ============================================================================

const style = document.createElement('style');
style.textContent = `
  :root {
    --ct-bg: #F1F5F9;
    --ct-surface: #FFFFFF;
    --ct-border: #E2E8F0;
    --ct-ink: #1E293B;
    --ct-ink-soft: #64748B;
    --ct-primary: #2563EB;
    --ct-primary-dark: #1D4ED8;
    --ct-primary-soft: #DBEAFE;
    --ct-success: #15803D;
    --ct-success-soft: #DCFCE7;
    --ct-danger: #B91C1C;
    --ct-danger-soft: #FEE2E2;
    --ct-warning: #B45309;
    --ct-warning-soft: #FEF3C7;
    --ct-neutral-soft: #F1F5F9;
    --ct-radius-lg: 14px;
    --ct-radius-md: 10px;
    --ct-shadow: 0 1px 2px rgba(15,23,42,.04), 0 8px 20px -10px rgba(15,23,42,.15);
  }
  .ct-app { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: var(--ct-ink); background: var(--ct-bg); }
  .ct-app * { box-sizing: border-box; }
  .ct-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
  .ct-header h2 { font-size:21px; font-weight:700; margin:0; letter-spacing:-0.01em; }
  .ct-tabs { display:flex; gap:6px; background:var(--ct-surface); border:1px solid var(--ct-border); border-radius:10px; padding:4px; }
  .ct-tab { border:none; background:none; color:var(--ct-ink-soft); padding:8px 16px; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
  .ct-tab.active { background:var(--ct-primary); color:#fff; }
  .ct-card { background:var(--ct-surface); border:1px solid var(--ct-border); border-radius:var(--ct-radius-lg); box-shadow:var(--ct-shadow); }
  .ct-track-head { display:flex; align-items:baseline; gap:10px; margin:24px 0 14px; }
  .ct-track-head h3 { font-size:16px; font-weight:700; margin:0; }
  .ct-track-head span { font-size:12px; color:var(--ct-ink-soft); }
  .ct-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .ct-course { padding:18px; display:flex; flex-direction:column; cursor:pointer; transition:transform .15s, box-shadow .15s; }
  .ct-course:hover:not(.locked) { transform:translateY(-2px); box-shadow:0 4px 14px -6px rgba(15,23,42,.25); }
  .ct-course.locked { opacity:.65; cursor:default; }
  .ct-c-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .ct-badge { width:32px; height:32px; border-radius:9px; display:grid; place-items:center; font-size:12.5px; font-weight:800; flex-shrink:0; }
  .ct-status { font-size:11px; font-weight:700; padding:4px 10px; border-radius:999px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px; }
  .ct-title { font-weight:700; font-size:14px; margin-bottom:8px; }
  .ct-desc { font-size:12.5px; color:var(--ct-ink-soft); line-height:1.5; margin-bottom:14px; flex:1; }
  .ct-bar { height:6px; border-radius:99px; background:var(--ct-neutral-soft); overflow:hidden; margin-bottom:6px; }
  .ct-bar-fill { height:100%; border-radius:99px; background:var(--ct-primary); }
  .ct-lock-row { font-size:11.5px; color:var(--ct-ink-soft); font-weight:600; display:flex; align-items:center; gap:6px; }
  .ct-btn { border:none; border-radius:9px; font-weight:700; font-size:13.5px; padding:10px 20px; cursor:pointer; display:inline-flex; align-items:center; gap:8px; }
  .ct-btn-primary { background:var(--ct-primary); color:#fff; }
  .ct-btn-primary:hover { background:var(--ct-primary-dark); }
  .ct-btn-ghost { background:var(--ct-neutral-soft); color:var(--ct-ink); }
  .ct-btn-danger { background:var(--ct-danger-soft); color:var(--ct-danger); }
  .ct-back { background:none; border:none; color:var(--ct-primary); font-weight:700; cursor:pointer; margin-bottom:14px; font-size:13px; display:inline-flex; align-items:center; gap:6px; }
  .ct-module-grid { display:grid; grid-template-columns:1fr 320px; gap:20px; align-items:start; }
  .ct-video-wrap { position:relative; border-radius:var(--ct-radius-md); overflow:hidden; background:#0F172A; }
  .ct-video-wrap video { width:100%; display:block; aspect-ratio:16/9; object-fit:contain; }
  .ct-video-controls { position:absolute; left:0; right:0; bottom:0; padding:8px 14px 10px; background:linear-gradient(transparent, rgba(15,23,42,.75)); }
  .ct-video-controls input[type=range] { width:100%; margin-bottom:6px; accent-color:var(--ct-primary); }
  .ct-video-controls-row { display:flex; align-items:center; justify-content:space-between; }
  .ct-icon-btn { background:rgba(255,255,255,.18); border:none; border-radius:8px; width:30px; height:30px; color:#fff; cursor:pointer; display:grid; place-items:center; }
  .ct-lock-overlay { position:absolute; inset:0; background:rgba(15,23,42,.8); display:flex; align-items:center; justify-content:center; gap:8px; color:#fff; font-weight:600; font-size:13px; text-align:center; padding:24px; }
  .ct-modal-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.55); display:flex; align-items:center; justify-content:center; z-index:9999; padding:24px; }
  .ct-modal-box { background:var(--ct-surface); border-radius:var(--ct-radius-lg); width:80%; max-width:1000px; max-height:85vh; overflow-y:auto; padding:26px; position:relative; }
  .ct-modal-close { position:absolute; top:16px; right:18px; background:var(--ct-neutral-soft); border:none; border-radius:8px; width:28px; height:28px; display:grid; place-items:center; color:var(--ct-ink-soft); cursor:pointer; }
  .ct-option { display:flex; align-items:center; gap:8px; padding:9px 12px; border-radius:9px; border:1px solid var(--ct-border); margin-bottom:6px; cursor:pointer; }
  .ct-option.correct { background:var(--ct-success-soft); border-color:#86EFAC; }
  .ct-option.wrong { background:var(--ct-danger-soft); border-color:#FCA5A5; }
  .ct-input { width:100%; padding:9px 12px; border-radius:8px; border:1px solid var(--ct-border); font-size:13.5px; margin-bottom:10px; font-family:inherit; color:var(--ct-ink); }
  .ct-input:focus { outline:none; border-color:var(--ct-primary); }
  .ct-sidebar-chapter { padding:12px 16px; background:var(--ct-neutral-soft); font-weight:700; font-size:13px; border-bottom:1px solid var(--ct-border); }
  .ct-sidebar-mod { display:flex; align-items:center; gap:10px; padding:10px 16px; border-bottom:1px solid var(--ct-neutral-soft); cursor:pointer; font-size:13px; }
  .ct-sidebar-mod.active { background:var(--ct-primary-soft); font-weight:700; }
  .ct-sidebar-num { width:22px; height:22px; border-radius:50%; display:grid; place-items:center; font-size:11px; font-weight:700; flex-shrink:0; }
  .ct-admin-cols { display:grid; grid-template-columns:1fr 1fr 1.3fr; gap:16px; align-items:start; }
  .ct-admin-col { padding:18px; }
  .ct-admin-row { padding:10px 12px; border-radius:9px; background:var(--ct-neutral-soft); margin-bottom:6px; cursor:pointer; display:flex; justify-content:space-between; gap:8px; }
  .ct-admin-row.active { background:var(--ct-primary-soft); }
  .ct-summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
  .ct-summary-card { padding:16px; display:flex; align-items:center; gap:12px; }
  .ct-summary-icon { width:38px; height:38px; border-radius:10px; display:grid; place-items:center; flex-shrink:0; background:var(--ct-primary-soft); color:var(--ct-primary-dark); }
  .ct-loading, .ct-error, .ct-empty { padding:40px; text-align:center; color:var(--ct-ink-soft); }
  .ct-error { color:var(--ct-danger); }
  @media (max-width: 900px) {
    .ct-grid { grid-template-columns:1fr; }
    .ct-module-grid { grid-template-columns:1fr; }
    .ct-admin-cols { grid-template-columns:1fr; }
    .ct-summary-grid { grid-template-columns:1fr 1fr; }
    .ct-modal-box { width:95%; }
  }
`;
ctx.element.appendChild(style);

const root = document.createElement('div');
root.className = 'ct-app';
ctx.element.appendChild(root);

// ============================================================================
// AUTH — adjust this for your NocoBase version
// ============================================================================

async function getCurrentUser() {
  // NocoBase's own "auth:check" action returns the logged-in user for the
  // session token ctx.api.request already attaches automatically — this is
  // the reliable way to get the real email/role rather than guessing at
  // ctx.currentUser shapes.
  try {
    const res = await ctx.api.request({ url: 'auth:check', method: 'get' });
    const u = res?.data?.data || res?.data || {};
    const email = u.email;
    const roleName = (u.role?.name || u.roleName || u.role || '').toLowerCase();
    if (!email) throw new Error('auth:check response had no email');
    return { email, isAdmin: ADMIN_ROLE_NAMES.includes(roleName) };
  } catch (err) {
    console.error('[Caissa Block] auth:check failed, falling back to ctx.currentUser', err);
    const u = ctx.currentUser || ctx.user || (ctx.api && ctx.api.auth && ctx.api.auth.user);
    const email = u?.email || u?.data?.email;
    const roleName = (u?.role?.name || u?.roleName || u?.data?.role?.name || '').toLowerCase();
    if (!email) {
      console.error('[Caissa Block] Could not resolve the current NocoBase user email — check getCurrentUser() in this block.');
    }
    return { email, isAdmin: ADMIN_ROLE_NAMES.includes(roleName) };
  }
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
    <h2>Caissa Coach Training</h2>
    ${state.currentUser?.isAdmin ? `
    <div class="ct-tabs">
      <button class="ct-tab ${state.view === 'admin' ? 'active' : ''}" data-tab="admin">${ICONS.shield} Admin</button>
    </div>` : ''}
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
          const badgeBg = status === 'completed' ? 'var(--ct-success-soft)' : status === 'inprogress' ? 'var(--ct-primary-soft)' : 'var(--ct-neutral-soft)';
          const badgeColor = status === 'completed' ? 'var(--ct-success)' : status === 'inprogress' ? 'var(--ct-primary-dark)' : 'var(--ct-ink-soft)';
          const statusLabel = status === 'completed' ? 'Completed' : status === 'inprogress' ? 'In progress' : 'Locked';
          return `
            <div class="ct-card ct-course ${locked ? 'locked' : ''}" data-module-id="${m.id}" data-locked="${locked}">
              <div class="ct-c-top">
                <div class="ct-badge" style="background:${badgeBg};color:${badgeColor};">${status === 'completed' ? ICONS.check : locked ? ICONS.lock : i + 1}</div>
                <div class="ct-status" style="background:${badgeBg};color:${badgeColor};">${statusLabel}</div>
              </div>
              <div class="ct-title">${m.title}</div>
              <div class="ct-desc">${m.description || ''}</div>
              ${locked
                ? `<div class="ct-lock-row">${ICONS.lock} Complete the previous module to unlock</div>`
                : m.cooldown
                  ? `<div class="ct-lock-row">${ICONS.clock} Retry quiz in ${m.cooldown.label}</div>`
                  : `<div class="ct-bar"><div class="ct-bar-fill" style="width:${pct}%;${pct === 100 ? 'background:var(--ct-success);' : ''}"></div></div>
                     <div style="font-size:11.5px;color:var(--ct-ink-soft);text-align:right;">${pct}%</div>`
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
  back.innerHTML = `← Back to Training`;
  back.onclick = () => { state.view = 'training'; state.activeModuleId = null; render(); };
  container.appendChild(back);

  const grid = document.createElement('div');
  grid.className = 'ct-module-grid';
  grid.innerHTML = `
    <div class="ct-card" style="padding:20px;">
      <div class="ct-video-wrap" id="ctVideoWrap">
        <video id="ctVideo" src="${m.videoUrl}"></video>
        <div class="ct-video-controls">
          <input type="range" id="ctSeek" min="0" max="0" step="0.1" value="0" />
          <div class="ct-video-controls-row">
            <div style="display:flex;align-items:center;gap:10px;">
              <button class="ct-icon-btn" id="ctPlay">${ICONS.play}</button>
              <span id="ctTime" style="color:#fff;font-size:12px;">0:00 / 0:00</span>
            </div>
            <button class="ct-icon-btn" id="ctFullscreen">${ICONS.fullscreen}</button>
          </div>
        </div>
        <div class="ct-lock-overlay" id="ctLockOverlay" style="display:none;">${ICONS.lock} Video locked while the quiz is in progress</div>
      </div>
      ${m.description ? `<div id="ctDesc" style="margin-top:16px;"><h4 style="font-size:14px;margin-bottom:6px;">Description</h4><p style="font-size:13.5px;color:var(--ct-ink-soft);line-height:1.6;">${m.description}</p></div>` : ''}
      <div id="ctQuizArea" style="margin-top:20px;"></div>
    </div>
    <div class="ct-card" id="ctSidebar" style="padding:16px 0;"></div>
  `;
  container.appendChild(grid);

  renderSidebar(grid.querySelector('#ctSidebar'));
  setupVideo(grid, m);

  // No video-completion gate here — trainees can jump straight to the quiz.
  const quizArea = grid.querySelector('#ctQuizArea');
  if (m.hasQuiz && !m.quizPassed) {
    quizArea.innerHTML = `
      <div style="text-align:center;padding-top:20px;border-top:1px solid var(--ct-border);">
        <p style="font-size:13.5px;margin-bottom:16px;">Ready to test what you learned?</p>
        <button class="ct-btn ct-btn-primary" id="ctStartQuiz">${ICONS.checkCircle} Start Quiz</button>
      </div>`;
    quizArea.querySelector('#ctStartQuiz').onclick = () => openQuizModal(m, grid);
  } else if (!m.hasQuiz && m.videoWatched) {
    quizArea.innerHTML = `
      <div style="text-align:center;padding-top:16px;border-top:1px solid var(--ct-border);">
        <p style="font-size:13.5px;color:var(--ct-success);font-weight:600;">${ICONS.checkCircle} Module complete — no quiz required. Next module unlocked.</p>
        <button class="ct-btn ct-btn-primary" id="ctBackBtn">Back to Training</button>
      </div>`;
    quizArea.querySelector('#ctBackBtn').onclick = () => { state.view = 'training'; render(); loadCurriculum(); };
  } else if (m.quizPassed) {
    quizArea.innerHTML = `<div style="text-align:center;padding-top:16px;border-top:1px solid var(--ct-border);color:var(--ct-success);font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;">${ICONS.checkCircle} Quiz already passed</div>`;
  }
}

function openQuizModal(mod, grid) {
  const video = grid.querySelector('#ctVideo');
  const overlay = grid.querySelector('#ctLockOverlay');
  if (video) video.pause();
  if (overlay) overlay.style.display = 'flex';

  const backdrop = document.createElement('div');
  backdrop.className = 'ct-modal-backdrop';
  backdrop.innerHTML = `
    <div class="ct-modal-box">
      <button class="ct-modal-close" id="ctCloseQuiz">${ICONS.close}</button>
      <div id="ctQuizModalBody"></div>
    </div>
  `;
  root.appendChild(backdrop);

  function close() {
    backdrop.remove();
    if (overlay) overlay.style.display = 'none';
  }
  backdrop.querySelector('#ctCloseQuiz').onclick = close;

  renderQuiz(backdrop.querySelector('#ctQuizModalBody'), mod, close);
}

async function renderQuiz(container, mod, onPassedClose) {
  container.innerHTML = `<div class="ct-loading">Loading quiz…</div>`;
  let quiz;
  try {
    quiz = await api(`quiz/${mod.id}`);
  } catch (err) {
    if (err.data?.cooldown) {
      container.innerHTML = `<div style="padding:16px;background:var(--ct-warning-soft);border:1px solid #FDE68A;border-radius:10px;display:flex;align-items:center;gap:8px;">${ICONS.clock} You can attempt this quiz again in <strong>${err.data.cooldown.label}</strong>.</div>`;
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
      <h3 style="font-size:16px;font-weight:700;margin-bottom:14px;">Quiz — pass ${mod.passScorePct}% to continue</h3>
      ${quiz.questions.map((q, i) => {
        const qr = resultByQ[q.id];
        return `
          <div style="margin-bottom:16px;">
            <div style="font-weight:600;font-size:13.5px;margin-bottom:8px;">${i + 1}. ${q.questionText}</div>
            ${q.options.map(o => {
              let cls = 'ct-option';
              let marker = '';
              if (qr) {
                if (o.id === qr.correctOptionId) { cls += ' correct'; marker = `<span style="color:var(--ct-success);">${ICONS.check}</span>`; }
                else if (o.id === qr.chosenOptionId) { cls += ' wrong'; marker = `<span style="color:var(--ct-danger);">${ICONS.close}</span>`; }
              }
              return `
                <label class="${cls}" data-qid="${q.id}" data-oid="${o.id}">
                  <input type="radio" name="q_${q.id}" ${state.quizAnswers[q.id] === o.id ? 'checked' : ''} />
                  <span style="flex:1;font-size:13px;">${o.optionText}</span>
                  ${marker}
                </label>`;
            }).join('')}
            ${qr && qr.explanation ? `<div style="margin-top:6px;padding:8px 12px;border-radius:8px;font-size:12.5px;display:flex;gap:6px;background:${qr.isCorrect ? 'var(--ct-success-soft)' : 'var(--ct-warning-soft)'};color:${qr.isCorrect ? 'var(--ct-success)' : 'var(--ct-warning)'};">${ICONS.info} ${qr.explanation}</div>` : ''}
          </div>`;
      }).join('')}
      ${result ? `<div style="padding:12px 16px;border-radius:9px;margin-bottom:12px;display:flex;align-items:center;gap:8px;background:${result.passed ? 'var(--ct-success-soft)' : 'var(--ct-danger-soft)'};color:${result.passed ? 'var(--ct-success)' : 'var(--ct-danger)'};font-weight:700;font-size:13.5px;">
        ${result.passed ? `${ICONS.checkCircle} Passed with ${result.scorePct}%! Next module unlocked.` : `Scored ${result.scorePct}% — need ${mod.passScorePct}%. Try again.`}
      </div>` : ''}
      ${result?.passed
        ? `<button class="ct-btn ct-btn-primary" id="ctContinue">Continue</button>`
        : `<button class="ct-btn ct-btn-primary" id="ctSubmitQuiz" ${!allAnswered ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''}>
             ${result && !result.passed ? 'Retry Quiz' : 'Submit Quiz'}
           </button>`
      }
    `;

    container.querySelectorAll('.ct-option').forEach(opt => {
      opt.addEventListener('click', () => {
        state.quizAnswers[opt.dataset.qid] = opt.dataset.oid;
        draw(null); // clear highlighting on new selection
      });
    });

    const continueBtn = container.querySelector('#ctContinue');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        if (onPassedClose) onPassedClose();
        state.view = 'training';
        render();
        loadCurriculum();
      });
    }

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
            container.innerHTML = `<div style="padding:16px;background:var(--ct-warning-soft);border:1px solid #FDE68A;border-radius:10px;display:flex;align-items:center;gap:8px;">${ICONS.clock} You can attempt this quiz again in <strong>${err.data.cooldown.label}</strong>.</div>`;
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

  // Forward-skip is intentionally unrestricted here — trainees can scrub
  // anywhere in the video, forward or back.
  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  video.addEventListener('loadedmetadata', () => { seek.max = video.duration; });
  video.addEventListener('timeupdate', () => {
    seek.value = video.currentTime;
    timeLabel.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
  });
  video.addEventListener('play', () => { playBtn.innerHTML = ICONS.pause; });
  video.addEventListener('pause', () => { playBtn.innerHTML = ICONS.play; });
  video.addEventListener('ended', async () => {
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
    video.currentTime = Number(seek.value);
  });
}

function renderSidebar(container) {
  const data = state.curriculum;
  if (!data) { container.innerHTML = ''; return; }
  container.innerHTML = `<div style="padding:0 16px 12px;border-bottom:1px solid var(--ct-border);"><h4 style="margin:0;font-size:14px;">Course content</h4><p style="margin:2px 0 0;font-size:11.5px;color:var(--ct-ink-soft);">${data.completedModules} / ${data.totalModules} completed</p></div>`;
  data.chapters.forEach(ch => {
    const chDiv = document.createElement('div');
    chDiv.innerHTML = `<div class="ct-sidebar-chapter">${ch.title}</div>`;
    ch.modules.forEach((m, i) => {
      const status = moduleStatus(m);
      const isActive = m.id === state.activeModuleId;
      const bg = status === 'completed' ? 'var(--ct-success-soft)' : isActive ? 'var(--ct-primary)' : 'var(--ct-neutral-soft)';
      const color = status === 'completed' ? 'var(--ct-success)' : isActive ? '#fff' : 'var(--ct-ink-soft)';
      const row = document.createElement('div');
      row.className = `ct-sidebar-mod ${isActive ? 'active' : ''}`;
      row.innerHTML = `<span class="ct-sidebar-num" style="background:${bg};color:${color};">${status === 'completed' ? ICONS.check : status === 'locked' ? ICONS.lock : i + 1}</span><span>${m.title}</span>`;
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
  const back = document.createElement('button');
  back.className = 'ct-back';
  back.innerHTML = '← Back to Training';
  back.onclick = () => { state.view = 'training'; render(); loadCurriculum(); };
  container.appendChild(back);

  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex;gap:6px;margin-bottom:16px;background:var(--ct-surface);border:1px solid var(--ct-border);border-radius:10px;padding:4px;width:fit-content;';
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
        <div><div style="font-weight:600;font-size:13px;">${c.title}</div><div style="font-size:11px;color:var(--ct-ink-soft);">${c.moduleCount} modules</div></div>
        <button data-del-chapter="${c.id}" style="border:none;background:none;color:var(--ct-danger);cursor:pointer;">${ICONS.close}</button>
      </div>
    `).join('')}
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--ct-border);">
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
    moduleCol.innerHTML = `<h3 style="margin:0 0 12px;font-size:14.5px;">Modules</h3><p style="color:var(--ct-ink-soft);font-size:13px;">Select a chapter.</p>`;
  } else if (!state.adminModules) {
    moduleCol.innerHTML = `<div class="ct-loading">Loading…</div>`;
  } else {
    moduleCol.innerHTML = `
      <h3 style="margin:0 0 12px;font-size:14.5px;">Modules — ${selChapter.title}</h3>
      ${state.adminModules.map(m => `
        <div class="ct-admin-row ${selModule?.id === m.id ? 'active' : ''}" data-mid="${m.id}">
          <div><div style="font-weight:600;font-size:13px;">${m.title}</div><div style="font-size:11px;color:var(--ct-ink-soft);">${m.questionCount} questions · pass ${m.passScorePct}%</div></div>
          <button data-del-module="${m.id}" style="border:none;background:none;color:var(--ct-danger);cursor:pointer;">${ICONS.close}</button>
        </div>
      `).join('')}
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--ct-border);">
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
    quizCol.innerHTML = `<h3 style="margin:0 0 12px;font-size:14.5px;">Quiz</h3><p style="color:var(--ct-ink-soft);font-size:13px;">Select a module.</p>`;
  } else if (!state.adminQuestions) {
    quizCol.innerHTML = `<div class="ct-loading">Loading…</div>`;
  } else {
    quizCol.innerHTML = `
      <h3 style="margin:0 0 12px;font-size:14.5px;">Quiz — ${selModule.title}</h3>
      ${state.adminQuestions.map((q, qi) => `
        <div class="ct-admin-row" style="cursor:default;flex-direction:column;align-items:stretch;">
          <div style="display:flex;justify-content:space-between;">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px;">${qi + 1}. ${q.questionText}</div>
            <button data-del-question="${q.id}" style="border:none;background:none;color:var(--ct-danger);cursor:pointer;">${ICONS.close}</button>
          </div>
          ${q.options.map(o => `<div style="font-size:12px;display:flex;align-items:center;gap:6px;color:${o.isCorrect ? 'var(--ct-success)' : 'var(--ct-ink-soft)'};">${o.isCorrect ? ICONS.check : '·'} ${o.optionText}</div>`).join('')}
        </div>
      `).join('')}
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--ct-border);" id="newQuestionForm">
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
      <div class="ct-card ct-summary-card"><div class="ct-summary-icon">${ICONS.users}</div><div><div style="font-size:20px;font-weight:700;">${summary.coaches}</div><div style="font-size:12px;color:var(--ct-ink-soft);">Coaches tracked</div></div></div>
      <div class="ct-card ct-summary-card"><div class="ct-summary-icon" style="background:var(--ct-success-soft);color:var(--ct-success);">${ICONS.check}</div><div><div style="font-size:20px;font-weight:700;">${summary.modulesPassed}</div><div style="font-size:12px;color:var(--ct-ink-soft);">Modules passed total</div></div></div>
      <div class="ct-card ct-summary-card"><div class="ct-summary-icon">${ICONS.play}</div><div><div style="font-size:20px;font-weight:700;">${summary.videosWatched}</div><div style="font-size:12px;color:var(--ct-ink-soft);">Videos watched total</div></div></div>
    </div>
    ${users.map(u => `
      <div class="ct-card" style="margin-bottom:12px;padding:16px 20px;">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div><div style="font-weight:700;">${u.name}</div><div style="font-size:12px;color:var(--ct-ink-soft);">${u.email}</div></div>
          <div style="display:flex;gap:20px;font-size:13px;">
            <div><strong>${u.videosWatched}</strong> videos</div>
            <div><strong>${u.modulesCompleted}</strong> passed</div>
            <div><strong>${u.avgScorePct}%</strong> avg</div>
            <div><strong>${u.totalAttempts}</strong> attempts</div>
          </div>
          <div style="font-size:12px;color:var(--ct-ink-soft);">${fmtDate(u.lastActivityAt)}</div>
        </div>
      </div>
    `).join('')}
  `;
}

// ============================================================================
// BOOT
// ============================================================================

(async () => {
  root.innerHTML = `<div class="ct-loading">Loading…</div>`;
  state.currentUser = await getCurrentUser();
  if (!state.currentUser.email) {
    root.innerHTML = `<div class="ct-error">Could not determine the logged-in user's email. Edit getCurrentUser() in this block for your NocoBase version.</div>`;
  } else {
    render();
    loadCurriculum();
  }
})();
