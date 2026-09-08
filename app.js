// =============================================
//  Kuwerty SCRIPTS — APP LOGIC v2
// =============================================

// ---- Admin Password (SHA-256 hash of your password) ----
// รหัสผ่าน: kuwerty1234 (หรือ zrix1234)
const ADMIN_HASHES = [
  'fd9d4b3f655915da384f7b9cd8d72775f6ee5ba4a6b2c2bc453f7612a22a6f92', // kuwerty1234
  '23a2cac65f6fa260b4d388e0168ee2aea237b8d5f752c1e4bad6350ba304e8fa'  // zrix1234
];

// ---- Storage key ----
const STORAGE_KEY = 'kuwerty_scripts_v1';

// ---- Save / Load helpers ----
function saveScripts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
  } catch(e) { console.warn('localStorage save failed', e); }
}

function loadScripts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) { console.warn('localStorage load failed', e); }
  return null;
}

// ---- State ----
const saved = loadScripts();
let scripts = saved !== null ? saved : [...SCRIPTS_DATA];
let activeFilter = 'all';
let adminMode = false;
let editingId = null;

// ---- DOM refs ----
const grid        = document.getElementById('scripts-grid');
const modal       = document.getElementById('modal-overlay');
const modalBody   = document.getElementById('modal-content');
const modalClose  = document.getElementById('modal-close');
const toast       = document.getElementById('toast');
const form        = document.getElementById('script-form');
const adminToggle = document.getElementById('admin-toggle');
const addSection  = document.getElementById('add-script');
const pwOverlay   = document.getElementById('pw-overlay');
const pwForm      = document.getElementById('pw-form');
const pwInput     = document.getElementById('pw-input');
const pwError     = document.getElementById('pw-error');
const pwEye       = document.getElementById('pw-eye');
const pwCancel    = document.getElementById('pw-cancel');

// ============================
//  YOUTUBE HELPERS
// ============================
function getYtVideoId(url) {
  if (!url) return null;
  // Already embed: youtube.com/embed/ID
  const embedMatch = url.match(/youtube\.com\/embed\/([A-Za-z0-9_\-]{11})/);
  if (embedMatch) return embedMatch[1];
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_\-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/watch?v=ID
  const longMatch = url.match(/[?&]v=([A-Za-z0-9_\-]{11})/);
  if (longMatch) return longMatch[1];
  // youtube.com/shorts/ID
  const shortsMatch = url.match(/shorts\/([A-Za-z0-9_\-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  return null;
}

function toEmbedUrl(url) {
  const id = getYtVideoId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : (url || '');
}

function getYtThumb(url) {
  const id = getYtVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

// YouTube Facade — แสดง thumbnail ก่อน โหลด iframe เมื่อคลิกเล่น
function buildYtFacade(url, titleText) {
  const id = getYtVideoId(url);
  if (!id) return '';
  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const embedSrc = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;
  return `
  <div class="yt-facade" data-embed="${escHtml(embedSrc)}" data-watch="${escHtml(watchUrl)}" style="background-image:url('${escHtml(thumb)}')">
    <button class="yt-play-btn" aria-label="เล่นวิดีโอ">
      <svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C56 0 34 0 34 0S12 0 7.5 1.7a8.5 8.5 0 0 0-6 6C0 12.1 0 24 0 24s0 11.9 1.5 16.3a8.5 8.5 0 0 0 6 6C12 48 34 48 34 48s22 0 26.5-1.7a8.5 8.5 0 0 0 6-6C68 35.9 68 24 68 24s0-11.9-1.5-16.3z" fill="#f00"/><path d="M27 34l18-10-18-10v20z" fill="#fff"/></svg>
    </button>
    <a class="yt-watch-link" href="${escHtml(watchUrl)}" target="_blank" rel="noopener">ดูบน YouTube ↗</a>
  </div>`;
}

// ============================
//  RENDER CARDS
// ============================
function renderCards() {
  const filtered = activeFilter === 'all'
    ? scripts
    : scripts.filter(s => s.tag === activeFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        ยังไม่มี script ในหมวดหมู่นี้<br />กด <strong>+ เพิ่ม Script</strong> เพื่อเพิ่มตัวแรก
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(s => buildCard(s)).join('');

  // Bind events
  grid.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      copyScript(+btn.dataset.id, btn);
    });
  });

  grid.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openModal(+btn.dataset.id);
    });
  });

  grid.querySelectorAll('.card-clickable').forEach(el => {
    el.addEventListener('click', () => openModal(+el.dataset.id));
  });

  // Admin buttons
  grid.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      startEdit(+btn.dataset.id);
    });
  });

  grid.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteScript(+btn.dataset.id);
    });
  });
}

function statusLabel(status) {
  const map = { working: '✅ Working', patched: '❌ Patched', testing: '🔄 Testing' };
  return map[status] || status;
}
function statusClass(status) { return `status-${status}`; }

function buildCard(s) {
  const embedVideo = toEmbedUrl(s.video);
  const mediaHTML = s.image
    ? `<img src="${escHtml(s.image)}" alt="${escHtml(s.name)}" loading="lazy" />`
    : `<div class="card-media-placeholder">🎮</div>`;

  const adminBtns = adminMode ? `
    <div class="admin-card-actions">
      <button class="btn-edit" data-id="${s.id}" title="แก้ไข">✏️ แก้ไข</button>
      <button class="btn-delete" data-id="${s.id}" title="ลบ">🗑️ ลบ</button>
    </div>` : '';

  return `
  <div class="script-card ${adminMode ? 'admin-active' : ''}">
    <div class="card-clickable card-media" data-id="${s.id}">
      ${mediaHTML}
      ${embedVideo ? `<div class="card-play-btn"><div class="play-icon">▶</div></div>` : ''}
    </div>
    ${adminBtns}
    <div class="card-body">
      <div class="card-top">
        <span class="card-title">${escHtml(s.name)}</span>
        <span class="card-status ${statusClass(s.status)}">${statusLabel(s.status)}</span>
      </div>
      <div class="card-game">${escHtml(s.game)}</div>
      <p class="card-desc">${escHtml(s.desc)}</p>
      <div class="card-features">
        ${s.features.slice(0, 4).map(f => `<span class="feature-tag">${escHtml(f)}</span>`).join('')}
        ${s.features.length > 4 ? `<span class="feature-tag">+${s.features.length - 4} more</span>` : ''}
      </div>
      <div class="card-footer">
        <button class="btn-copy" data-id="${s.id}">⎘ Copy Script</button>
        <button class="btn-view" data-id="${s.id}">ดูรายละเอียด</button>
      </div>
    </div>
  </div>`;
}

// ============================
//  MODAL
// ============================
function openModal(id) {
  const s = scripts.find(x => x.id === id);
  if (!s) return;

  let mediaHTML = '';
  if (s.video && getYtVideoId(s.video)) {
    // YouTube Facade — thumbnail + play button, iframe loads on click
    mediaHTML = `<div class="modal-media modal-media-yt">${buildYtFacade(s.video, s.name)}</div>`;
  } else if (s.image) {
    mediaHTML = `<div class="modal-media"><img src="${escHtml(s.image)}" alt="${escHtml(s.name)}" /></div>`;
  }

  modalBody.innerHTML = `
    ${mediaHTML}
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;">
      <h2 class="modal-title">${escHtml(s.name)}</h2>
      <span class="card-status ${statusClass(s.status)}" style="margin-top:4px;flex-shrink:0;">${statusLabel(s.status)}</span>
    </div>
    <div class="modal-game">🎮 ${escHtml(s.game)}</div>
    <p class="modal-desc">${escHtml(s.desc)}</p>

    <div class="modal-features-title">Features</div>
    <div class="card-features">
      ${s.features.map(f => `<span class="feature-tag">${escHtml(f)}</span>`).join('')}
    </div>

    <div class="modal-script-box">
      <div class="script-box-header">
        <span class="script-box-label">script.lua</span>
        <button class="script-box-copy" id="modal-copy-btn">⎘ Copy Script</button>
      </div>
      <pre class="modal-script-code" id="modal-script-pre">${escHtml(s.script)}</pre>
    </div>
    ${adminMode ? `
    <div style="margin-top:16px;display:flex;gap:8px;">
      <button onclick="closeModal();startEdit(${s.id})" class="btn-edit-modal">✏️ แก้ไข Script นี้</button>
      <button onclick="closeModal();deleteScript(${s.id})" class="btn-delete-modal">🗑️ ลบ Script นี้</button>
    </div>` : ''}`;

  document.getElementById('modal-copy-btn').addEventListener('click', () => {
    copyToClipboard(s.script);
    showToast('✓ คัดลอก Script แล้ว!');
  });

  // Bind YouTube facade click-to-play
  const facade = modalBody.querySelector('.yt-facade');
  if (facade) {
    const playBtn = facade.querySelector('.yt-play-btn');
    const doPlay = () => {
      const embedSrc = facade.dataset.embed;
      const iframe = document.createElement('iframe');
      iframe.src = embedSrc;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      facade.replaceWith(iframe);
    };
    playBtn.addEventListener('click', doPlay);
    facade.addEventListener('click', e => {
      if (!e.target.closest('a')) doPlay();
    });
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ============================
//  PASSWORD GATE
// ============================
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function openPwModal() {
  pwInput.value = '';
  pwError.textContent = '';
  pwOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => pwInput.focus(), 260);
}

function closePwModal() {
  pwOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

pwCancel.addEventListener('click', closePwModal);
pwOverlay.addEventListener('click', e => { if (e.target === pwOverlay) closePwModal(); });

// Show/hide password
pwEye.addEventListener('click', () => {
  const isText = pwInput.type === 'text';
  pwInput.type = isText ? 'password' : 'text';
  pwEye.textContent = isText ? '👁' : '🙈';
});

// Brute-force throttle
let failCount = 0;
let lockUntil = 0;

pwForm.addEventListener('submit', async e => {
  e.preventDefault();

  const now = Date.now();
  if (now < lockUntil) {
    const secs = Math.ceil((lockUntil - now) / 1000);
    pwError.textContent = `⛔ ลองใหม่ใน ${secs} วินาที`;
    return;
  }

  const entered = pwInput.value;
  const hash = await sha256(entered);

  if (ADMIN_HASHES.includes(hash)) {
    failCount = 0;
    closePwModal();
    enableAdminMode();
  } else {
    failCount++;
    pwInput.value = '';
    // Shake animation
    pwForm.querySelector('.pw-input-wrap').classList.add('shake');
    setTimeout(() => pwForm.querySelector('.pw-input-wrap').classList.remove('shake'), 500);

    if (failCount >= 5) {
      lockUntil = Date.now() + 30000; // lock 30 วินาที
      pwError.textContent = '⛔ ลองผิดเกิน 5 ครั้ง — ล็อค 30 วินาที';
    } else {
      pwError.textContent = `❌ รหัสผ่านไม่ถูกต้อง (${failCount}/5)`;
    }
    setTimeout(() => pwInput.focus(), 100);
  }
});

// ============================
//  ADMIN MODE
// ============================
adminToggle.addEventListener('click', () => {
  if (adminMode) {
    // ออก admin ไม่ต้องใส่รหัส
    disableAdminMode();
  } else {
    openPwModal();
  }
});

function enableAdminMode() {
  adminMode = true;
  adminToggle.textContent = '🔴 ออกจาก Admin';
  adminToggle.classList.add('admin-on');
  addSection.style.display = 'block';
  renderCards();
  showToast('🔧 Admin Mode เปิดแล้ว');
}

function disableAdminMode() {
  adminMode = false;
  adminToggle.textContent = '🔧 Admin Mode';
  adminToggle.classList.remove('admin-on');
  addSection.style.display = 'none';
  cancelEdit();
  renderCards();
  showToast('✓ ออกจาก Admin Mode แล้ว');
}


// ============================
//  EDIT SCRIPT
// ============================
function startEdit(id) {
  const s = scripts.find(x => x.id === id);
  if (!s) return;

  editingId = id;

  // Fill form with existing data
  document.getElementById('f-name').value    = s.name;
  document.getElementById('f-game').value    = s.game;
  document.getElementById('f-tag').value     = s.tag;
  document.getElementById('f-status').value  = s.status;
  document.getElementById('f-desc').value    = s.desc;
  document.getElementById('f-features').value = s.features.join('\n');
  document.getElementById('f-script').value  = s.script;
  document.getElementById('f-image').value   = s.image || '';
  document.getElementById('f-video').value   = s.video || '';

  // Update form UI
  document.getElementById('form-submit-btn').textContent = '💾 บันทึกการแก้ไข';
  document.getElementById('form-cancel-btn').style.display = 'block';
  document.getElementById('form-title').textContent = `✏️ แก้ไข: ${s.name}`;

  addSection.scrollIntoView({ behavior: 'smooth' });
  showToast('✏️ โหลดข้อมูลเพื่อแก้ไขแล้ว');
}

function cancelEdit() {
  editingId = null;
  form.reset();
  const btn = document.getElementById('form-submit-btn');
  if (btn) btn.textContent = '➕ เพิ่ม Script';
  const cancelBtn = document.getElementById('form-cancel-btn');
  if (cancelBtn) cancelBtn.style.display = 'none';
  const titleEl = document.getElementById('form-title');
  if (titleEl) titleEl.textContent = 'เพิ่ม Script ใหม่';
}

// ============================
//  DELETE SCRIPT
// ============================
function deleteScript(id) {
  const s = scripts.find(x => x.id === id);
  if (!s) return;

  // Simple confirm dialog
  const confirmed = confirm(`ลบ "${s.name}" จริงๆ มั้ย?`);
  if (!confirmed) return;

  scripts = scripts.filter(x => x.id !== id);
  saveScripts();
  renderCards();
  updateStats();
  showToast('🗑️ ลบ Script แล้ว');
}

// ============================
//  COPY SCRIPT
// ============================
function copyScript(id, btn) {
  const s = scripts.find(x => x.id === id);
  if (!s) return;
  copyToClipboard(s.script);
  const orig = btn.textContent;
  btn.textContent = '✓ Copied!';
  btn.style.background = '#69FF97';
  btn.style.color = '#000';
  showToast('✓ คัดลอก Script แล้ว!');
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    btn.style.color = '';
  }, 2000);
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ============================
//  TOAST
// ============================
let toastTimer;
function showToast(msg) {
  if (msg) toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.textContent = '✓ คัดลอก Script แล้ว!'; }, 400);
  }, 2200);
}

// ============================
//  FILTERS
// ============================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderCards();
  });
});

// ============================
//  ADD / EDIT SCRIPT FORM
// ============================
form.addEventListener('submit', e => {
  e.preventDefault();

  const name    = document.getElementById('f-name').value.trim();
  const game    = document.getElementById('f-game').value.trim();
  const tag     = document.getElementById('f-tag').value;
  const status  = document.getElementById('f-status').value;
  const desc    = document.getElementById('f-desc').value.trim();
  const rawFeat = document.getElementById('f-features').value.trim();
  const script  = document.getElementById('f-script').value.trim();
  const image   = document.getElementById('f-image').value.trim();
  const video   = document.getElementById('f-video').value.trim();
  const features = rawFeat ? rawFeat.split('\n').map(l => l.trim()).filter(Boolean) : [];

  if (editingId !== null) {
    // --- UPDATE ---
    const idx = scripts.findIndex(x => x.id === editingId);
    if (idx !== -1) {
      scripts[idx] = { ...scripts[idx], name, game, tag, status, desc, features, script, image, video };
    }
    cancelEdit();
    showToast('💾 บันทึกการแก้ไขแล้ว!');
  } else {
    // --- CREATE ---
    const newScript = { id: Date.now(), name, game, tag, status, desc, features, script, image, video };
    scripts.unshift(newScript);
    form.reset();
    showToast('✓ เพิ่ม Script เรียบร้อย!');
  }

  saveScripts(); // 💾 บันทึกลง localStorage

  activeFilter = 'all';
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === 'all');
  });

  renderCards();
  updateStats();
  document.getElementById('scripts').scrollIntoView({ behavior: 'smooth' });
});

// Cancel edit button
document.getElementById('form-cancel-btn')?.addEventListener('click', () => {
  cancelEdit();
  showToast('ยกเลิกการแก้ไขแล้ว');
});

// ============================
//  HERO STATS COUNTER
// ============================
function updateStats() {
  const games = new Set(scripts.map(s => s.game)).size;
  animateNum('stat-scripts', scripts.length);
  animateNum('stat-games', games);
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  const start = +el.textContent.replace(/\D/g, '') || 0;
  const steps = 30;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(start + (target - start) * (step / steps));
    if (step >= steps) clearInterval(timer);
  }, 20);
}

// ============================
//  UTIL
// ============================
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================
//  RESET TO DEFAULTS (Admin only)
// ============================
function resetToDefaults() {
  const ok = confirm('⚠️ ล้างข้อมูลทั้งหมดแล้วกลับไปใช้ Default scripts มั้ย?\nการกระทำนี้ไม่สามารถยกเลิกได้');
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  scripts = [...SCRIPTS_DATA];
  saveScripts();
  renderCards();
  updateStats();
  showToast('🔄 รีเซ็ตเป็นค่าตั้งต้นแล้ว');
}

document.getElementById('reset-defaults-btn')?.addEventListener('click', resetToDefaults);

// ============================
//  INIT
// ============================
addSection.style.display = 'none';
renderCards();
updateStats();
