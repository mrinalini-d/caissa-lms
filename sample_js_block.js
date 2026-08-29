/**
 * NocoBase User CRM Viewer - Custom JS Block
 * 
 * A read-only CRM dashboard for viewing user details, orders, batches, issues, and communications.
 * Compatible with NocoBase Custom JS blocks.
 * 
 * Features:
 * - Search by mobile number or order ID
 * - Display user snapshot (Section A)
 * - Display current order & batch (Section B)
 * - Order history table (Section C)
 * - Batch history table (Section D)
 * - Issues & requests table (Section E)
 * - Notifications list (Section F)
 * - Coach feedback table (Section G)
 */

// ============================================================================
// INITIALIZE UI
// ============================================================================

// Clear existing content
ctx.element.innerHTML = '';

// API Configuration
// const API_BASE_URL = 'https://e77f03a494f7.ngrok-free.app';
const API_BASE_URL = 'https://api.circlechess.com';
const CRM_API_BASE_URL = 'https://crm.circlechess.com';

// Certificate APIs
const GENERATE_API = '/subscription/v1/csoc/certificate/generate/';
const SHARE_API = '/subscription/v1/csoc/certificate/share/';

// Global variables for modals
let pendingSendRegId = null;

// Store state in closure (not on global window)
let state = {
  currentUser: null,
  currentQuery: '',
  isLoading: false,
  data: {
    chatLoaded: false,
    chatLoading: false,
    chatLoadingMore: false,
    chatTimeline: [],
    openTickets: [],
    chatError: null,
    chatPagination: {
      page: 1,
      hasMore: true,
      pageSize: 50
    },
    certificates: [],
    tournaments: [],
    user_details: {},
    test_scores: []
  },
  loadingSections: {} // Track loading state for individual sections
};

// Inject styles
const style = document.createElement('style');
style.textContent = `
  * {
    box-sizing: border-box;
  }

  .crm-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f5f5f5;
    padding: 12px;
    min-height: 100vh;
  }

  .crm-header {
    margin-bottom: 16px;
  }

  .crm-title {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 12px 0;
  }

  .search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .search-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-button {
    padding: 12px 24px;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .search-button:hover {
    background-color: #2563eb;
  }

  .search-button:active {
    background-color: #1d4ed8;
  }

  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: #6b7280;
    font-size: 14px;
    transition: color 0.2s, background-color 0.2s;
  }

  .btn-icon:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .btn-icon:active {
    background-color: #e5e7eb;
  }

  .btn-icon:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #6b7280;
  }

  .spinner {
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 0.8s linear infinite;
    margin-right: 10px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message {
    background-color: #fee2e2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 20px;
  }

  .empty-state {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 40px;
    text-align: center;
    color: #6b7280;
  }

  .section {
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #d1d5db;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 0;
  }

  .card {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 12px;
  }

  .card-field {
    margin-bottom: 8px;
    font-size: 12px;
  }

  .card-field:last-child {
    margin-bottom: 0;
  }

  .card-label {
    font-weight: 600;
    color: #6b7280;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  .card-value {
    color: #1f2937;
    font-size: 14px;
    word-break: break-word;
  }

  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .badge-success {
    background-color: #dcfce7;
    color: #166534;
  }

  .badge-warning {
    background-color: #fed7aa;
    color: #92400e;
  }

  .badge-error {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .badge-info {
    background-color: #dbeafe;
    color: #0c4a6e;
  }

  .table-container {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  thead {
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    background-color: #f9fafb;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid #f3f4f6;
    color: #1f2937;
  }

  tbody tr:hover {
    background-color: #fafbfc;
    cursor: pointer;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  .notification-list {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
  }

  .notification-item {
    padding: 8px 12px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
  }

  .notification-item:last-child {
    border-bottom: none;
  }

  .notification-channel {
    font-weight: 600;
    color: #374151;
    min-width: 80px;
  }

  .notification-purpose {
    flex: 1;
    color: #6b7280;
  }

  .notification-time {
    color: #9ca3af;
    font-size: 12px;
    min-width: 120px;
    text-align: right;
  }

  .status-active {
    color: #15803d;
  }

  .status-pending {
    color: #b45309;
  }

  .status-cancelled {
    color: #991b1b;
  }

  .status-inactive {
    color: #6b7280;
  }

  .crm-results {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 14px;
    align-items: start;
  }

  .profile-sidebar {
    position: sticky;
    top: 20px;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  @media (max-width: 768px) {
    .crm-results {
      grid-template-columns: 1fr;
    }
    
    .profile-sidebar {
      position: static;
    }
  }

  /* Modal styles */
  .modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    background-color: white;
    margin: 5% auto;
    padding: 20px;
    border-radius: 6px;
    width: 80%;
    max-width: 800px;
    max-height: 80%;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
  }

  /* Image viewer modal */
  .image-viewer-modal {
    display: none;
    position: fixed;
    z-index: 2000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
  }

  .image-viewer-content {
    position: relative;
    margin: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .image-viewer-content img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
  }

  .image-viewer-close {
    position: absolute;
    top: 20px;
    right: 30px;
    font-size: 40px;
    font-weight: bold;
    color: white;
    cursor: pointer;
    z-index: 2001;
  }

  .image-viewer-close:hover {
    color: #ccc;
  }

  .chat-bubble img {
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .chat-bubble img:hover {
    opacity: 0.8;
  }

  .modal-body {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 15px;
  }

  .modal-field {
    margin-bottom: 15px;
  }

  .modal-label {
    font-weight: 600;
    color: #374151;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .modal-value {
    color: #1f2937;
    font-size: 14px;
    word-break: break-word;
  }

  /* Confirmation Modal */
  .confirm-modal {
    display: none;
    position: fixed;
    z-index: 10000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .confirm-modal-content {
    background-color: white;
    margin: 20% auto;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    text-align: center;
  }

  .confirm-modal-message {
    margin-bottom: 20px;
    font-size: 16px;
    color: #1f2937;
  }

  .confirm-modal-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .confirm-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }

  .confirm-btn-yes {
    background-color: #3b82f6;
    color: white;
  }

  .confirm-btn-yes:hover {
    background-color: #2563eb;
  }

  .confirm-btn-no {
    background-color: #e5e7eb;
    color: #374151;
  }

  .confirm-btn-no:hover {
    background-color: #d1d5db;
  }

  /* Chatbox styles */
  .chat-section {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }

  .chat-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
  }

  .chat-thread {
    padding: 12px;
    background: #f3f4f6;
    max-height: 420px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .chat-message {
    display: flex;
    flex-direction: column;
    max-width: 75%;
    gap: 4px;
  }

  .chat-message.left {
    align-self: flex-start;
  }

  .chat-message.right {
    align-self: flex-end;
  }

  .chat-message.center {
    align-self: center;
    max-width: 90%;
    text-align: center;
  }

  .chat-bubble {
    padding: 8px 10px;
    border-radius: 10px;
    font-size: 13px;
    color: #111827;
    line-height: 1.4;
    background: #ffffff;
    border: 1px solid #e5e7eb;
  }

  .chat-message.left .chat-bubble {
    background: #ffffff;
  }

  .chat-message.right .chat-bubble {
    background: #dbeafe;
    border-color: #bfdbfe;
  }

  .chat-message.center .chat-bubble {
    background: #fef3c7;
    border-color: #fde68a;
  }

  .chat-meta {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 11px;
    color: #6b7280;
  }

  .chat-message.center .chat-meta {
    justify-content: center;
  }

  .chat-tag {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 999px;
    font-size: 10px;
    background: #e5e7eb;
    color: #374151;
  }

  .chat-icon {
    margin-right: 6px;
    font-size: 16px;
    display: inline-block;
    vertical-align: middle;
  }

  .chat-icon-success {
    color: #10b981;
  }

  .chat-icon-warning {
    color: #f59e0b;
  }

  .chat-icon-error {
    color: #ef4444;
  }

  .chat-icon-info {
    color: #3b82f6;
  }

  .chat-icon-primary {
    color: #8b5cf6;
  }

  .chat-icon-user {
    color: #06b6d4;
  }

  .chat-icon-internal {
    color: #6b7280;
  }

  .chat-icon-system {
    color: #374151;
  }

  .chat-audio {
    margin-top: 8px;
    width: 100%;
  }

  .chat-audio audio {
    width: 100%;
    max-width: 300px;
    height: 32px;
    border-radius: 16px;
  }

  .chat-composer {
    border-top: 1px solid #e5e7eb;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #ffffff;
  }

  .chat-textarea {
    width: 100%;
    min-height: 70px;
    resize: vertical;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
  }

  .chat-controls {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .chat-select {
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 12px;
    background: #ffffff;
  }

  .chat-send {
    padding: 8px 14px;
    background-color: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
  }

  .chat-send:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

ctx.element.appendChild(style);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================


function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${mins}`;
  } catch (e) {
    return dateStr;
  }
}


function formatAmount(amount, currency = 'INR') {
  if (!amount) return '-';
  const currencySymbols = {
    'INR': '₹',
    'USD': '$',
    'CAD': 'C$',
    'AUD': 'A$',
    'SEK': 'kr',
    'PHP': '₱'
  };
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function getStatusBadgeClass(status) {
  if (!status) return 'badge-info';
  const lower = String(status).toLowerCase();
  if (lower.includes('active') || lower.includes('success') || lower.includes('delivered')) {
    return 'badge-success';
  }
  if (lower.includes('pending') || lower.includes('in progress') || lower.includes('warning')) {
    return 'badge-warning';
  }
  if (lower.includes('cancelled') || lower.includes('failed') || lower.includes('error')|| lower.includes('not attended')) {
    return 'badge-error';
  }
  return 'badge-info';
}

function getStatusClass(status) {
  if (!status) return 'status-inactive';
  const lower = String(status).toLowerCase();
  if (lower.includes('active') || lower.includes('success')) {
    return 'status-active';
  }
  if (lower.includes('pending')) {
    return 'status-pending';
  }
  if (lower.includes('cancelled')) {
    return 'status-cancelled';
  }
  return 'status-inactive';
}

// ============================================================================
// API CALLS
// ============================================================================

function buildQueryString(params) {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

async function callApi(endpoint, params = {}) {
  try {
    const queryString = buildQueryString(params);
    const fullUrl = `${API_BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    const response = await ctx.api.request({
      url: fullUrl,
      method: 'GET'
    });
    
    return response.data;
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    throw error;
  }
}

async function postApi(endpoint, payload = {}) {
  try {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const response = await ctx.api.request({
      url: fullUrl,
      method: 'POST',
      data: payload
    });
    return response.data;
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    throw error;
  }
}

async function generateCertificate(regId) {
  try {
    const res = await postApi(GENERATE_API, { registration_id: regId });
    
    // Always reload batch and certificate data
    await loadBatchHistory();
    await loadCertificates();
    
    if (res.success) {
      alert('Certificate generated successfully!');
    } else {
      alert('Failed to generate certificate: ' + (res.error || 'Unknown error'));
    }
  } catch (error) {
    // Reload data even on error
    await loadBatchHistory();
    await loadCertificates();
    alert('Error generating certificate: ' + error.message);
  }
}

async function sendCertificate(regId) {
  pendingSendRegId = regId;
  const confirmModal = ctx.element.querySelector('#confirmModal');
  if (confirmModal) {
    confirmModal.style.display = 'block';
  }
}

async function performSendCertificate(regId) {
  try {
    const res = await postApi(SHARE_API, { registration_id: regId });
    
    // Always reload batch and certificate data
    await loadBatchHistory();
    await loadCertificates();
    
    if (res.success) {
      alert('Certificate sent successfully!');
    } else {
      alert('Failed to send certificate: ' + (res.error || 'Unknown error'));
    }
  } catch (error) {
    // Reload data even on error
    await loadBatchHistory();
    await loadCertificates();
    alert('Error sending certificate: ' + error.message);
  }
}

// ============================================================================
// ISSUE URL FUNCTIONS
// ============================================================================

function openIssueUrl(issue) {
  let url = '';
  
  if (issue.source === 'user_raised') {
    // Customer issue URL
    url = `https://crm.circlechess.com/admin/dqen4hsvnq2/popups/ulrd9bgqwjc/filterbytk/${issue.id.replace('user_', '')}`;
  } else if (issue.source === 'internal') {
    // Internal issue URL
    url = `https://crm.circlechess.com/admin/b96wmcs6nl1/popups/xfss08u4upq/filterbytk/${issue.id.replace('internal_', '')}`;
  }
  
  if (url) {
    window.open(url, '_blank');
  }
}

async function loadBatchHistory() {
  if (!state.currentUser) return;
  
  const mobile = state.currentUser.mobile_number;
  state.loadingSections.batches = true;
  updateUI();
  
  try {
    const response = await callApi('/crm/v1/user/batches', { mobile: mobile });
    if (response.success) {
      state.data.batches = response.batches;
    }
  } catch (error) {
    console.error('Error loading batch history:', error);
  } finally {
    state.loadingSections.batches = false;
    updateUI();
  }
}

async function loadIssues() {
  if (!state.currentUser) return;
  
  const mobile = state.currentUser.mobile_number;
  state.loadingSections.issues = true;
  updateUI();
  
  try {
    const response = await callApi('/crm/v1/user/issues', { mobile: mobile });
    if (response.success) {
      state.data.issues = response.issues;
    }
  } catch (error) {
    console.error('Error loading issues:', error);
  } finally {
    state.loadingSections.issues = false;
    updateUI();
  }
}

async function loadNotifications() {
  if (!state.currentUser) return;
  
  const mobile = state.currentUser.mobile_number;
  state.loadingSections.notifications = true;
  updateUI();
  
  try {
    const response = await callApi('/crm/v1/user/notifications', { mobile: mobile });
    if (response.success) {
      state.data.notifications = response.notifications;
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  } finally {
    state.loadingSections.notifications = false;
    updateUI();
  }
}

async function loadWebinarAttendance() {
  if (!state.currentUser) return;
  
  const mobile = state.currentUser.mobile_number;
  state.loadingSections.webinars = true;
  updateUI();
  
  try {
    const response = await callApi('/crm/v1/user/webinars', { mobile: mobile });
    if (response.success) {
      state.data.webinars = response.webinars;
    }
  } catch (error) {
    console.error('Error loading class attendance:', error);
  } finally {
    state.loadingSections.webinars = false;
    updateUI();
  }
}

async function loadCertificates() {
  if (!state.currentUser) return;
  
  const mobile = state.currentUser.mobile_number;
  state.loadingSections.certificates = true;
  updateUI();
  
  try {
    const response = await callApi('/crm/v1/user/certificates', { mobile: mobile });
    if (response.success) {
      state.data.certificates = response.certificates;
    }
  } catch (error) {
    console.error('Error loading certificates:', error);
  } finally {
    state.loadingSections.certificates = false;
    updateUI();
  }
}

async function loadTournaments() {
  if (!state.currentUser) return;
  
  const mobile = state.currentUser.mobile_number;
  state.loadingSections.tournaments = true;
  updateUI();
  
  try {
    const response = await callApi('/crm/v1/user/tournaments', { mobile: mobile });
    if (response.success) {
      state.data.tournaments = response.tournaments;
      
      // If chat is already loaded, rebuild the timeline to include tournaments
      if (state.data.chatLoaded && state.data.chatTimeline) {
        rebuildChatTimeline();
      }
    }
  } catch (error) {
    console.error('Error loading tournaments:', error);
  } finally {
    state.loadingSections.tournaments = false;
    updateUI();
  }
}

async function rebuildChatTimeline() {
  // Add tournament events to existing timeline
  const tournaments = state.data.tournaments || [];
  
  const tournamentEvents = [];
  tournaments.forEach(tournament => {
    if (!tournament?.start_date) return;
    const tournamentName = tournament.name || 'Unknown Tournament';
    const tournamentType = tournament.tournament_type || 'Tournament';
    const location = tournament.location || 'Online';
    tournamentEvents.push({
      timestamp: tournament.start_date,
      type: 'system',
      tag: 'Tournament',
      ticketLabel: null,
      text: `Participated in ${tournamentName} (${tournamentType}) • ${location}`
    });
  });
  
  // Add tournament events to existing timeline and re-sort
  const combinedTimeline = [...(state.data.chatTimeline || []), ...tournamentEvents];
  combinedTimeline.sort((a, b) => normalizeTimestamp(a.timestamp) - normalizeTimestamp(b.timestamp));
  
  state.data.chatTimeline = combinedTimeline;
}

async function loadUserDetails() {
  if (!state.currentUser) return;
  
  const mobile = state.currentUser.mobile_number;
  state.loadingSections.user_details = true;
  updateUI();
  
  try {
    const response = await callApi('/crm/v1/user/details', { mobile: mobile });
    if (response.success) {
      state.data.user_details = response.user_details;
    }
  } catch (error) {
    console.error('Error loading user details:', error);
  } finally {
    state.loadingSections.user_details = false;
    updateUI();
  }
}

async function loadTestScores() {
  if (!state.currentUser) return;
  
  const mobile = state.currentUser.mobile_number;
  state.loadingSections.test_scores = true;
  updateUI();
  
  try {
    const response = await callApi('/crm/v1/user/test-scores', { mobile: mobile });
    if (response.success) {
      state.data.test_scores = response.test_scores;
    }
  } catch (error) {
    console.error('Error loading test scores:', error);
  } finally {
    state.loadingSections.test_scores = false;
    updateUI();
  }
}

function normalizeTimestamp(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

function formatChatTimestamp(timestamp) {
  if (!timestamp) return '-';
  return formatDate(timestamp);
}

function processMessageText(text) {
  if (!text) return '-';
  
  // Convert markdown images to HTML img tags
  // Pattern: ![alt-text](url)
  const imagePattern = /!\[([^\]]+)\]\(([^)]+)\)/g;
  let processedText = text.replace(imagePattern, (match, alt, url) => {
    // If URL is relative (starts with /storage), prepend CRM API base URL
    const fullUrl = url.startsWith('/storage') ? `${CRM_API_BASE_URL}${url}` : url;
    // Generate unique ID for this image
    const imageId = 'img-' + Math.random().toString(36).substr(2, 9);
    return `<br><img src="${fullUrl}" alt="${alt}" data-image-src="${fullUrl}" data-image-id="${imageId}" style="max-width: 300px; max-height: 300px; border-radius: 6px; margin-top: 8px; display: block; cursor: pointer;" />`;
  });
  
  return processedText;
}

function buildChatTimeline({ orders, batches, notifications, coachFeedback, issueThreads, exotelCalls, leadSources, tournaments }) {
  const timeline = [];
  const openTickets = issueThreads?.open_tickets || [];

  (exotelCalls || []).forEach(call => {
    if (!call?.call_date) return;
    const duration = call.duration ? ` • ${call.duration}s` : '';
    const status = call.status ? ` • ${call.status}` : '';
    const isInbound = call.call_direction && call.call_direction.toLowerCase().includes('inbound');
    const messageType = isInbound ? 'user' : 'internal';
    const callLabel = isInbound ? 'Inbound Call' : 'Outbound Call';
    
    timeline.push({
      timestamp: call.call_date,
      type: messageType,
      tag: callLabel,
      ticketLabel: null,
      text: `Call ${call.call_type || 'Phone'}${duration}${status} • ${call.agent_name || 'Agent'}`,
      recording_url: call.recording_url || null
    });
  });

  (orders || []).forEach(order => {
    if (!order?.payment_date) return;
    timeline.push({
      timestamp: order.payment_date,
      type: 'system',
      tag: 'Payment',
      ticketLabel: null,
      text: `Payment received for Order ${order.order_id || '-'} • ${formatAmount(order.amount, order.currency)} • ${order.plan_name || 'Plan'}`
    });
  });

  (batches || []).forEach(batch => {
    if (batch?.assigned_date) {
      timeline.push({
        timestamp: batch.assigned_date,
        type: 'system',
        tag: 'Batch',
        ticketLabel: null,
        text: `Batch assigned: ${batch.batch_code || '-'} ${batch.course_level ? `(${batch.course_level})` : ''}`
      });
    }
    if (batch?.start_date) {
      timeline.push({
        timestamp: batch.start_date,
        type: 'system',
        tag: 'Batch',
        ticketLabel: null,
        text: `Batch started: ${batch.batch_code || '-'} ${batch.course_level ? `(${batch.course_level})` : ''}`
      });
    }
  });

  (notifications || []).forEach(notif => {
    if (!notif?.sent_at) return;
    timeline.push({
      timestamp: notif.sent_at,
      type: 'system',
      tag: notif.channel || 'Notification',
      ticketLabel: null,
      text: `Notification • ${notif.purpose || '-'}`
    //   text: notif.purpose || '-'
    });
  });

  (coachFeedback || []).forEach(item => {
    if (!item?.created_at) return;
    const summary = item.feedback_summary ? item.feedback_summary.substring(0, 120) : '-';
    timeline.push({
      timestamp: item.created_at,
      type: 'system',
      tag: 'Coach Feedback',
      ticketLabel: null,
      text: `Coach feedback (${item.ptm_month || 'PTM'}): ${summary} • Rating ${item.rating || '-'} /5`
    });
  });

  (issueThreads?.user_raised_issues || []).forEach(issue => {
    if (issue?.created_at) {
      timeline.push({
        timestamp: issue.created_at,
        type: 'user',
        tag: 'User',
        ticketLabel: `Ticket #${issue.id}`,
        text: `Issue raised: ${issue.description || issue.title || `Ticket #${issue.id}`}`
      });
    }

    (issue?.comments || []).forEach(comment => {
      if (!comment?.created_at) return;
      let messageType = 'internal';
      let tag = 'Internal';

      if (comment.comment_type === 0) {
        messageType = 'internal';
        tag = 'Public';
      } else if (comment.comment_type === 1) {
        messageType = 'internal';
        tag = 'Internal';
      } else if (comment.comment_type === 2 || comment.comment_type === 3) {
        messageType = 'user';
        tag = 'User';
      } else if (comment.comment_type === 4 || comment.comment_type === 5) {
        messageType = 'system';
        tag = 'System';
      }

      const attachment = comment.uploaded_file ? ` Attachment: ${comment.uploaded_file}` : '';
      timeline.push({
        timestamp: comment.created_at,
        type: messageType,
        tag,
        ticketLabel: `Ticket #${issue.id}`,
        text: `${comment.comment || '-'}${attachment}`
      });
    });
  });

  (issueThreads?.internal_issues || []).forEach(issue => {
    if (!issue?.created_at) return;
    timeline.push({
      timestamp: issue.created_at,
      type: 'system',
      tag: 'Internal Ticket',
      ticketLabel: `Internal #${issue.id}`,
      text: `Internal issue raised: ${issue.title || `Issue #${issue.id}`}`
    });
  });

  (leadSources || []).forEach(lead => {
    if (!lead?.create_timestamp) return;
    const source = lead.source || 'Unknown';
    const subject = lead.subject ? ` • ${lead.subject}` : '';
    const converted = lead.converted ? ' (Converted)' : '';
    timeline.push({
      timestamp: lead.create_timestamp,
      type: 'system',
      tag: 'Lead',
      ticketLabel: lead.freshdesk_ticket_id ? `Ticket #${lead.freshdesk_ticket_id}` : null,
      text: `Lead created via ${source}${subject}${converted}`
    });
  });

  (tournaments || []).forEach(tournament => {
    if (!tournament?.start_date) return;
    const tournamentName = tournament.name || 'Unknown Tournament';
    const tournamentType = tournament.tournament_type || 'Tournament';
    const location = tournament.location || 'Online';
    timeline.push({
      timestamp: tournament.start_date,
      type: 'system',
      tag: 'Tournament',
      ticketLabel: null,
      text: `Participated in ${tournamentName} (${tournamentType}) • ${location}`
    });
  });

  const filtered = timeline.filter(item => normalizeTimestamp(item.timestamp));
  filtered.sort((a, b) => normalizeTimestamp(a.timestamp) - normalizeTimestamp(b.timestamp));

  return { timeline: filtered, openTickets };
}

async function loadChatTimeline(loadMore = false) {
  if (!state.currentUser) return;
  if (state.data.chatLoading || (loadMore && state.data.chatLoadingMore)) return;

  if (loadMore && !state.data.chatPagination.hasMore) return;

  const isLoadingMore = loadMore;
  if (isLoadingMore) {
    state.data.chatLoadingMore = true;
  } else {
    state.data.chatLoading = true;
    state.data.chatPagination.page = 1;
    state.data.chatPagination.hasMore = true;
  }
  
  if (!isLoadingMore) {
    state.data.chatError = null;
  }
  updateUI();

  const mobile = state.currentUser.mobile_number;
  const page = isLoadingMore ? state.data.chatPagination.page : 1;
  const pageSize = state.data.chatPagination.pageSize;

  // Save scroll position for loading more
  let savedScrollHeight = 0;
  if (isLoadingMore) {
    const chatThread = ctx.element.querySelector('.chat-thread');
    if (chatThread) {
      savedScrollHeight = chatThread.scrollHeight;
    }
  }

  try {
    const [ordersRes, batchesRes, notificationsRes, coachRes, issueThreadsRes, exotelRes, certificatesRes, leadSourcesRes] = await Promise.allSettled([
      callApi('/crm/v1/user/orders', { mobile, page, limit: pageSize }),
      callApi('/crm/v1/user/batches', { mobile, page, limit: pageSize }),
      callApi('/crm/v1/user/notifications', { mobile, page, limit: pageSize }),
      callApi('/crm/v1/user/coach-feedback', { mobile, page, limit: pageSize }),
      callApi('/crm/v1/user/issue-threads', { mobile, page, limit: pageSize }),
      callApi('/crm/v1/user/exotel-calls', { mobile, page, limit: pageSize, process_recordings: false }),
      callApi('/crm/v1/user/certificates', { mobile }),
      callApi('/crm/v1/user/lead-sources', { mobile })
    ]);

    const orders = ordersRes.status === 'fulfilled' && ordersRes.value.success ? ordersRes.value.orders : [];
    const batches = batchesRes.status === 'fulfilled' && batchesRes.value.success ? batchesRes.value.batches : [];
    const notifications = notificationsRes.status === 'fulfilled' && notificationsRes.value.success ? notificationsRes.value.notifications : [];
    const coachFeedback = coachRes.status === 'fulfilled' && coachRes.value.success ? coachRes.value.coach_feedback : [];
    const issueThreads = issueThreadsRes.status === 'fulfilled' && issueThreadsRes.value.success ? issueThreadsRes.value : { user_raised_issues: [], internal_issues: [], open_tickets: [] };
    const exotelCalls = exotelRes.status === 'fulfilled' && exotelRes.value.success ? exotelRes.value.calls : [];
    const certificates = certificatesRes.status === 'fulfilled' && certificatesRes.value.success ? certificatesRes.value.certificates : [];
    const leadSources = leadSourcesRes.status === 'fulfilled' && leadSourcesRes.value.success ? leadSourcesRes.value.lead_sources : [];
    const hasUnprocessedRecordings = exotelRes.status === 'fulfilled' && exotelRes.value.success && 
      exotelRes.value.calls.some(call => !call.recording_processed && call.recording_url);

    // Store all API data in state to prefill tables
    state.data.hasUnprocessedRecordings = hasUnprocessedRecordings;
    state.data.certificates = certificates;
    state.data.batches = batches;
    // Combine all issue types into a single array for the issues table
    const allIssues = [
      ...(issueThreads.user_raised_issues || []),
      ...(issueThreads.internal_issues || [])
    ];
    state.data.issues = allIssues;
    state.data.notifications = notifications;

    const { timeline: newTimeline, openTickets } = buildChatTimeline({
      orders,
      batches,
      notifications,
      coachFeedback,
      issueThreads,
      exotelCalls,
      leadSources,
      tournaments: state.data.tournaments || []
    });

    if (isLoadingMore) {
      // Prepend new messages to existing timeline
      state.data.chatTimeline = [...newTimeline, ...state.data.chatTimeline];
      state.data.chatPagination.page += 1;
      
      // Check if we got fewer results than requested, indicating no more data
      const totalNewItems = newTimeline.length;
      if (totalNewItems < pageSize) {
        state.data.chatPagination.hasMore = false;
      }
    } else {
      // Initial load
      state.data.chatTimeline = newTimeline;
      state.data.openTickets = openTickets;
      state.data.chatLoaded = true;
      state.data.chatPagination.page = 2; // Next page to load
    }
  } catch (error) {
    console.error('Error loading chat timeline:', error);
    if (!isLoadingMore) {
      state.data.chatError = error.message || 'Failed to load chat timeline';
    }
  } finally {
    if (isLoadingMore) {
      state.data.chatLoadingMore = false;
    } else {
      state.data.chatLoading = false;
    }
    updateUI();
    
    // Restore scroll position after loading more messages
    if (isLoadingMore) {
      setTimeout(() => {
        const chatThread = ctx.element.querySelector('.chat-thread');
        if (chatThread) {
          const newScrollHeight = chatThread.scrollHeight;
          const scrollDiff = newScrollHeight - savedScrollHeight;
          chatThread.scrollTop += scrollDiff;
        }
      }, 100);
    } else {
      // Scroll to bottom only for initial load
      setTimeout(() => scrollChatToBottom(), 100);
    }
  }
}

async function processRecordings() {
  if (!state.currentUser) return;
  if (state.data.chatLoading) return;

  state.data.chatLoading = true;
  updateUI();

  const mobile = state.currentUser.mobile_number;

  try {
    // Process recordings with process_recordings=true
    const exotelRes = await callApi('/crm/v1/user/exotel-calls', { 
      mobile, 
      page: 1, 
      limit: 100, // Process more recordings at once
      process_recordings: true 
    });

    if (exotelRes.success) {
      // Reset the flag and reload chat to show processed recordings
      state.data.hasUnprocessedRecordings = false;
      // Reload chat to show processed recordings
      await loadChatTimeline();
    } else {
      alert('Failed to process recordings. Please try again.');
    }
  } catch (error) {
    console.error('Error processing recordings:', error);
    alert('Error processing recordings. Please check the console for details.');
  } finally {
    state.data.chatLoading = false;
    updateUI();
  }
}

async function sendChatMessage(container) {
  const messageInput = container.querySelector('[data-chat-message]');
  const typeSelect = container.querySelector('[data-chat-type]');
  const ticketSelect = container.querySelector('[data-chat-ticket]');

  const message = messageInput ? messageInput.value.trim() : '';
  const commentTypeValue = typeSelect ? typeSelect.value : 'public';
  const ticketId = ticketSelect ? ticketSelect.value : '';

  if (!ticketId) {
    alert('Please select a ticket');
    return;
  }

  if (!message) {
    alert('Please enter a message');
    return;
  }

  const commentType = commentTypeValue === 'public' ? 0 : 1;

  try {
    await postApi('/user_raised_issues/add_issue_comment_from_crm', {
      issue_id: ticketId,
      comment: message,
      comment_type: commentType,
      commented_by: 'crm'
    });

    // Clear the input
    if (messageInput) {
      messageInput.value = '';
    }

    // Add the new message to the timeline without reloading everything
    const newMessage = {
      timestamp: new Date().toISOString(),
      type: 'internal', // CRM messages are internal
      tag: commentTypeValue === 'public' ? 'Public' : 'Internal',
      ticketLabel: `Ticket #${ticketId}`,
      text: message
    };

    // Add to timeline and sort
    state.data.chatTimeline.push(newMessage);
    state.data.chatTimeline.sort((a, b) => normalizeTimestamp(a.timestamp) - normalizeTimestamp(b.timestamp));

    // Update UI
    updateUI();

    // Scroll to bottom after adding message
    setTimeout(() => scrollChatToBottom(), 100);
  } catch (error) {
    console.error('Error sending chat message:', error);
    alert('Failed to send message');
  }
}

// Scroll chat to bottom
function scrollChatToBottom() {
  const chatThread = ctx.element.querySelector('.chat-thread');
  if (chatThread) {
    chatThread.scrollTop = chatThread.scrollHeight;
  }
}

// Handle chat scroll for pagination
function handleChatScroll(event) {
  const chatThread = event.target;
  const scrollTop = chatThread.scrollTop;
  const scrollHeight = chatThread.scrollHeight;
  const clientHeight = chatThread.clientHeight;
  
  // Load more when user scrolls to top (within 100px of top)
  if (scrollTop <= 100 && !state.data.chatLoadingMore && state.data.chatPagination.hasMore) {
    loadChatTimeline(true);
  }
}

// ============================================================================
// UI UPDATE FUNCTION
// ============================================================================

function updateUI() {
  if (!state.currentUser) return;
  
  const userData = {
    user: state.currentUser,
    user_details: state.data.user_details,
    current_order: state.data.current_order,
    active_batch: state.data.active_batches,
    current_batch: state.data.current_batch,
    all_batch_codes: state.data.all_batch_codes,
    orders: state.data.orders,
    batches: state.data.batches,
    issues: state.data.issues,
    notifications: state.data.notifications,
    webinars: state.data.webinars,
    coach_feedback: state.data.coach_feedback,
    engagement: state.data.engagement,
    tournaments: state.data.tournaments,
    test_scores: state.data.test_scores
  };
  
  const html = renderResults(userData);
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const newResults = temp.querySelector('.crm-results');
  const existingResults = ctx.element.querySelector('.crm-results');

  if (existingResults && newResults) {
    const currentProfile = existingResults.querySelector('.profile-sidebar');
    const currentMain = existingResults.querySelector('.main-content');
    const nextProfile = newResults.querySelector('.profile-sidebar');
    const nextMain = newResults.querySelector('.main-content');

    if (currentProfile && nextProfile) {
      currentProfile.innerHTML = nextProfile.innerHTML;
    }
    if (currentMain && nextMain) {
      currentMain.innerHTML = nextMain.innerHTML;
    }
  } else {
    const emptyState = ctx.element.querySelector('.empty-state');
    if (emptyState && newResults) {
      emptyState.outerHTML = newResults.outerHTML;
    }
  }

  bindResultsActions();
}

// Open image in viewer
function openImageViewer(imageSrc) {
  const imageViewer = ctx.element.querySelector('#imageViewer');
  if (!imageViewer) return;
  
  const viewerImg = imageViewer.querySelector('.image-viewer-img');
  if (viewerImg) {
    viewerImg.src = imageSrc;
  }
  imageViewer.style.display = 'block';
}

function bindResultsActions() {
  const container = ctx.element.querySelector('.crm-results');
  if (!container || container.dataset.actionsBound === 'true') return;

  // Bind image click handlers
  container.addEventListener('click', (event) => {
    const img = event.target.closest('img[data-image-src]');
    if (img) {
      event.preventDefault();
      const imageSrc = img.getAttribute('data-image-src');
      openImageViewer(imageSrc);
      return;
    }

    const generateBtn = event.target.closest('.generate-cert-btn');
    if (generateBtn) {
      event.preventDefault();
      const regId = generateBtn.getAttribute('data-reg-id');
      
      // Show loading state
      const originalContent = generateBtn.innerHTML;
      generateBtn.innerHTML = '⏳';
      generateBtn.disabled = true;
      generateBtn.style.opacity = '0.6';
      
      // Generate certificate
      generateCertificate(regId).finally(() => {
        // Revert loading state
        generateBtn.innerHTML = originalContent;
        generateBtn.disabled = false;
        generateBtn.style.opacity = '';
      });
      
      return;
    }

    const sendBtn = event.target.closest('.send-cert-btn');
    if (sendBtn) {
      event.preventDefault();
      const regId = sendBtn.getAttribute('data-reg-id');
      
      // Show loading state
      const originalContent = sendBtn.innerHTML;
      sendBtn.innerHTML = '⏳';
      sendBtn.disabled = true;
      sendBtn.style.opacity = '0.6';
      
      // Send certificate (this will show modal, then send if confirmed)
      sendCertificate(regId).finally(() => {
        // Revert loading state
        sendBtn.innerHTML = originalContent;
        sendBtn.disabled = false;
        sendBtn.style.opacity = '';
      });
      
      return;
    }

    const regenerateBtn = event.target.closest('.regenerate-cert-btn');
    if (regenerateBtn) {
      event.preventDefault();
      const regId = regenerateBtn.getAttribute('data-reg-id');
      
      // Show loading state
      const originalContent = regenerateBtn.innerHTML;
      regenerateBtn.innerHTML = '⏳';
      regenerateBtn.disabled = true;
      regenerateBtn.style.opacity = '0.6';
      
      // Regenerate certificate
      generateCertificate(regId).finally(() => {
        // Revert loading state
        regenerateBtn.innerHTML = originalContent;
        regenerateBtn.disabled = false;
        regenerateBtn.style.opacity = '';
      });
      
      return;
    }

    const viewBtn = event.target.closest('.view-cert-btn');
    if (viewBtn) {
      event.preventDefault();
      const certUrl = viewBtn.getAttribute('data-cert-url');
      window.open(certUrl, '_blank');
      return;
    }
  });

  // Bind chat filter changes
  container.addEventListener('change', (event) => {
    const filterSelect = event.target.closest('[data-chat-filter]');
    if (filterSelect) {
      event.preventDefault();
      state.data.chatFilter = filterSelect.value;
      updateUI();
      return;
    }
  });

  // Bind chat filter changes
  container.addEventListener('change', (event) => {
    const filterSelect = event.target.closest('[data-chat-filter]');
    if (filterSelect) {
      event.preventDefault();
      state.data.chatFilter = filterSelect.value;
      updateUI();
      return;
    }
  });

  container.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      event.preventDefault();
      const action = actionButton.getAttribute('data-action');
      if (action === 'load-batches') {
        loadBatchHistory();
      } else if (action === 'load-issues') {
        loadIssues();
      } else if (action === 'load-notifications') {
        loadNotifications();
      } else if (action === 'load-webinars') {
        loadWebinarAttendance();
      } else if (action === 'load-tournaments') {
        loadTournaments();
      } else if (action === 'load-chat') {
        loadChatTimeline();
      } else if (action === 'process-recordings') {
        processRecordings();
      } else if (action === 'send-chat') {
        const chatSection = actionButton.closest('.chat-section');
        if (chatSection) {
          sendChatMessage(chatSection);
        }
      }
      return;
    }

    const issueRow = event.target.closest('tr[data-issue]');
    if (issueRow) {
      const encoded = issueRow.getAttribute('data-issue');
      try {
        const issue = JSON.parse(decodeURIComponent(encoded));
        openIssueUrl(issue);
      } catch (error) {
        console.error('Failed to parse issue payload', error);
      }
    }

    const orderRow = event.target.closest('tr[data-order-id]');
    if (orderRow) {
      const orderId = orderRow.getAttribute('data-order-id');
      showOrderModal(orderId);
    }

    const tournamentRow = event.target.closest('tr[data-tournament-id]');
    if (tournamentRow) {
      const tournamentId = tournamentRow.getAttribute('data-tournament-id');
      showTournamentModal(tournamentId);
    }
  });

  // Bind chat scroll handler for pagination
  const chatThread = container.querySelector('[data-chat-thread]');
  if (chatThread) {
    chatThread.addEventListener('scroll', handleChatScroll);
  }

  container.dataset.actionsBound = 'true';
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

async function showOrderModal(orderId) {
  const modal = ctx.element.querySelector('#orderModal');
  const modalBody = modal.querySelector('#modalBody');
  const modalTitle = modal.querySelector('.modal-title');
  
  modalTitle.textContent = `Order Details - ${orderId}`;
  modalBody.innerHTML = '<div class="loading"><div class="spinner"></div> Loading order details...</div>';
  modal.style.display = 'block';
  
  try {
    const response = await callApi('/crm/v1/user/order-details', { order_id: orderId });
    if (response.success) {
      modalBody.innerHTML = renderOrderDetails(response.order);
    } else {
      modalBody.innerHTML = `<div class="error-message">${response.error}</div>`;
    }
  } catch (error) {
    console.error('Error loading order details:', error);
    modalBody.innerHTML = `<div class="error-message">Error: ${error.message || 'Failed to load order details'}</div>`;
  }
}

async function showTournamentModal(tournamentId) {
  const modal = ctx.element.querySelector('#orderModal');
  const modalBody = modal.querySelector('#modalBody');
  const modalTitle = modal.querySelector('.modal-title');
  
  modalTitle.textContent = 'Tournament Details';
  modalBody.innerHTML = '<div class="loading"><div class="spinner"></div> Loading tournament details...</div>';
  modal.style.display = 'block';
  
  try {
    // Find tournament in state.data.tournaments
    // Convert tournamentId to string for comparison since HTML attributes are strings
    const tournament = state.data.tournaments?.find(t => String(t.id) === String(tournamentId));
    if (tournament) {
      modalBody.innerHTML = renderTournamentDetails(tournament);
    } else {
      console.error('Tournament not found. Looking for ID:', tournamentId, 'Available tournaments:', state.data.tournaments);
      modalBody.innerHTML = '<div class="error-message">Tournament not found</div>';
    }
  } catch (error) {
    console.error('Error loading tournament details:', error);
    modalBody.innerHTML = `<div class="error-message">Error: ${error.message || 'Failed to load tournament details'}</div>`;
  }
}

function renderTournamentDetails(tournament) {
  let html = '';
  
  const fields = [
    { key: 'name', label: 'Tournament Name' },
    { key: 'tournament_type', label: 'Type' },
    { key: 'start_date', label: 'Start Date', format: (v) => formatDate(v) },
    { key: 'end_date', label: 'End Date', format: (v) => formatDate(v) },
    { key: 'organizer', label: 'Organizer' },
    { key: 'location', label: 'Location' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'federation', label: 'Federation' },
    { key: 'entry_fee', label: 'Entry Fee', format: (v) => v !== null && v !== undefined ? `₹${v}` : '-' },
    { key: 'max_participants', label: 'Max Participants' },
  ];
  
  fields.forEach(field => {
    const value = tournament[field.key];
    const displayValue = field.format ? field.format(value) : (value !== null && value !== undefined ? String(value) : '-');
    html += `
      <div class="modal-field">
        <div class="modal-label">${field.label}</div>
        <div class="modal-value">${displayValue}</div>
      </div>
    `;
  });
  
  return html;
}

function renderOrderDetails(order) {
  let html = '';
  
  const fields = [
    { key: 'order_id', label: 'Order ID' },
    { key: 'tournament_name', label: 'Plan Name', format: (v) => v ? truncateText(v, 50) : '-' },
    { key: 'customer_phone', label: 'Customer Phone' },
    { key: 'customer_email', label: 'Customer Email' },
    { key: 'amount', label: 'Amount', format: (v) => formatAmount(v, order.currency || 'INR') },
    { key: 'status', label: 'Status' },
    { key: 'create_timestamp', label: 'Create Timestamp', format: (v) => formatDate(v) },
    { key: 'tournament_id', label: 'Tournament ID' },
    { key: 'batch_code', label: 'Batch Code' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'currency', label: 'Currency' },
    { key: 'country', label: 'Country' },
    { key: 'sales_person', label: 'Sales Person' },
    { key: 'renewal_switch_meta', label: 'Renewal Switch Meta', format: (v) => v ? JSON.stringify(v, null, 2) : '-' },
  ];
  
  fields.forEach(field => {
    const value = order[field.key];
    const displayValue = field.format ? field.format(value) : (value !== null && value !== undefined ? String(value) : '-');
    const titleAttr = (field.key === 'tournament_name' && value) ? ` title="${value}"` : '';
    html += `
      <div class="modal-field">
        <div class="modal-label">${field.label}</div>
        <div class="modal-value"${titleAttr}>${displayValue}</div>
      </div>
    `;
  });
  
  return html;
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

function renderSearchBar(onSearch) {
  const searchDiv = document.createElement('div');
  searchDiv.className = 'search-bar';
  
  // Create input element
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'search-input';
  searchInput.placeholder = 'Search by mobile number';
  
  // Create button element
  const searchBtn = document.createElement('button');
  searchBtn.className = 'search-button';
  searchBtn.textContent = 'Search';
  searchBtn.type = 'button';
  
  // Attach event listeners
  const handleClick = () => onSearch(searchInput);
  const handleKeypress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(searchInput);
    }
  };
  
  searchBtn.addEventListener('click', handleClick);
  searchInput.addEventListener('keypress', handleKeypress);
  
  // Append elements
  searchDiv.appendChild(searchInput);
  searchDiv.appendChild(searchBtn);
  
  return searchDiv;
}

function renderUserSnapshot(user) {
  if (!user) return '';
  
  let namesHtml = '';
  if (user.cdc_name) {
    namesHtml += `<div class="card-field">
      <div class="card-label">Lichess Username</div>
      <div class="card-value">
        <a href="https://lichess.org/@/${user.cdc_name}" target="_blank" style="color: #3b82f6; text-decoration: none;">
          ${user.cdc_name} ↗
        </a>
      </div>
    </div>`;
  }
  if (user.lic_name) {
    namesHtml += `<div class="card-field">
      <div class="card-label">Chess.com Username</div>
      <div class="card-value">
        <a href="https://www.chess.com/member/${user.lic_name}" target="_blank" style="color: #3b82f6; text-decoration: none;">
          ${user.lic_name} ↗
        </a>
      </div>
    </div>`;
  }
  if (user.fide_id) {
    namesHtml += `<div class="card-field">
      <div class="card-label">FIDE ID</div>
      <div class="card-value">${user.fide_id}</div>
    </div>`;
  }
  
  return `
    <div class="section">
      <div class="section-title">User Profile</div>
      <div class="card profile-card">
        <div class="card-field">
          <div class="card-label">Full Name</div>
          <div class="card-value">${user.first_name || ''} ${user.last_name || ''}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Mobile Number</div>
          <div class="card-value">${user.mobile_number || '-'}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Email</div>
          <div class="card-value">${user.email || '-'}</div>
        </div>
        ${namesHtml}
        <div class="card-field">
          <div class="card-label">Account Status</div>
          <div class="card-value">
            <span class="badge ${user.is_active ? 'badge-success' : 'badge-error'}">${user.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCurrentState(currentOrder, currentBatch, engagement, activeBatches,all_batch_codes) {
  let html = '<div class="section"><div class="section-title">Current State Summary</div><div class="card-grid">';
  
  // Current Order Card
  if (currentOrder) {
    html += `
      <div class="card">
        <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937; font-size: 13px;">📋 Current Order & Payment</div>
        <div class="card-field">
          <div class="card-label">Order ID</div>
          <div class="card-value">${currentOrder.order_id || '-'}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Plan Name</div>
          <div class="card-value" title="${currentOrder.plan_name || '-'}">${truncateText(currentOrder.plan_name || '-', 25)}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Amount Paid</div>
          <div class="card-value">${formatAmount(currentOrder.amount_paid, currentOrder.currency)}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Payment Date</div>
          <div class="card-value">${formatDate(currentOrder.payment_date)}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Renewal Status</div>
          <div class="card-value">
            <span class="badge ${getStatusBadgeClass(currentOrder.renewal_status)}">
              ${currentOrder.renewal_status || 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    `;
  } else {
    html += '<div class="card"><div style="color: #9ca3af;">No current order</div></div>';
  }
  console.log(activeBatches,all_batch_codes,'activeBatches')
  // Active Batches Cards - show all active batches
  if (activeBatches && activeBatches.length > 0) {
    activeBatches.forEach((batch, index) => {
      const batchTitle = activeBatches.length > 1 
        ? `📦 Active Batch ${index + 1} of ${activeBatches.length}` 
        : '📦 Current Batch';
      html += `
        <div class="card">
          <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937; font-size: 13px;">${batchTitle}</div>
          <div class="card-field">
            <div class="card-label">Batch Codes</div>
            <div class="card-value">${batch.batch_code || '-'}</div>
          </div>
          <div class="card-field">
            <div class="card-label">Type</div>
            <div class="card-value">${batch.batch_type || '-'}</div>
          </div>
          <div class="card-field">
            <div class="card-label">Course Level</div>
            <div class="card-value">${batch.course_level || '-'}</div>
          </div>
          <div class="card-field">
            <div class="card-label">Coach Name</div>
            <div class="card-value">${batch.coach_name || '-'}</div>
          </div>
          <div class="card-field">
            <div class="card-label">Assigned Date</div>
            <div class="card-value">${formatDate(batch.assigned_date)}</div>
          </div>
          <div class="card-field">
            <div class="card-label">End Date</div>
            <div class="card-value">${formatDate(batch.end_date)}</div>
          </div>
        </div>
      `;
    });
  } else if (currentBatch) {
    // Fallback for backward compatibility
    html += `
      <div class="card">
        <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937; font-size: 13px;">📦 Current Batch</div>
        <div class="card-field">
          <div class="card-label">Batch Code</div>
          <div class="card-value">${currentBatch.batch_code || '-'}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Course Level</div>
          <div class="card-value">${currentBatch.course_level || '-'}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Coach Name</div>
          <div class="card-value">${currentBatch.coach_name || '-'}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Assigned Date</div>
          <div class="card-value">${formatDate(currentBatch.assigned_date)}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Start Date</div>
          <div class="card-value">${formatDate(currentBatch.start_date)}</div>
        </div>
      </div>
    `;
  } else {
    html += '<div class="card"><div style="color: #9ca3af;">No current batch</div></div>';
  }
  
  // Engagement & Progress Card
  if (engagement) {
    html += `
      <div class="card">
        <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937; font-size: 13px;">📈 Engagement & Progress</div>
        <div class="card-field">
          <div class="card-label">Attendance</div>
          <div class="card-value">${engagement.attendance_percentage || '-'}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Assignment Completion</div>
          <div class="card-value">${engagement.assignment_completion_percentage || '-'}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Learning Streak</div>
          <div class="card-value">${engagement.learning_streak_days || '-'}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Trainer Score</div>
          <div class="card-value">${engagement.trainer_score || '-'}</div>
        </div>
        <div class="card-field">
          <div class="card-label">Rating</div>
          <div class="card-value">${engagement.rating_change || '-'}</div>
        </div>
      </div>
    `;
  } else {
    html += '<div class="card"><div style="color: #9ca3af;">No engagement data</div></div>';
  }
  
  html += '</div></div>';
  return html;
}

function renderOrderHistory(orders) {
  if (!orders || orders.length === 0) {
    return `
      <div class="section">
        <div class="section-title">Order History</div>
        <div class="empty-state">No orders found</div>
      </div>
    `;
  }
  
  let html = '<div class="section"><div class="section-title">Order History</div>';
  html += '<div class="table-container"><table>';
  html += '<thead><tr>';
  html += '<th>Order ID</th>';
  html += '<th>Plan Name</th>';
  html += '<th>Payment Date</th>';
  html += '<th>Amount</th>';
  html += '<th>Status</th>';
  html += '<th>Onboarded</th>';
  html += '</tr></thead>';
  html += '<tbody>';
  
  orders.forEach(order => {
    html += `
      <tr data-order-id="${order.order_id}" style="cursor: pointer;">
        <td>${order.order_id || '-'}</td>
        <td title="${order.plan_name || '-'}">${truncateText(order.plan_name || '-', 30)}</td>
        <td>${formatDate(order.payment_date)}</td>
        <td>${formatAmount(order.amount, order.currency)}</td>
        <td><span class="badge ${getStatusBadgeClass(order.status)}">${order.status || '-'}</span></td>
        <td>
          <span class="badge ${order.is_onboarded ? 'badge-success' : 'badge-warning'}">
            ${order.is_onboarded ? 'Yes' : 'Not Onboarded'}
          </span>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div></div>';
  return html;
}

function renderBatchHistory(batches, certificates = []) {
  const isLoading = state.loadingSections.batches;
  
  if (isLoading) {
    return `
      <div class="section">
        <div class="section-title">Batch History</div>
        <div class="loading">
          <div class="spinner"></div> Loading batch history...
        </div>
      </div>
    `;
  }
  
  if (!batches || batches.length === 0) {
    return `
      <div class="section">
        <div class="section-title">Batch History</div>
        <div class="empty-state">
          <button class="search-button" type="button" data-action="load-batches" style="margin-bottom: 12px;">Get Batch History</button>
          <div>No batch history loaded yet</div>
        </div>
      </div>
    `;
  }
  
  let html = '<div class="section"><div class="section-title">Batch History</div>';
  html += '<div class="table-container"><table>';
  html += '<thead><tr>';
  html += '<th>Batch Code</th>';
  html += '<th>Type</th>';
  html += '<th>Course Level</th>';
  html += '<th>Coach Name</th>';
  html += '<th>Start Date</th>';
  html += '<th>End Date</th>';
  html += '<th>Status</th>';
  html += '<th>Certificate</th>';
  html += '</tr></thead>';
  html += '<tbody>';
  
  batches.forEach(batch => {
    console.log('Rendering batch:', batch,certificates);
    const cert = batch
    let certHtml = '';
    if (cert && cert.certificate_url) {
      certHtml = `<button class="btn-icon view-cert-btn" data-cert-url="${cert.certificate_url}" title="View Certificate">👁️</button>`;
      certHtml += ` <button class="btn-icon regenerate-cert-btn" data-reg-id="${cert.reg_id}" title="Regenerate Certificate">🔄</button>`;
      certHtml += ` <button class="btn-icon send-cert-btn" data-reg-id="${cert.reg_id}" title="Send Certificate">📤</button>`;
      if (cert.is_certificate_sent) {
        certHtml += ` <span class="cert-note">Sent</span>`;
      }
    } else {
      const regId = cert ? cert.reg_id : batch.reg_id;
      if (regId) {
        certHtml = `<button class="btn-icon generate-cert-btn" data-reg-id="${regId}" title="Generate Certificate">🎓</button>`;
      } else {
        certHtml = '-';
      }
    }
    html += `
      <tr>
        <td>${batch.batch_code || '-'}</td>
        <td><span class="badge badge-info">${batch.batch_type || '-'}</span></td>
        <td>${batch.course_level || '-'}</td>
        <td>${batch.coach_name || '-'}</td>
        <td>${formatDate(batch.start_date)}</td>
        <td>${formatDate(batch.end_date)}</td>
        <td><span class="badge ${getStatusBadgeClass(batch.status)}">${batch.status || '-'}</span></td>
        <td>${certHtml}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div></div>';
  return html;
}

function renderIssues(issues) {
  const isLoading = state.loadingSections.issues;
  
  if (isLoading) {
    return `
      <div class="section">
        <div class="section-title">Issues & Requests</div>
        <div class="loading">
          <div class="spinner"></div> Loading issues...
        </div>
      </div>
    `;
  }
  
  if (!issues || issues.length === 0) {
    return `
      <div class="section">
        <div class="section-title">Issues & Requests</div>
        <div class="empty-state">
          <button class="search-button" type="button" data-action="load-issues" style="margin-bottom: 12px;">Get Issues</button>
          <div>No issues loaded yet</div>
        </div>
      </div>
    `;
  }
  
  let html = '<div class="section"><div class="section-title">Issues & Requests</div>';
  html += '<div class="table-container"><table>';
  html += '<thead><tr>';
  html += '<th>Ticket ID</th>';
  html += '<th>Category</th>';
  html += '<th>Description</th>';
  html += '<th>Assigned To</th>';
  html += '<th>Status</th>';
  html += '<th>Created Date</th>';
  html += '<th>Last Updated</th>';
  html += '</tr></thead>';
  html += '<tbody>';
  
  issues.forEach(issue => {
    const issueJson = encodeURIComponent(JSON.stringify(issue));
    html += `
      <tr data-issue="${issueJson}">
        <td>${issue.id || '-'}</td>
        <td>${issue.category || '-'}</td>
        <td>${(issue.description || '-').substring(0, 50)}${(issue.description || '').length > 50 ? '...' : ''}</td>
        <td>${issue.assigned_to || '-'}</td>
        <td><span class="badge ${getStatusBadgeClass(issue.status)}">${issue.status || '-'}</span></td>
        <td>${formatDate(issue.created_at)}</td>
        <td>${formatDate(issue.updated_at)}</td></tr>
    `;
  });
  
  html += '</tbody></table></div></div>';
  return html;
}

function renderNotifications(notifications) {
  const isLoading = state.loadingSections.notifications;
  
  if (isLoading) {
    return `
      <div class="section">
        <div class="section-title">Notifications Sent</div>
        <div class="loading">
          <div class="spinner"></div> Loading notifications...
        </div>
      </div>
    `;
  }
  
  if (!notifications || notifications.length === 0) {
    return `
      <div class="section">
        <div class="section-title">Notifications Sent</div>
        <div class="empty-state">
          <button class="search-button" type="button" data-action="load-notifications" style="margin-bottom: 12px;">Get Notifications</button>
          <div>No notifications loaded yet</div>
        </div>
      </div>
    `;
  }
  
  let html = '<div class="section"><div class="section-title">Notifications Sent</div>';
  html += '<div class="notification-list">';
  
  notifications.forEach(notif => {
    html += `
      <div class="notification-item">
        <div class="notification-channel">${notif.channel || '-'}</div>
        <div class="notification-purpose">${notif.purpose || '-'}</div>
        <div class="notification-time">${formatDate(notif.sent_at)}</div>
      </div>
    `;
  });
  
  html += '</div></div>';
  return html;
}

function renderWebinarAttendance(webinars) {
  const isLoading = state.loadingSections.webinars;
  
  if (isLoading) {
    return `
      <div class="section">
        <div class="section-title">Class Attendance</div>
        <div class="loading">
          <div class="spinner"></div> Loading class attendance...
        </div>
      </div>
    `;
  }
  
  if (!webinars || webinars.length === 0) {
    return `
      <div class="section">
        <div class="section-title">Class Attendance</div>
        <div class="empty-state">
          <button class="search-button" type="button" data-action="load-webinars" style="margin-bottom: 12px;">Get Class Attendance</button>
          <div>No class attendance loaded yet</div>
        </div>
      </div>
    `;
  }
  
  let html = '<div class="section"><div class="section-title">Class Attendance</div>';
  html += '<div class="table-container"><table>';
  html += '<thead><tr>';
  html += '<th>Class Title</th>';
  html += '<th>Date</th>';
  html += '<th>Duration</th>';
  html += '<th>Status</th>';
  html += '<th>Attendance Time</th>';
  html += '</tr></thead>';
  html += '<tbody>';
  
  webinars.forEach(webinar => {
    html += `
      <tr>
        <td>${webinar.title || '-'}</td>
        <td>${formatDate(webinar.date)}</td>
        <td>${webinar.duration || '-'}</td>
        <td><span class="badge ${getStatusBadgeClass(webinar.status)}">${webinar.status || '-'}</span></td>
        <td>${webinar.attendance_time || '-'}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div></div>';
  return html;
}

function renderCoachFeedback(feedback) {
  if (!feedback || feedback.length === 0) {
    return `
      <div class="section">
        <div class="section-title">Coach Feedback (PTM)</div>
        <div class="empty-state">No feedback found</div>
      </div>
    `;
  }
  
  let html = '<div class="section"><div class="section-title">Coach Feedback (PTM)</div>';
  html += '<div class="table-container"><table>';
  html += '<thead><tr>';
  html += '<th>PTM Month</th>';
  html += '<th>Coach Name</th>';
  html += '<th>Feedback</th>';
  html += '<th>Rating</th>';
  html += '<th>Date</th>';
  html += '</tr></thead>';
  html += '<tbody>';
  
  feedback.forEach(fb => {
    html += `
      <tr>
        <td>${fb.ptm_month || '-'}</td>
        <td>${fb.coach_name || '-'}</td>
        <td>${(fb.feedback_summary || '-').substring(0, 50)}${(fb.feedback_summary || '').length > 50 ? '...' : ''}</td>
        <td>${fb.rating || '-'}/5</td>
        <td>${formatDate(fb.created_at)}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div></div>';
  return html;
}

function renderCertificates(certificates) {
  if (!certificates || certificates.length === 0) return '';

  let html = '<div class="section"><div class="section-title">Certificates</div><div class="table-container"><table class="data-table"><thead><tr><th>ID</th><th>Course</th><th>Certificate</th><th>Actions</th></tr></thead><tbody>';

  certificates.forEach(cert => {
    html += `<tr>
      <td>${cert.id}</td>
      <td>${cert.course_name || '-'}</td>
      <td>${cert.certificate_url ? `<a href="${cert.certificate_url}" target="_blank">View</a>` : 'Not generated'}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="generateCertificate(${cert.id})">Generate</button>
        <button class="btn btn-success btn-sm" onclick="sendCertificate(${cert.id})">Send</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table></div></div>';
  return html;
}

function renderTournaments(tournaments) {
  const isLoading = state.loadingSections.tournaments;

  if (isLoading) {
    return `
      <div class="section">
        <div class="section-title">Tournaments Played</div>
        <div class="loading">
          <div class="spinner"></div> Loading tournaments...
        </div>
      </div>
    `;
  }

  let html = '<div class="section"><div class="section-title">Tournaments Played</div>';
  if (!tournaments || tournaments.length === 0) {
    html += '<div class="empty-state">';
    html += '<button class="search-button" type="button" data-action="load-tournaments" style="margin-bottom: 12px;">Load Tournaments</button>';
    html += '<div>No tournaments loaded yet</div>';
    html += '</div>';
  } else {
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Tournament</th><th>Type</th><th>Dates</th><th>Location</th><th>Entry Fee</th><th>Organizer</th></tr></thead><tbody>';
    tournaments.forEach(tournament => {
      const startDate = tournament.start_date ? formatDate(tournament.start_date) : '-';
      const endDate = tournament.end_date ? formatDate(tournament.end_date) : '';
      const dates = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
      const entryFee = tournament.entry_fee !== null && tournament.entry_fee !== undefined ? `${tournament.entry_fee}` : '-';

      html += `<tr data-tournament-id="${tournament.id}" style="cursor: pointer;" title="Click to view tournament details">
        <td title="${tournament.name}">${truncateText(tournament.name, 40)}</td>
        <td>${tournament.tournament_type || '-'}</td>
        <td>${dates}</td>
        <td>${tournament.location || '-'}</td>
        <td>${entryFee}</td>
        <td>${tournament.organizer || '-'}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  }
  html += '</div>';
  return html;
}

function getTimelineEventTypes(timeline) {
  const types = new Set();
  (timeline || []).forEach(item => {
    if (item.tag) {
      types.add(item.tag);
    } else if (item.type === 'user' || item.type === 'internal') {
      types.add('Messages');
    }
  });
  return Array.from(types).sort();
}

function renderTestScores(test_scores) {
  let html = '<div class="section"><div class="section-title">Test Scores</div>';
  if (!test_scores || test_scores.length === 0) {
    html += '<div class="empty-state">No test scores available.</div>';
  } else {
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Month</th><th>Correct</th><th>Attempted</th><th>Total</th></tr></thead><tbody>';
    test_scores.forEach(score => {
      html += `<tr>
        <td>${score.month}</td>
        <td>${score.correct}</td>
        <td>${score.attempted}</td>
        <td>${score.total}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  }
  html += '</div>';
  return html;
}

function renderChatBox() {
  const { chatLoaded, chatLoading, chatLoadingMore, chatTimeline, openTickets, chatError, chatFilter } = state.data;
const loadDisabled = chatLoading ? 'disabled' : '';
  let threadHtml = '';
  if (chatLoading) {
    threadHtml = '<div class="loading"><div class="spinner"></div> Loading chat...</div>';
  } else if (chatError) {
    threadHtml = `<div class="error-message">${chatError}</div>`;
  } else if (!chatLoaded) {
    threadHtml = '<div class="empty-state">Click “Load Chat” to view the timeline.</div>';
  } else if (!chatTimeline || chatTimeline.length === 0) {
    threadHtml = '<div class="empty-state">No chat events found.</div>';
  } else {
    // Filter timeline based on selected filter
    const filteredTimeline = chatFilter === 'all' 
      ? chatTimeline 
      : chatTimeline.filter(item => item.tag === chatFilter || (chatFilter === 'Messages' && (item.type === 'user' || item.type === 'internal')));
    
    if (filteredTimeline.length === 0) {
      threadHtml = '<div class="empty-state">No events found for selected filter.</div>';
    } else {
      const loadingMoreHtml = chatLoadingMore ? '<div class="loading" style="padding: 10px;"><div class="spinner"></div> Loading more messages...</div>' : '';
      threadHtml = `${loadingMoreHtml}<div class="chat-thread" data-chat-thread>` + filteredTimeline.map(item => {
      const alignment = item.type === 'user' ? 'left' : item.type === 'internal' ? 'right' : 'center';
      const tagHtml = item.tag ? `<span class="chat-tag">${item.tag}</span>` : '';
      const ticketHtml = item.ticketLabel ? `<span class="chat-tag">${item.ticketLabel}</span>` : '';
      
      // Add icons based on message type and content
      let icon = '';
      let iconClass = 'chat-icon';
      
      // For left/right messages, only show call icons
      if (alignment === 'left' || alignment === 'right') {
        if (item.tag === 'Inbound Call' || item.tag === 'Outbound Call') {
          // Different icons based on call status
          if (item.text.includes('completed') || item.text.includes('answered')) {
            icon = '📞';
            iconClass += ' chat-icon-success';
          } else if (item.text.includes('missed') || item.text.includes('no-answer')) {
            icon = '📵';
            iconClass += ' chat-icon-warning';
          } else if (item.text.includes('busy')) {
            icon = '📞⏸️';
            iconClass += ' chat-icon-warning';
          } else if (item.text.includes('failed')) {
            icon = '📞❌';
            iconClass += ' chat-icon-error';
          } else {
            icon = '📞';
            iconClass += ' chat-icon-info';
          }
        }
      } else {
        // For center messages, show all icons
        if (item.tag === 'Inbound Call' || item.tag === 'Outbound Call') {
          // Different icons based on call status
          if (item.text.includes('completed') || item.text.includes('answered')) {
            icon = '📞';
            iconClass += ' chat-icon-success';
          } else if (item.text.includes('missed') || item.text.includes('no-answer')) {
            icon = '📵';
            iconClass += ' chat-icon-warning';
          } else if (item.text.includes('busy')) {
            icon = '📞⏸️';
            iconClass += ' chat-icon-warning';
          } else if (item.text.includes('failed')) {
            icon = '📞❌';
            iconClass += ' chat-icon-error';
          } else {
            icon = '📞';
            iconClass += ' chat-icon-info';
          }
        } else if (item.tag === 'Payment') {
          icon = '💳';
          iconClass += ' chat-icon-success';
        } else if (item.tag === 'Batch') {
          if (item.text.includes('assigned')) {
            icon = '📋';
            iconClass += ' chat-icon-info';
          } else if (item.text.includes('started')) {
            icon = '🚀';
            iconClass += ' chat-icon-success';
          } else {
            icon = '📚';
            iconClass += ' chat-icon-info';
          }
        } else if (item.tag === 'Notification') {
          icon = '📢';
          iconClass += ' chat-icon-info';
        } else if (item.tag === 'Coach Feedback') {
          icon = '👨‍🏫';
          iconClass += ' chat-icon-primary';
        } else if (item.tag === 'User' && item.text.includes('Issue raised')) {
          icon = '❓';
          iconClass += ' chat-icon-warning';
        } else if (item.tag === 'User' || item.tag === 'Public') {
          icon = '💬';
          iconClass += ' chat-icon-user';
        } else if (item.tag === 'Internal' || item.tag === 'Internal Ticket') {
        icon = '🛠️';
        iconClass += ' chat-icon-internal';
        }
        else if (item.tag === 'System') {
          icon = '⚙️';
          iconClass += ' chat-icon-system';
        }
      }
      
      const iconHtml = icon ? `<span class="${iconClass}">${icon}</span>` : '';
      
      // Add audio player if recording exists
      const recordingStatus = item.recording_processed === false ? ' (Processing...)' : '';
      const audioHtml = item.recording_url ? `<div class="chat-audio"><audio controls src="${item.recording_url}" preload="metadata"></audio>${recordingStatus}</div>` : '';
      
      // Process message text to render images
      const processedText = processMessageText(item.text);
      
      return `
  <div class="chat-message ${alignment}">
    <div class="chat-bubble">${iconHtml}${processedText}</div>
    ${audioHtml}
    <div class="chat-meta">
      ${ticketHtml}
      ${tagHtml}
      <span>${formatChatTimestamp(item.timestamp)}</span>
    </div>
  </div>
`;
  }).join('') + '</div>';

    }
  }

  const ticketsOptions = (openTickets || []).map(ticket => {
    return `<option value="${ticket.id}">#${ticket.id} • ${ticket.status || 'Open'} • ${ticket.title || 'Ticket'}</option>`;
  }).join('');

  const hasTickets = openTickets && openTickets.length > 0;

  const composerHtml = chatLoaded ? `
    <div class="chat-composer">
      <textarea class="chat-textarea" data-chat-message placeholder="Type a message..."></textarea>
      <div class="chat-controls">
        <select class="chat-select" data-chat-type>
          <option value="public">Public (to user)</option>
          <option value="internal">Internal (note)</option>
        </select>
        <select class="chat-select" data-chat-ticket ${hasTickets ? '' : 'disabled'}>
          ${hasTickets ? ticketsOptions : '<option value="">No open tickets</option>'}
        </select>
        <button class="chat-send" type="button" data-action="send-chat" ${hasTickets ? '' : 'disabled'}>Send</button>
      </div>
    </div>
  ` : '';

  const hasUnprocessedRecordings = state.data.hasUnprocessedRecordings;
  const processDisabled = chatLoading ? 'disabled' : '';

  const processButtonHtml = hasUnprocessedRecordings ? 
    `<button class="search-button" type="button" data-action="process-recordings" ${processDisabled} style="margin-left: 8px; background-color: #f59e0b; border-color: #f59e0b;">
      ${chatLoading ? 'Processing Recordings...' : 'Process Recordings'}
    </button>` : '';

  // Get unique event types for filter dropdown
  const eventTypes = getTimelineEventTypes(chatTimeline);
  const filterOptions = ['all', 'Messages', ...eventTypes.filter(t => t !== 'Messages')].filter((v, i, a) => a.indexOf(v) === i);
  let filterDropdownHtml = '';
  if (chatLoaded) {
    filterDropdownHtml = '<select class="chat-select" data-chat-filter style="margin-left: 8px;"><option value="all"' + (chatFilter === 'all' ? ' selected' : '') + '>All Events</option>';
    filterOptions.filter(t => t !== 'all').forEach(type => {
      filterDropdownHtml += '<option value="' + type + '"' + (chatFilter === type ? ' selected' : '') + '>' + type + '</option>';
    });
    filterDropdownHtml += '</select>';
  }

  return `
    <div class="section">
      <div class="chat-section">
        <div class="chat-header">
          <div class="chat-title">Timeline Chat</div>
          <div style="display: flex; align-items: center;">
            ${filterDropdownHtml}
            <button class="search-button" type="button" data-action="load-chat" ${loadDisabled}>${chatLoading ? 'Loading...' : 'Load Chat'}</button>
            ${processButtonHtml}
          </div>
        </div>
        ${threadHtml}
        ${composerHtml}
      </div>
    </div>
  `;
}

function renderResults(data) {
  let profileHtml = '';
  let mainHtml = '';
  
  if (data.user_details) {
    profileHtml = renderUserSnapshot(data.user_details);
  } else if (data.user) {
    profileHtml = renderUserSnapshot(data.user);
  }
  
  if (data.current_order || data.current_batch || data.engagement || data.active_batches || data.all_batch_codes) {
    console.log('Rendering current state with data:', data)
    mainHtml += renderCurrentState(data.current_order, data.current_batch, data.engagement, data.active_batch, data.all_batch_codes);
  }
  
  if (data.orders) {
    mainHtml += renderOrderHistory(data.orders);
  }
  
  // Always show batch history section with load button if not loaded
  mainHtml += renderBatchHistory(data.batches, data.certificates);
  
  // Always show issues section with load button if not loaded
  mainHtml += renderIssues(data.issues);
  
  // Always show notifications section with load button if not loaded
  mainHtml += renderNotifications(data.notifications);
  
  // Always show class attendance section with load button if not loaded
  mainHtml += renderWebinarAttendance(data.webinars);
  
  // Always show these sections even if empty
  mainHtml += renderCoachFeedback(data.coach_feedback || []);
  mainHtml += renderTournaments(data.tournaments || []);
  mainHtml += renderTestScores(data.test_scores || []);

  mainHtml += renderChatBox();
  
  return `
    <div class="crm-results">
      <div class="profile-sidebar">${profileHtml}</div>
      <div class="main-content">${mainHtml}</div>
    </div>
  `;
}

// ============================================================================
// MAIN SEARCH HANDLER & UI INITIALIZATION
// ============================================================================

function initializeUI() {
  const crm = document.createElement('div');
  crm.className = 'crm-container';
  
  const header = document.createElement('div');
  header.className = 'crm-header';
  header.innerHTML = '<h1 class="crm-title">User CRM Viewer</h1>';
  
  const resultsDiv = document.createElement('div');
  resultsDiv.className = 'empty-state';
  resultsDiv.textContent = 'Enter a mobile number or order ID to search';
  
  // Define search handler with closure access to resultsDiv
  async function handleSearch(searchInput) {
    const query = searchInput.value.trim();
    
    if (!query) {
      alert('Please enter a mobile number or order ID');
      return;
    }
    
    // Prevent multiple simultaneous searches
    if (state.isLoading) {
      return;
    }
    
    state.isLoading = true;
    state.currentQuery = query;
    
    // Clear previous data for fresh search
    state.currentUser = null;
    state.data = {
      chatLoaded: false,
      chatLoading: false,
      chatLoadingMore: false,
      chatTimeline: [],
      openTickets: [],
      chatError: null,
      chatFilter: 'all',
      chatPagination: {
        page: 1,
        hasMore: true,
        pageSize: 50
      }
    };
    state.loadingSections = {};
    
    // Find the CRM container
    const crmContainer = ctx.element.querySelector('.crm-container');
    
    // Remove any existing results container inside CRM
    const existing = crmContainer.querySelector('.empty-state, .crm-results');
    if (existing) {
      existing.remove();
    }
    
    // Create a loading state container
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'empty-state';
    loadingDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Loading...</div>';
    crmContainer.appendChild(loadingDiv);
    
    try {
      // Step 1: Search user
      const searchResponse = await callApi('/crm/v1/user/search', { query: query });
      
      if (!searchResponse.success) {
        loadingDiv.innerHTML = `<div class="error-message">User not found: ${searchResponse.error}</div>`;
        return;
      }
      console.log('Search response:', searchResponse);
      const userData = {
        user: searchResponse.user,
        current_order: searchResponse.current_order,
        current_batch: searchResponse.current_batch,
        active_batches: searchResponse.active_batches,
        all_batch_codes: searchResponse.all_batch_codes
      };
      
      state.currentUser = searchResponse.user;
      const mobile = searchResponse.user.mobile_number;
      
      // Store current order and batch data
      state.data.current_order = searchResponse.current_order;
      state.data.current_batch = searchResponse.current_batch;
      state.data.active_batches = searchResponse.active_batches;
      state.data.all_batch_codes = searchResponse.all_batch_codes;
      
      // Step 2: Fetch initial data (orders, feedback, engagement)
      const [ordersRes, feedbackRes, engagementRes] = await Promise.allSettled([
        callApi('/crm/v1/user/orders', { mobile: mobile }),
        callApi('/crm/v1/user/coach-feedback', { mobile: mobile }),
        callApi('/crm/v1/user/engagement', { mobile: mobile })
      ]);
      
      // Merge initial data
      if (ordersRes.status === 'fulfilled' && ordersRes.value.success) {
        state.data.orders = ordersRes.value.orders;
      }
      
      if (feedbackRes.status === 'fulfilled' && feedbackRes.value.success) {
        state.data.coach_feedback = feedbackRes.value.coach_feedback;
      }
      
      if (engagementRes.status === 'fulfilled' && engagementRes.value.success) {
        state.data.engagement = engagementRes.value.engagement;
      }
      
      // Render results
      const html = renderResults({
        user: state.currentUser,
        user_details: state.data.user_details,
        active_batches: state.data.active_batches,
        all_batch_codes: state.data.all_batch_codes,
        current_order: state.data.current_order,
        current_batch: state.data.current_batch,
        orders: state.data.orders,
        batches: state.data.batches,
        issues: state.data.issues,
        notifications: state.data.notifications,
        webinars: state.data.webinars,
        coach_feedback: state.data.coach_feedback,
        engagement: state.data.engagement,
        certificates: state.data.certificates,
        tournaments: state.data.tournaments,
        test_scores: state.data.test_scores
      });
      
      // Replace the loading div with new results
      loadingDiv.outerHTML = html;
      bindResultsActions();
      
      // Load additional data
      loadCertificates();
      loadUserDetails();
      loadTestScores();
      
    } catch (error) {
      console.error('Search error:', error);
      // Find current results container again in case of error
      const errorResults = crmContainer.querySelector('.empty-state') || crmContainer.querySelector('.crm-results');
      if (errorResults) {
        errorResults.innerHTML = `<div class="error-message">Error: ${error.message || 'Failed to load data'}</div>`;
      }
    } finally {
      state.isLoading = false;
    }
  }
  
  // Create search bar with handler
  const searchBar = renderSearchBar(handleSearch);
  header.appendChild(searchBar);
  
  crm.appendChild(header);
  crm.appendChild(resultsDiv);
  
  // Add modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'orderModal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Order Details</h2>
        <button class="modal-close" id="modalClose">&times;</button>
      </div>
      <div class="modal-body" id="modalBody">
        Loading...
      </div>
    </div>
  `;
  crm.appendChild(modal);
  
  const imageViewer = document.createElement('div');
imageViewer.className = 'image-viewer-modal';
imageViewer.id = 'imageViewer';
imageViewer.setAttribute('tabindex', '0'); // 👈 REQUIRED for key events

imageViewer.innerHTML = `
  <div class="image-viewer-content">
    <span class="image-viewer-close" data-image-close>&times;</span>
    <img class="image-viewer-img" src="" alt="Preview" />
  </div>
`;

crm.appendChild(imageViewer);

  // Confirmation Modal
  const confirmModal = document.createElement('div');
  confirmModal.className = 'confirm-modal';
  confirmModal.id = 'confirmModal';
  confirmModal.innerHTML = `
    <div class="confirm-modal-content">
      <div class="confirm-modal-message">Are you sure you want to send the certificate?</div>
      <div class="confirm-modal-buttons">
        <button class="confirm-btn confirm-btn-yes" id="confirmYes">Yes</button>
        <button class="confirm-btn confirm-btn-no" id="confirmNo">No</button>
      </div>
    </div>
  `;
  crm.appendChild(confirmModal);
// Image viewer close handlers (NocoBase-safe)
imageViewer.addEventListener('click', (e) => {
  // Click outside image OR on ❌
  if (
    e.target === imageViewer ||
    e.target.hasAttribute('data-image-close')
  ) {
    imageViewer.style.display = 'none';
  }
});

// ESC key close (NO document usage)
imageViewer.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    imageViewer.style.display = 'none';
  }
});

// Confirmation Modal handlers
const confirmYesBtn = confirmModal.querySelector('#confirmYes');
const confirmNoBtn = confirmModal.querySelector('#confirmNo');

confirmYesBtn.addEventListener('click', async () => {
  if (pendingSendRegId) {
    confirmModal.style.display = 'none';
    await performSendCertificate(pendingSendRegId);
    pendingSendRegId = null;
  }
});

confirmNoBtn.addEventListener('click', () => {
  confirmModal.style.display = 'none';
  pendingSendRegId = null;
});

// Close modal when clicking outside
confirmModal.addEventListener('click', function(event) {
  if (event.target === confirmModal) {
    confirmModal.style.display = 'none';
    pendingSendRegId = null;
  }
});


  // Add modal close handlers
  const modalCloseBtn = modal.querySelector('#modalClose');
  const orderModal = modal;
  modalCloseBtn.onclick = function() {
    orderModal.style.display = 'none';
  };
  
  // Close modal when clicking outside
  orderModal.addEventListener('click', function(event) {
    if (event.target === orderModal) {
      orderModal.style.display = 'none';
    }
  });
  
  ctx.element.appendChild(crm);
}
// Initialize the UI
initializeUI();