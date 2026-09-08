// coach_resources_console.js — Coach Resources Console (NocoBase JS-block)
//
// Static resource hub for coaches: PGN Library, Training Videos, Test Links, Syllabus,
// Test Score. PGN Library data is sourced from pgn_library.html; Test Links from
// test_links.html; Syllabus topics are the full session-by-session curriculum supplied
// directly. Any level/column not present in a source is rendered as "—" rather than invented.
// Training Videos embeds the full Caissa Coach Training block (see training.js) — video
// modules + quizzes backed by the caissa-lms Vercel API — mounted lazily into this tab the
// first time it's opened (see mountTrainingVideosBlock / ensureTrainingAppLoaded below).
// Test Score is a live, searchable list of every test attempt (fetched from the coach
// dashboard API), separate from the static Test Links above.
//
// All external links open in a new tab. NocoBase strips <style> tags AND can drop
// target="_blank" from anchors, so (a) everything below uses inline style="" attributes
// with explicit width/height on every <svg>, and (b) external links use a
// data-ext-link + JS window.open() fallback instead of relying on target="_blank" alone.

const requester =
  (ctx && ctx.app && ctx.app.apiClient && ctx.app.apiClient.request.bind(ctx.app.apiClient)) ||
  (ctx && ctx.apiClient && ctx.apiClient.request.bind(ctx.apiClient)) || null;

const FONT = "'Inter','Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif";
const FONT_HEAD = "'Space Grotesk','Inter','Segoe UI',sans-serif";
const FONT_MONO = "'IBM Plex Mono','Segoe UI Mono',monospace";
const FONT_IMPORT = `<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
</style>`;

const COLORS = {
  bg: '#EEF3FB',
  card: '#FFFFFF',
  cardAlt: '#F5F8FD',
  ink: '#16233F',
  inkSoft: '#5B6B8C',
  inkFaint: '#93A2C0',
  line: '#DDE7F6',
  lineSoft: '#E9F0FA',
  brand: '#2F5FDB',
  brandDark: '#1E3FA0',
  brand10: '#E7EDFC',
  teal: '#12A38C',
  teal10: '#E4F6F2',
  purple: '#7C5CFC',
  purple10: '#EFEBFF',
  amber: '#EE9F2E',
  amberDark: '#B9791A',
  amber10: '#FDF1DF',
};

function svg(size, inner, strokeWidth) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth || 1.8}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

const ICONS = {
  overview: size => svg(size, `<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>`),
  pgn: size => svg(size, `<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5V4.5Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>`),
  training: size => svg(size, `<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" stroke="none"/>`),
  tests: size => svg(size, `<path d="M9 11.5 11 13.5 15.5 9"/><rect x="3" y="3" width="18" height="18" rx="4"/>`),
  syllabus: size => svg(size, `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M8 8h8M8 11.5h8M8 15h5"/>`),
  testScore: size => svg(size, `<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>`),
  search: size => svg(size, `<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>`, 2),
  chevronRight: size => svg(size, `<path d="M9 6l6 6-6 6"/>`, 2.4),
  chevronLeft: size => svg(size, `<path d="M15 6l-6 6 6 6"/>`, 2.4),
  chevronDown: size => svg(size, `<path d="m6 9 6 6 6-6"/>`, 2.4),
  externalLink: size => svg(size, `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>`, 2),
  folder: size => svg(size, `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z"/>`, 2),
  image: size => svg(size, `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>`, 2),
  clipboardCheck: size => svg(size, `<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>`, 2),
  inbox: size => svg(size, `<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>`),
  listChecks: size => svg(size, `<path d="m3 7 2 2 4-4"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8M13 18h8"/>`, 2),
  filter: size => svg(size, `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`, 2),
};

// ---- Source data (verbatim from pgn_library.html) ----
const PGN_LEVELS = [
  { label: 'BEGINNER', classwork: 'https://drive.google.com/drive/folders/1zTgFX4-vL3Sb_TXgcYpJb1pKXVLlbFgn', homework: 'https://drive.google.com/drive/folders/1HdcK34zQptmT_N9Ui44OabJE6wMy0JDg', images: null, test: 'https://drive.google.com/drive/folders/1rM4IOqC-3HaNrCKTH6W7dSAXlytob9Qy' },
  { label: 'FOUNDATION - 1', classwork: 'https://drive.google.com/drive/folders/1F-IkMETaDhVzknPN2SBFy4QqUMTT7AYX', homework: 'https://drive.google.com/drive/folders/17H2igLUfmFLo3R3c5qBIbBpSw_8bDHxA', images: 'https://drive.google.com/drive/folders/1Qim9LAoif8jj0xwTIE-m6JHpdP1bCphb', test: 'https://drive.google.com/drive/folders/1jmLNhuA1n-NSJGxYnByzZAim28pIhkZp' },
  { label: 'FOUNDATION - 2', classwork: 'https://drive.google.com/drive/folders/1lhV3XX4WtorIO4T0g2QnwvrQTEiMnLZE', homework: 'https://drive.google.com/drive/folders/1x9ZhFYk8qVOSu3jonZ8dh7nJvFi4CbAd', images: 'https://drive.google.com/drive/folders/1uWLSjcdFFrgx_bLGFIcRhDg-YbSgnglD', test: 'https://drive.google.com/drive/folders/1cXGT2kUaA0MltbNa8A27yg6_pJPuDEvp' },
  { label: 'FOUNDATION - 3', classwork: 'https://drive.google.com/drive/folders/1wU9PV3IMh5vQQKKttXiosmvzMM7yrZaA', homework: 'https://drive.google.com/drive/folders/1TC9P_rJ2q8wUgH21P_a8u2ycJ7BQNG2v', images: 'https://drive.google.com/drive/folders/1EuKMXW5p0S8SiQRdvAKinLSjXGnipuoF', test: 'https://drive.google.com/drive/folders/1ppLHRFSTqhMz27omnWJlPwua6bwFsX--' },
  { label: 'FOUNDATION - 4', classwork: 'https://drive.google.com/drive/folders/1mkbW0FqgLM8M7co9RabMipLKpPYlVh8i', homework: 'https://drive.google.com/drive/folders/16RH64vZTIioAv6ZgA7bGFfvD5Et0W0bt', images: 'https://drive.google.com/drive/folders/1_zYDnFCzJSSevpWeDQ3_hUJyHWkFqAdC', test: 'https://drive.google.com/drive/folders/1KMQ0rUNqUR-AJ0sxzA-C_SQUerITLUM2' },
  { label: 'INTERMEDIATE', classwork: 'https://drive.google.com/drive/folders/1Hz9HO16BhwFbTG0ASFvQs_7MfchSgj8u', homework: 'https://drive.google.com/drive/folders/1VhxOCdVUiS1xrihVQqZo7GAQ01HE94LN', images: null, test: 'https://drive.google.com/drive/folders/12pToZTqNGsMLAZdMzTfgUZDExiE2hZ2L' },
];

// ---- Source data (verbatim from test_links.html) ----
const TEST_LEVELS = [
  { label: 'BEGINNER', tests: [
    { name: 'Test 1 – [ Session 8 ]', url: 'https://forms.gle/xa3fSNkpUVqBk6WL7' },
    { name: 'Test 2 – [ Session 16 ]', url: 'https://forms.gle/qLJVuk2eMHH2Bg3o6' },
    { name: 'Final Assessment – [ Session 24 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=beginner-t24%3Atest3&bookKey=30261' },
  ] },
  { label: 'FOUNDATION - 1', tests: [
    { name: 'Test 1 – [ Session 8 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-1%3Atest1&bookKey=30258' },
    { name: 'Test 2 – [ Session 16 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-1%3Atest2&bookKey=30259' },
    { name: 'Final Assessment – [ Session 24 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-1%3Atest3&bookKey=30260' },
  ] },
  { label: 'FOUNDATION - 2', tests: [
    { name: 'Test 1 – [ Session 8 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-2%3Atest1&bookKey=31150' },
    { name: 'Test 2 – [ Session 16 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-2%3A-test2&bookKey=31151' },
    { name: 'Final Assessment – [ Session 24 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-2%3A-test3&bookKey=31152' },
  ] },
  { label: 'FOUNDATION - 3', tests: [
    { name: 'Test 1 – [ Session 8 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-3%3A-test1&bookKey=31054' },
    { name: 'Test 2 – [ Session 16 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-3%3A-test2&bookKey=31055' },
    { name: 'Final Assessment – [ Session 24 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-3%3A-test3&bookKey=31060' },
  ] },
  { label: 'FOUNDATION - 4', tests: [
    { name: 'Test 1 – [ Session 8 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-4%3Atest1&bookKey=31141' },
    { name: 'Test 2 – [ Session 16 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-4%3A-test2&bookKey=31142' },
    { name: 'Final Assessment – [ Session 24 ]', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=foundation-4%3Atest3&bookKey=31143' },
  ] },
  { label: 'INTERMEDIATE 1', tests: [
    { name: 'Test 1', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-1-%3A-test-1&bookKey=8089' },
    { name: 'Test 2', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-1-%3Atest-2&bookKey=7961' },
    { name: 'Test 3', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-1%3A-test-3&bookKey=7974' },
  ] },
  { label: 'INTERMEDIATE 2', tests: [
    { name: 'Test 1', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-2-%3A-test-1&bookKey=9687' },
    { name: 'Test 2', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-2-%3A-test-2&bookKey=9686' },
    { name: 'Test 3', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-2-%3A-test-3&bookKey=9688' },
  ] },
  { label: 'INTERMEDIATE 3', tests: [
    { name: 'Test 1', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-3-%3A-test-1&bookKey=11533' },
    { name: 'Test 2', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-3-%3A-test-2&bookKey=11535' },
    { name: 'Test 3', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-3-%3A-test-3&bookKey=11536' },
  ] },
  { label: 'INTERMEDIATE 4', tests: [
    { name: 'Test 1', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-4-%3A-test-1&bookKey=11596' },
    { name: 'Test 2', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-4-%3A-test-2&bookKey=11600' },
    { name: 'Test 3', url: 'https://learn.circlechess.com/resources?tab=user_assignment&name=intermediate-4-%3A-test-3&bookKey=11602' },
  ] },
];

// ---- Syllabus: full session-by-session curriculum, as supplied. Intermediate's 96
// sessions are split into 4 groups of 24 (Intermediate 1–4), renumbered 1–24 within each.
function topics(list) {
  return list.map((topic, i) => ({ n: i + 1, topic }));
}

const SYLLABUS_BEGINNER = topics([
  'Chessboard, Pieces & Rook', 'Bishop, Queen, Pawn & Notation', 'King, Knight & Piece Values',
  'Capture Basics & Hanging Pieces', 'Defending – ABCD Method', 'Checks, Defense & Checkmate Intro',
  'Capturing – Mixed Practice', 'Test 1', 'Checks & Defending – Practice', 'Mate in 1 & other strategies',
  'Castling', 'En Passant & Promotion', 'Assisted Mates in 1', 'Correct captures', 'Good Exchanges',
  'Test 2', 'Mate – Mixed Exercises', 'Draws – Stalemate & Rules', 'Draws – Other Rules',
  'Special Moves & Draws – Mixed', 'Opening traps & defence', 'Opening Principles',
  'Mating with 2 Rooks & Queen', 'Final Assessment',
]);

const SYLLABUS_F1 = topics([
  'Revision of Beginner topics', '1 Queen & 2 Rooks Checkmate revision', 'Pin', 'Skewer', 'Double attack',
  'Knight fork', 'Discovered Check and Double check', 'Test [1]', 'Mate in 1 mix', 'Opening traps',
  'Defend against Mate', 'Punishing bad opening moves', 'Back-Rank Mate', 'Simple checkmate in 2 moves',
  'Destroying & Distracting the defender', 'Test [2]', 'Checkmate with one Rook',
  'Queen V/s Bishop ; Queen v/s Knight', 'Mixed Tactics', 'Checkmate threat',
  'Passed Pawn & Pawn Promotion', 'Trapping the Pieces', 'Sacrificing the pieces to mate', 'Test [3]',
]);

const SYLLABUS_F2 = topics([
  'Revision of Foundation 1', 'Trapping the Pieces', 'Overloading', 'X-Ray Attack', 'Decoy / deflection',
  'Opening Traps', 'Intermediate moves', 'Test [1]', 'Rule of the square', 'Key Squares & Opposition',
  'King and Pawn vs King (4 scenerios)', 'Pawn Breakthroughs', 'Windmill', 'Forced Moves', 'Smothered Mate',
  'Test [2]', 'Checkmating Patterns (Legals Mate & Epaulette Mate)',
  'Checkmating Patterns (Anastasia Mate & Arabian Mate)', 'Checkmating Patterns (Bodens Mate & Dovetail Mate)',
  'Checkmating Patterns (Battery Mate & Hook Mate)', 'Checkmating Patterns (Damianos Mate & Lollis Mate)',
  'Checkmating Patterns (Grecos Mate & Pillsbury Mate)', 'Checkmating Patterns (Blackburne Mate & Opera Mate)',
  'Test [3]',
]);

const SYLLABUS_F3 = topics([
  'Revision of Foundation 2', 'Check mate in 3 (Easy)', 'Inroduction to World Champions',
  'Attacking on h7 ideas', 'Mixed tactics (3 moves)', 'Queen vs 7th rank pawn', 'Student Game review',
  'Test 1', 'Check mate in 3 (Difficult)', "Meet India's 1st WC & Short game", 'Attacking on g7 ideas',
  'Mixed tactics (3 moves)', 'Stalemate tactics', 'King and Pawn vs King (Above the basic)',
  'Student Game review', 'Test 2', "Meet India's youngest WC & his Short game", 'Attacking on f7 ideas',
  'Mixed tactics (3 moves)', 'Drawing tactics', 'King and Pawn vs King (Above the basic)',
  'Student Game review', 'Check Mate in 4 (Easy)', 'Test 3',
]);

const SYLLABUS_F4 = topics([
  'Blunder Check Routine', 'Identifying Tactical Targets', 'Creating Threats (Active Thinking)',
  'Building a Simple Attack Plan', 'Identifying Weak Defenders', 'Spotting Tactical Triggers',
  'Turning Small Advantages Into Tactics', 'Test 1', 'Compare Two Moves', 'Eliminate Bad Moves First',
  'Capture or Not to Capture', 'Improve Your Worst Piece', 'King Safety Evaluation',
  '2–3 Move Mini-Calculation', 'Playing for initiative', 'Test 2', 'King and Pawn Race',
  'Cutting Off the King', 'Lucena, Philidor', 'Theoretically drawn endgames',
  'Slow play – Hypermodern chess', 'Solidity', 'Converting Material Advantage', 'Test 3',
]);

const INTERMEDIATE_FULL = [
  'How to calculate (intro)', 'Centralisation of the King', 'Finding Candidate Moves (Checks, Captures, Threats)',
  'Principle of Two Weaknesses', 'Vishy Anand', 'Do Not Hurry', 'e4 e5 Italian structures', 'Monthly test',
  'Blunder Check', 'Passed Pawns', 'Process of Elimination', 'Schematic Thinking', 'Karpov',
  'Transformation of Material Advantage', 'e4-e5 scotch structure', 'Monthly test', 'Forcing Moves',
  'Rook Activity', 'Initiative', 'Pawn Breaks', 'Kasparov', 'Good Knight vs Bad Bishop Part 1',
  'Exchange sacrifice (thematic)', 'Monthly test',
  'Intuition', 'Good B vs Bad N part 1', 'Basic endgame tactics', 'Double Bishop Part 1', 'Bobby Fischer',
  'Multiple Minor Piece Endgames', 'e4 c6 Caro-Kann structures', 'Monthly test', 'King Safety',
  'Practical Rook Endgames part 1', 'Space part 1', 'Practical Rook Endgames part 2', 'Alexander Alekhine',
  'Capablanca', 'e4 c5 Sicilian Boleslavsky structures', 'Monthly test', 'Piece Activity',
  'Practical Queen Endgames part 1', 'Material Advantage & Pawn Structure (intro)',
  'Practical Queen Endgames part 2', 'Key Squares and Outposts', 'Rubinstein', 'Tactics', 'Monthly test',
  'Isolated, Doubled Pawns', 'Cut off, Back Rank Defense', 'Backward, Hanging Pawns', 'Lucena and Philidor',
  'Mikhail Botvinnik', 'Ulf Andersson', "Prophylaxis: anticipating opponent's ideas", 'Monthly test',
  'Passer, Majority/Minority', 'Short Side, Long Side', 'Isolated Queen Pawn', '3 vs 2, 4 vs 3',
  'Viktor Korchnoi', 'Magnus Carlsen', 'Transition from Middlegame to Endgame', 'Monthly test',
  'Pawn Chains part', 'Pawn Endgames', 'Sicilian Family', 'Bishop + Knight Checkmate',
  'Slav/Caro-Kann/QGD Family', 'Anatoly Karpov', 'Handling Material Imbalances (R+P vs 2 minors etc.)',
  'Monthly test',
  'KID/Benoni Family', 'Same Bishop', 'Power of Two Bishops', 'Opposite Bishop',
  'Opposite-Coloured Bishops', 'Vasily Smyslov', 'Weaknesses: creating and exploiting targets',
  'Monthly test', 'Good Knight vs Bad Bishop', 'Fortress draw', 'Bad Piece Manoeuvring part',
  'Winning Equal Endgames', 'Attacking Uncastled King part', 'Pentala Harikrishna',
  'Fortress Concepts in Practice', 'Monthly test', 'Attacking the Castled King part',
  'Queenless Middlegame', 'Sacrifice', 'Defending Worse Positions', 'Counterplay', 'Yuri Averbakh',
  'Defending Worse Positions: practical mindset & technique', 'Monthly test',
];

const SYLLABUS_I1 = topics(INTERMEDIATE_FULL.slice(0, 24));
const SYLLABUS_I2 = topics(INTERMEDIATE_FULL.slice(24, 48));
const SYLLABUS_I3 = topics(INTERMEDIATE_FULL.slice(48, 72));
const SYLLABUS_I4 = topics(INTERMEDIATE_FULL.slice(72, 96));

const SYLLABUS_LEVELS = [
  { label: 'Beginner', topics: SYLLABUS_BEGINNER },
  { label: 'Foundation 1', topics: SYLLABUS_F1 },
  { label: 'Foundation 2', topics: SYLLABUS_F2 },
  { label: 'Foundation 3', topics: SYLLABUS_F3 },
  { label: 'Foundation 4', topics: SYLLABUS_F4 },
  { label: 'Intermediate 1', topics: SYLLABUS_I1 },
  { label: 'Intermediate 2', topics: SYLLABUS_I2 },
  { label: 'Intermediate 3', topics: SYLLABUS_I3 },
  { label: 'Intermediate 4', topics: SYLLABUS_I4 },
];

// ---- Test Score: live per-attempt data from the coach-dashboard API (separate from the
// static Test Links above). Fetched lazily the first time the Test Score tab is opened.
const WEBINAR_DATE_FROM = '2026-06-01';
const TEST_SCORE_PAGE_SIZE = 20;
const COACH_DASHBOARD_API_BASE = 'https://api.circlechess.com/coach-dashboard';

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function fetchTestScoreRows() {
  if (!requester) return [];
  const today = new Date().toISOString().slice(0, 10);
  const params = { date_from: WEBINAR_DATE_FROM, date_to: addDays(today, 1), mode: 'rows' };
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${COACH_DASHBOARD_API_BASE}/test-score${query ? `?${query}` : ''}`;
  try {
    const res = await requester({
      url,
      method: 'get',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'X-NocoBase-Key': 'Caissa@2025',
      },
    });
    return ((res && res.data && res.data.results) || []);
  } catch (e) {
    console.error('cc-debug test-score fetch failed:', url, e);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Inline-style building blocks
// ---------------------------------------------------------------------------

function pillColor(cls) {
  if (cls === 'blue') return COLORS.brand;
  if (cls === 'green') return COLORS.teal;
  if (cls === 'purple') return COLORS.purple;
  if (cls === 'amber') return COLORS.amber;
  return COLORS.brand;
}

function linkPill(url, label, iconFn, cls) {
  if (!url) return `<span style="color:${COLORS.inkFaint};font-size:13px;">&mdash;</span>`;
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" data-ext-link="${url}" style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:6px 11px;border-radius:9px;border:none;color:#fff;white-space:nowrap;background:${pillColor(cls)};">${iconFn(12)}${label}</a>`;
}

function tabItem(view, iconFn, label, active) {
  return `
    <button data-view="${view}" style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:10px 10px 0 0;font-size:13.5px;font-weight:700;color:${active ? COLORS.brandDark : COLORS.inkSoft};border:none;border-bottom:2.5px solid ${active ? COLORS.brand : 'transparent'};background:${active ? COLORS.card : 'transparent'};cursor:pointer;font-family:${FONT};">
      <span style="display:flex;flex-shrink:0;">${iconFn(16)}</span>${label}
    </button>`;
}

function moduleCard(iconBg, iconFg, iconFn, title, desc, meta, view) {
  return `
    <button data-goto="${view}" style="background:${COLORS.card};border:1px solid ${COLORS.line};border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:12px;text-align:left;width:100%;cursor:pointer;font-family:${FONT};color:${COLORS.ink};">
      <div style="width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:${iconBg};color:${iconFg};">${iconFn(19)}</div>
      <h3 style="font-family:${FONT_HEAD};font-size:15px;margin:0;font-weight:600;">${title}</h3>
      <p style="font-size:12px;color:${COLORS.inkSoft};line-height:1.5;margin:0;min-height:32px;">${desc}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:700;color:${COLORS.inkFaint};border-top:1px dashed ${COLORS.line};padding-top:10px;">
        <span>${meta}</span>
        <span style="color:${COLORS.brand};display:flex;align-items:center;gap:4px;">Open ${ICONS.chevronRight(12)}</span>
      </div>
    </button>`;
}

function panelWrap(title, sub, bodyHtml) {
  return `
    <div style="background:${COLORS.card};border:1px solid ${COLORS.line};border-radius:16px;overflow:hidden;">
      <div style="padding:16px 20px;border-bottom:1px solid ${COLORS.lineSoft};">
        <h2 style="font-family:${FONT_HEAD};font-size:15px;margin:0;font-weight:600;">${title}</h2>
        ${sub ? `<div style="font-size:11.5px;color:${COLORS.inkFaint};margin-top:2px;">${sub}</div>` : ''}
      </div>
      ${bodyHtml}
    </div>`;
}

function emptyPanel(title, sub) {
  return panelWrap(title, sub, `
    <div style="padding:38px 20px;text-align:center;color:${COLORS.inkFaint};font-size:13px;">
      <div style="display:flex;justify-content:center;margin-bottom:10px;opacity:0.6;">${ICONS.inbox(30)}</div>
      <div>No content added yet — links will appear here once provided.</div>
    </div>`);
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

function renderOverview() {
  const pgnCount = PGN_LEVELS.length;
  const testCount = TEST_LEVELS.reduce((s, l) => s + l.tests.length, 0);
  return `
    <div style="margin-bottom:20px;">
      <h1 style="font-family:${FONT_HEAD};font-size:22px;margin:0 0 5px;font-weight:600;color:${COLORS.ink};">Coach Resources Console</h1>
      <p style="margin:0;color:${COLORS.inkSoft};font-size:13.5px;max-width:520px;">PGN library, training resources, test links, test scores and syllabus — all in one place.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:26px;">
      ${moduleCard(COLORS.brand10, COLORS.brandDark, ICONS.pgn, 'PGN Library', 'Classwork, homework, board images and test PGNs by level.', `${pgnCount} levels`, 'pgn')}
      ${moduleCard(COLORS.purple10, COLORS.purple, ICONS.training, 'Training Videos', 'Watch training videos and pass quizzes to unlock new modules.', 'Video training', 'training')}
      ${moduleCard(COLORS.amber10, COLORS.amberDark, ICONS.tests, 'Test Links', 'Monthly test links to share with students, grouped by level.', `${TEST_LEVELS.length} levels · ${testCount} links`, 'tests')}
      ${moduleCard(COLORS.teal10, COLORS.teal, ICONS.syllabus, 'Syllabus', 'Session-by-session topics, from Beginner through Intermediate 4.', `${SYLLABUS_LEVELS.length} levels`, 'syllabus')}
      ${moduleCard(COLORS.brand10, COLORS.brandDark, ICONS.testScore, 'Test Score', 'Search every test attempt by batch code, coach or student.', 'Live data', 'testScore')}
    </div>`;
}

function renderPgnView() {
  const rows = PGN_LEVELS.map((lv, i) => `
    <tr style="${i === 0 ? '' : `border-top:1px solid ${COLORS.lineSoft};`}">
      <td style="padding:12px 20px;font-weight:700;font-size:13px;color:${COLORS.ink};">${lv.label}</td>
      <td style="padding:12px 20px;">${linkPill(lv.classwork, 'Classwork', ICONS.folder, 'blue')}</td>
      <td style="padding:12px 20px;">${linkPill(lv.homework, 'Homework', ICONS.folder, 'green')}</td>
      <td style="padding:12px 20px;">${linkPill(lv.images, 'Images', ICONS.image, 'purple')}</td>
      <td style="padding:12px 20px;">${linkPill(lv.test, 'Test PGN', ICONS.clipboardCheck, 'amber')}</td>
    </tr>`).join('');
  const thStyle = `text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.inkFaint};font-weight:700;padding:11px 20px;border-bottom:1px solid ${COLORS.line};background:${COLORS.cardAlt};`;
  return panelWrap('PGN Library', 'Classwork, homework, board images and test PGNs', `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr>
          <th style="${thStyle}">Level</th><th style="${thStyle}">Class Work</th><th style="${thStyle}">Home Work</th><th style="${thStyle}">Images</th><th style="${thStyle}">Test PGN</th>
        </tr></thead>
        <tbody id="ccrcPgnBody">${rows}</tbody>
      </table>
    </div>`);
}

// The Caissa Coach Training block (mountTrainingVideosBlock, defined below) renders its own
// header/cards/styling straight into this mount point — no panelWrap wrapper here, same as
// how that block looked when it ran as its own standalone NocoBase JS-block.
function renderTrainingView() {
  return `<div id="ccrcTrainingMount"></div>`;
}

// Test Links — flat, always-expanded layout: level heading, then each test listed
// underneath as its own row. No collapse/accordion.
function renderTestsView() {
  const sections = TEST_LEVELS.map((lv, i) => `
    <div style="${i === 0 ? '' : `border-top:1px solid ${COLORS.lineSoft};`}padding:18px 20px;">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:10px;">
        <span style="width:26px;height:26px;border-radius:8px;background:${COLORS.amber10};color:${COLORS.amberDark};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${ICONS.tests(13)}</span>
        <span style="font-family:${FONT_HEAD};font-weight:700;font-size:14px;color:${COLORS.ink};">${lv.label}</span>
        <span style="margin-left:auto;font-size:10.5px;font-weight:700;color:${COLORS.inkFaint};background:${COLORS.cardAlt};border:1px solid ${COLORS.line};padding:3px 9px;border-radius:999px;">${lv.tests.length} link${lv.tests.length === 1 ? '' : 's'}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px;">
        ${lv.tests.map(t => `
          <a href="${t.url}" target="_blank" rel="noopener noreferrer" data-ext-link="${t.url}" style="display:flex;align-items:center;gap:9px;font-size:12.5px;color:${COLORS.brandDark};font-weight:600;padding:9px 12px;border-radius:9px;background:${COLORS.cardAlt};">
            <span style="display:flex;flex-shrink:0;color:${COLORS.brand};">${ICONS.externalLink(13)}</span>
            <span style="min-width:170px;flex-shrink:0;">${t.name}</span>
            <span style="color:${COLORS.inkFaint};font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.url}</span>
          </a>`).join('')}
      </div>
    </div>`).join('');
  return panelWrap('Monthly Test Links', 'All levels — click any test to open it in a new tab', `<div id="ccrcTestSections">${sections}</div>`);
}

// Syllabus — level dropdown + session_number/topic table for the selected level.
function renderSyllabusView() {
  const options = SYLLABUS_LEVELS.map((lv, i) => `<option value="${i}">${lv.label}</option>`).join('');
  const selectStyle = `border:1px solid ${COLORS.line};background:${COLORS.card};border-radius:10px;padding:9px 14px;font-family:${FONT};font-weight:700;font-size:13px;color:${COLORS.brandDark};cursor:pointer;`;
  const bodyHtml = `
    <div style="padding:16px 20px;display:flex;align-items:center;gap:10px;border-bottom:1px solid ${COLORS.lineSoft};">
      <span style="font-size:12.5px;font-weight:700;color:${COLORS.inkSoft};">Class type</span>
      <select id="ccrcSyllabusSelect" style="${selectStyle}">${options}</select>
      <span id="ccrcSyllabusCount" style="margin-left:auto;font-size:11px;font-weight:700;color:${COLORS.inkFaint};background:${COLORS.cardAlt};border:1px solid ${COLORS.line};padding:4px 10px;border-radius:999px;"></span>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr>
          <th style="text-align:left;width:110px;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.inkFaint};font-weight:700;padding:11px 20px;border-bottom:1px solid ${COLORS.line};background:${COLORS.cardAlt};">Session #</th>
          <th style="text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.inkFaint};font-weight:700;padding:11px 20px;border-bottom:1px solid ${COLORS.line};background:${COLORS.cardAlt};">Topic</th>
        </tr></thead>
        <tbody id="ccrcSyllabusBody"></tbody>
      </table>
    </div>`;
  return panelWrap('Syllabus — Session Topics', 'Pick a class type to see its session-by-session curriculum', bodyHtml);
}

// Test Score — live, searchable list of every test attempt. Search matches batch code,
// coach name or student name; results sorted newest-first by date.
function renderTestScoreView() {
  const bodyHtml = `
    <div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid ${COLORS.lineSoft};flex-wrap:wrap;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:${COLORS.brand};pointer-events:none;">${ICONS.filter(14)}</span>
        <input id="ccrcTestScoreSearch" type="text" placeholder="Search batch code, coach or student..." style="padding:9px 12px 9px 32px;border-radius:9px;border:1px solid ${COLORS.line};background:${COLORS.card};font-size:13px;color:${COLORS.ink};min-width:280px;font-family:${FONT};">
      </div>
      <span id="ccrcTestScoreCount" style="font-size:11px;font-weight:700;color:${COLORS.inkFaint};background:${COLORS.cardAlt};border:1px solid ${COLORS.line};padding:4px 10px;border-radius:999px;"></span>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr>
          <th style="text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.inkFaint};font-weight:700;padding:11px 20px;border-bottom:1px solid ${COLORS.line};background:${COLORS.cardAlt};">Date</th>
          <th style="text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.inkFaint};font-weight:700;padding:11px 20px;border-bottom:1px solid ${COLORS.line};background:${COLORS.cardAlt};">Test</th>
          <th style="text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.inkFaint};font-weight:700;padding:11px 20px;border-bottom:1px solid ${COLORS.line};background:${COLORS.cardAlt};">Batch</th>
          <th style="text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.inkFaint};font-weight:700;padding:11px 20px;border-bottom:1px solid ${COLORS.line};background:${COLORS.cardAlt};">Player</th>
          <th style="text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.inkFaint};font-weight:700;padding:11px 20px;border-bottom:1px solid ${COLORS.line};background:${COLORS.cardAlt};">Score | Total Puzzles</th>
        </tr></thead>
        <tbody id="ccrcTestScoreBody"></tbody>
      </table>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-top:1px solid ${COLORS.lineSoft};">
      <div id="ccrcTestScorePageLabel" style="font-size:12px;color:${COLORS.inkSoft};"></div>
      <div style="display:flex;gap:8px;">
        <button id="ccrcTestScorePrev" style="display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;">${ICONS.chevronLeft(12)}Prev</button>
        <button id="ccrcTestScoreNext" style="display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;">Next${ICONS.chevronRight(12)}</button>
      </div>
    </div>`;
  return panelWrap('Test Score', 'Search every test attempt by batch code, coach or student', bodyHtml);
}

// ---------------------------------------------------------------------------
// Training Videos — embedded Caissa Coach Training block (from training.js)
// ---------------------------------------------------------------------------
//
// Ported in as-is from training.js (its own standalone NocoBase JS-block), just wrapped in a
// factory function that mounts into a given `container` instead of taking over the whole
// `ctx.element` — everything else (state, ICONS, api(), render(), quiz/video/admin logic) stays
// function-scoped here so none of it collides with this file's own top-level names (this file
// already has its own `render`/`ICONS`/`state`-shaped locals for the resources console itself).
// Reuses the exact same caissa-lms Vercel API + shared-secret auth training.js used.
function mountTrainingVideosBlock(container) {
  const API_BASE = 'https://caissa-lms-lyart.vercel.app/api/block';
  const BLOCK_SECRET = 'ed58d73682a25f37b009242885217289da97bb810f0f3097';
  const ADMIN_ROLE_NAMES = ['admin', 'root'];

  let state = {
    view: 'training',
    activeModuleId: null,
    curriculum: null,
    currentUser: null,
    adminTab: 'content',
  };

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
    .ct-modal-box { background:var(--ct-surface); border-radius:var(--ct-radius-lg); width:80%; max-width:1000px; max-height:85vh; padding:0; position:relative; display:flex; flex-direction:column; overflow:hidden; }
    .ct-modal-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:18px 24px; border-bottom:1px solid var(--ct-border); flex-shrink:0; }
    .ct-modal-scroll { padding:20px 24px 24px; overflow-y:auto; flex:1; }
    .ct-modal-close { background:var(--ct-neutral-soft); border:none; border-radius:8px; width:28px; height:28px; display:grid; place-items:center; color:var(--ct-ink-soft); cursor:pointer; flex-shrink:0; }
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
  container.appendChild(style);

  const trainingRoot = document.createElement('div');
  trainingRoot.className = 'ct-app';
  container.appendChild(trainingRoot);

  async function getCurrentUser() {
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
      const res = await ctx.api.request({ url, method, headers, data: jsonBody });
      return res.data;
    } catch (err) {
      const r = await fetch(url, { method, headers, body: jsonBody ? JSON.stringify(jsonBody) : undefined });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { data, status: r.status });
      return data;
    }
  }

  function fmtDate(iso) { return iso ? new Date(iso).toLocaleString() : '—'; }

  function moduleStatus(m) {
    if (m.quizPassed) return 'completed';
    if (!m.unlocked) return 'locked';
    return 'inprogress';
  }
  function modulePct(m) { return m.quizPassed ? 100 : m.videoWatched ? 60 : 0; }

  function renderTrainingApp() {
    trainingRoot.innerHTML = '';
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
        renderTrainingApp();
      });
    });
    trainingRoot.appendChild(header);

    const body = document.createElement('div');
    trainingRoot.appendChild(body);

    if (state.view === 'training') renderTraining(body);
    else if (state.view === 'module') renderModule(body);
    else if (state.view === 'admin') renderAdmin(body);
  }

  async function loadCurriculum() {
    try {
      state.curriculum = await api('curriculum');
    } catch (err) {
      state.curriculumError = err.message;
    }
    renderTrainingApp();
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
        renderTrainingApp();
        loadModule();
      });
    });
  }

  async function loadModule() {
    try {
      state.moduleData = await api(`module/${state.activeModuleId}`);
    } catch (err) {
      state.moduleError = err.message;
    }
    renderTrainingApp();
  }

  function renderModule(container) {
    if (state.moduleError) { container.innerHTML = `<div class="ct-error">${state.moduleError}</div>`; return; }
    if (!state.moduleData) { container.innerHTML = `<div class="ct-loading">Loading…</div>`; return; }

    const m = state.moduleData;
    const back = document.createElement('button');
    back.className = 'ct-back';
    back.innerHTML = `← Back to Training`;
    back.onclick = () => { state.view = 'training'; state.activeModuleId = null; renderTrainingApp(); };
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
      quizArea.querySelector('#ctBackBtn').onclick = () => { state.view = 'training'; renderTrainingApp(); loadCurriculum(); };
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
        <div class="ct-modal-header">
          <div>
            <h3 id="ctQuizTitle" style="margin:0;font-size:16px;font-weight:700;">Quiz — pass ${mod.passScorePct}% to continue</h3>
            <div id="ctQuizProgress" style="font-size:12px;color:var(--ct-ink-soft);margin-top:2px;"></div>
          </div>
          <button class="ct-modal-close" id="ctCloseQuiz">${ICONS.close}</button>
        </div>
        <div class="ct-modal-scroll" id="ctQuizModalBody"></div>
      </div>
    `;
    trainingRoot.appendChild(backdrop);

    function close() {
      backdrop.remove();
      if (overlay) overlay.style.display = 'none';
    }
    backdrop.querySelector('#ctCloseQuiz').onclick = close;

    renderQuiz(backdrop.querySelector('#ctQuizModalBody'), mod, close, backdrop.querySelector('#ctQuizProgress'));
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function renderQuiz(container, mod, onPassedClose, progressEl) {
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

    // Randomize option order per question so it isn't the same A/B/C/D every time.
    quiz.questions.forEach(q => shuffleArray(q.options));

    // Always start a fresh attempt with no carried-over selections.
    state.quizAnswers = {};

    function draw(result) {
      const resultByQ = result ? Object.fromEntries(result.results.map(r => [r.questionId, r])) : {};
      const answeredCount = quiz.questions.filter(q => state.quizAnswers[q.id]).length;
      const allAnswered = answeredCount === quiz.questions.length;

      if (progressEl) progressEl.textContent = `Attempted ${answeredCount}/${quiz.questions.length}`;

      container.innerHTML = `
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
          : result && !result.passed
            ? `<button class="ct-btn ct-btn-primary" id="ctRetryQuiz">Retry Quiz</button>`
            : `<button class="ct-btn ct-btn-primary" id="ctSubmitQuiz" ${!allAnswered ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''}>Submit Quiz</button>`
        }
      `;

      container.querySelectorAll('.ct-option').forEach(opt => {
        opt.addEventListener('click', () => {
          state.quizAnswers[opt.dataset.qid] = opt.dataset.oid;
          draw(null);
        });
      });

      const continueBtn = container.querySelector('#ctContinue');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          if (onPassedClose) onPassedClose();
          state.view = 'training';
          renderTrainingApp();
          loadCurriculum();
        });
      }

      const retryBtn = container.querySelector('#ctRetryQuiz');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          // Failing clears every selection and reshuffles the options —
          // the next attempt starts from scratch, not where it left off.
          state.quizAnswers = {};
          quiz.questions.forEach(q => shuffleArray(q.options));
          draw(null);
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
        renderTrainingApp();
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
          row.addEventListener('click', () => { state.activeModuleId = m.id; state.moduleData = null; renderTrainingApp(); loadModule(); });
        }
        chDiv.appendChild(row);
      });
      container.appendChild(chDiv);
    });
  }

  function renderAdmin(container) {
    const back = document.createElement('button');
    back.className = 'ct-back';
    back.innerHTML = '← Back to Training';
    back.onclick = () => { state.view = 'training'; renderTrainingApp(); loadCurriculum(); };
    container.appendChild(back);

    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:6px;margin-bottom:16px;background:var(--ct-surface);border:1px solid var(--ct-border);border-radius:10px;padding:4px;width:fit-content;';
    tabs.innerHTML = `
      <button class="ct-tab ${state.adminTab === 'content' ? 'active' : ''}" data-atab="content">Content</button>
      <button class="ct-tab ${state.adminTab === 'activity' ? 'active' : ''}" data-atab="activity">Activity</button>
    `;
    tabs.querySelectorAll('[data-atab]').forEach(b => b.addEventListener('click', () => { state.adminTab = b.dataset.atab; renderTrainingApp(); }));
    container.appendChild(tabs);

    const body = document.createElement('div');
    container.appendChild(body);
    if (state.adminTab === 'content') renderAdminContent(body);
    else renderAdminActivity(body);
  }

  async function adminLoadChapters() {
    state.adminChapters = await api('admin/chapters', { admin: true });
    renderTrainingApp();
  }
  async function adminLoadModules(chapterId) {
    const res = await api(`admin/modules?chapterId=${chapterId}`, { admin: true });
    state.adminModules = res.modules;
    renderTrainingApp();
  }
  async function adminLoadQuestions(moduleId) {
    const res = await api(`admin/questions?moduleId=${moduleId}`, { admin: true });
    state.adminQuestions = res.questions;
    renderTrainingApp();
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
        renderTrainingApp();
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
          renderTrainingApp();
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

  async function adminLoadActivity() {
    const res = await api('admin/activity', { admin: true });
    state.adminActivity = res.users;
    renderTrainingApp();
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

  (async () => {
    trainingRoot.innerHTML = `<div class="ct-loading">Loading…</div>`;
    state.currentUser = await getCurrentUser();
    if (!state.currentUser.email) {
      trainingRoot.innerHTML = `<div class="ct-error">Could not determine the logged-in user's email. Edit getCurrentUser() in this block for your NocoBase version.</div>`;
    } else {
      renderTrainingApp();
      loadCurriculum();
    }
  })();
}

// ---------------------------------------------------------------------------
// Render + wire up events
// ---------------------------------------------------------------------------

function render(ctx) {
  const views = ['overview', 'pgn', 'training', 'tests', 'syllabus', 'testScore'];
  const navMeta = {
    overview: ICONS.overview, pgn: ICONS.pgn, training: ICONS.training, tests: ICONS.tests, syllabus: ICONS.syllabus, testScore: ICONS.testScore,
  };
  const navLabel = { overview: 'Overview', pgn: 'PGN Library', training: 'Training Videos', tests: 'Test Links', syllabus: 'Syllabus', testScore: 'Test Score' };

  ctx.element.innerHTML = `
    ${FONT_IMPORT}
    <div style="font-family:${FONT};background:${COLORS.bg};border-radius:20px;overflow:hidden;color:${COLORS.ink};">
      <div style="padding:18px 26px 0;background:${COLORS.card};border-bottom:1px solid ${COLORS.line};">
        <div id="ccrcTabs" style="display:flex;gap:2px;flex-wrap:wrap;">
          ${views.map(v => tabItem(v, navMeta[v], navLabel[v], v === 'overview')).join('')}
        </div>
      </div>

      <main style="padding:22px 26px 34px;max-width:1180px;">
        <section id="ccrc-view-overview" style="display:block;">${renderOverview()}</section>
        <section id="ccrc-view-pgn" style="display:none;">${renderPgnView()}</section>
        <section id="ccrc-view-training" style="display:none;">${renderTrainingView()}</section>
        <section id="ccrc-view-tests" style="display:none;">${renderTestsView()}</section>
        <section id="ccrc-view-syllabus" style="display:none;">${renderSyllabusView()}</section>
        <section id="ccrc-view-testScore" style="display:none;">${renderTestScoreView()}</section>
      </main>
    </div>`;

  const root = ctx.element;

  function showView(name) {
    views.forEach(v => {
      root.querySelector('#ccrc-view-' + v).style.display = v === name ? 'block' : 'none';
    });
    root.querySelectorAll('#ccrcTabs [data-view]').forEach(btn => {
      const active = btn.dataset.view === name;
      btn.style.color = active ? COLORS.brandDark : COLORS.inkSoft;
      btn.style.borderBottomColor = active ? COLORS.brand : 'transparent';
      btn.style.background = active ? COLORS.card : 'transparent';
    });
    if (name === 'testScore') ensureTestScoreLoaded();
    if (name === 'training') ensureTrainingAppLoaded();
  }

  // Training Videos block is mounted lazily (and only once) the first time that tab is
  // opened — same "fetch on first visit" idiom as ensureTestScoreLoaded above.
  let trainingAppMounted = false;
  function ensureTrainingAppLoaded() {
    if (trainingAppMounted) return;
    trainingAppMounted = true;
    const mount = root.querySelector('#ccrcTrainingMount');
    if (mount) mountTrainingVideosBlock(mount);
  }

  root.querySelectorAll('#ccrcTabs [data-view]').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));
  root.querySelectorAll('[data-goto]').forEach(card => card.addEventListener('click', () => showView(card.dataset.goto)));

  // Force-open in a new tab via JS rather than relying solely on target="_blank" — the
  // same host sanitizer that strips <style> blocks can also drop the target attribute.
  root.querySelectorAll('[data-ext-link]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      window.open(a.dataset.extLink, '_blank', 'noopener,noreferrer');
    });
  });

  // Syllabus dropdown -> render session table for the selected level.
  const syllabusSelect = root.querySelector('#ccrcSyllabusSelect');
  const syllabusBody = root.querySelector('#ccrcSyllabusBody');
  const syllabusCount = root.querySelector('#ccrcSyllabusCount');
  function renderSyllabusTable(idx) {
    const lv = SYLLABUS_LEVELS[idx];
    syllabusCount.textContent = `${lv.topics.length} sessions`;
    syllabusBody.innerHTML = lv.topics.map((t, i) => `
      <tr style="${i === 0 ? '' : `border-top:1px solid ${COLORS.lineSoft};`}">
        <td style="padding:10px 20px;font-weight:700;color:${COLORS.inkSoft};">${t.n}</td>
        <td style="padding:10px 20px;color:${COLORS.ink};">${t.topic}</td>
      </tr>`).join('');
  }
  if (syllabusSelect) {
    syllabusSelect.addEventListener('change', e => renderSyllabusTable(Number(e.target.value)));
    renderSyllabusTable(0);
  }

  // Test Score tab: fetched lazily on first visit, then filtered/paginated client-side.
  const testScoreState = { rows: null, loading: false, search: '', page: 1 };

  function testScoreFilteredSorted() {
    const q = testScoreState.search.trim().toLowerCase();
    const rows = testScoreState.rows || [];
    const filtered = !q ? rows : rows.filter(r =>
      String(r.batch_name || '').toLowerCase().includes(q) ||
      String(r.coach_name || '').toLowerCase().includes(q) ||
      String(r.player_name || '').toLowerCase().includes(q));
    return filtered.slice().sort((a, b) => {
      const da = a.milestone_session_date || '';
      const db = b.milestone_session_date || '';
      return da < db ? 1 : da > db ? -1 : 0;
    });
  }

  function paintTestScore() {
    const body = root.querySelector('#ccrcTestScoreBody');
    const count = root.querySelector('#ccrcTestScoreCount');
    const pageLabel = root.querySelector('#ccrcTestScorePageLabel');
    const prevBtn = root.querySelector('#ccrcTestScorePrev');
    const nextBtn = root.querySelector('#ccrcTestScoreNext');
    if (!body) return;

    if (testScoreState.loading) {
      body.innerHTML = `<tr><td colspan="5" style="padding:38px 20px;text-align:center;color:${COLORS.inkFaint};font-size:13px;">Loading test scores&hellip;</td></tr>`;
      count.textContent = '';
      pageLabel.textContent = '';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    const rows = testScoreFilteredSorted();
    const totalPages = Math.max(1, Math.ceil(rows.length / TEST_SCORE_PAGE_SIZE));
    testScoreState.page = Math.min(testScoreState.page, totalPages);
    const pageRows = rows.slice((testScoreState.page - 1) * TEST_SCORE_PAGE_SIZE, testScoreState.page * TEST_SCORE_PAGE_SIZE);

    body.innerHTML = pageRows.length ? pageRows.map((r, i) => `
      <tr style="${i === 0 ? '' : `border-top:1px solid ${COLORS.lineSoft};`}">
        <td style="padding:10px 20px;color:${COLORS.ink};">${r.milestone_session_date || ''}</td>
        <td style="padding:10px 20px;color:${COLORS.ink};">${r.test_name || ''}</td>
        <td style="padding:10px 20px;color:${COLORS.ink};">${r.batch_name || ''}</td>
        <td style="padding:10px 20px;color:${COLORS.ink};">${r.player_name || ''}</td>
        <td style="padding:10px 20px;color:${COLORS.ink};font-family:${FONT_MONO};">${r.score}/${r.total_puzzles}</td>
      </tr>`).join('') : `<tr><td colspan="5" style="padding:38px 20px;text-align:center;color:${COLORS.inkFaint};font-size:13px;">No test attempts found</td></tr>`;

    count.textContent = `${rows.length} attempt${rows.length === 1 ? '' : 's'}`;
    pageLabel.textContent = `Page ${testScoreState.page} of ${totalPages}`;
    prevBtn.disabled = testScoreState.page <= 1;
    nextBtn.disabled = testScoreState.page >= totalPages;
    prevBtn.style.background = prevBtn.disabled ? COLORS.line : COLORS.brand;
    prevBtn.style.color = prevBtn.disabled ? COLORS.inkFaint : '#fff';
    prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
    nextBtn.style.background = nextBtn.disabled ? COLORS.line : COLORS.brand;
    nextBtn.style.color = nextBtn.disabled ? COLORS.inkFaint : '#fff';
    nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
  }

  function ensureTestScoreLoaded() {
    paintTestScore();
    if (testScoreState.rows !== null || testScoreState.loading) return;
    testScoreState.loading = true;
    paintTestScore();
    fetchTestScoreRows().then(rows => {
      testScoreState.rows = rows;
      testScoreState.loading = false;
      paintTestScore();
    });
  }

  const testScoreSearch = root.querySelector('#ccrcTestScoreSearch');
  if (testScoreSearch) {
    testScoreSearch.addEventListener('input', () => {
      testScoreState.search = testScoreSearch.value;
      testScoreState.page = 1;
      paintTestScore();
    });
  }
  const testScorePrev = root.querySelector('#ccrcTestScorePrev');
  const testScoreNext = root.querySelector('#ccrcTestScoreNext');
  if (testScorePrev) testScorePrev.addEventListener('click', () => { if (testScoreState.page > 1) { testScoreState.page -= 1; paintTestScore(); } });
  if (testScoreNext) testScoreNext.addEventListener('click', () => { testScoreState.page += 1; paintTestScore(); });
}

render(ctx);
