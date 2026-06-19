/**
 * main.js — Laser Experts India Portal Logic
 * Handles: login, app rendering, search, filter, favourites, modal, toasts
 */

/* ═══════════════════════════════════════════════════
   DEMO USERS — Replace with real auth in production
   ═══════════════════════════════════════════════════ */
const USERS = [
  { username: "admin",    password: "admin123",  name: "Admin",      email: "admin@laserexperts.in",   role: "Portal Administrator" },
  { username: "manager",  password: "manager123",name: "Manager",    email: "manager@laserexperts.in", role: "Operations Manager" },
  { username: "user",     password: "user123",   name: "User",       email: "user@laserexperts.in",    role: "Staff" },
];

/* ═══════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════ */
let state = {
  currentUser: null,
  apps: [...APPS],
  filteredApps: [...APPS],
  favourites: JSON.parse(localStorage.getItem('lei_favs') || '[]'),
  activeFilter: 'all',
  searchQuery: '',
  sortBy: 'name',
  viewMode: 'grid', // 'grid' | 'list'
  currentApp: null,
};

/* ═══════════════════════════════════════════════════
   DOM REFERENCES
   ═══════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const loginPage    = $('login-page');
const dashPage     = $('dashboard-page');
const loginForm    = $('login-form');
const loginError   = $('login-error');
const loginErrMsg  = $('login-error-msg');
const loginBtn     = $('login-btn');
const togglePwd    = $('toggle-pwd');
const pwdInput     = $('password');
const appSearch    = $('app-search');
const appGrid      = $('app-grid');
const noResults    = $('no-results');
const sortSelect   = $('sort-select');
const gridViewBtn  = $('grid-view-btn');
const listViewBtn  = $('list-view-btn');
const sidebarEl    = $('main-sidebar');
const mainContent  = $('main-content');
const launchModal  = $('launch-modal');
const modalClose   = $('modal-close');
const modalCancel  = $('modal-cancel');
const userMenuTrig = $('user-menu-trigger');
const userDropdown = $('user-dropdown');
const logoutBtn    = $('logout-btn');
const sidebarToggle= $('sidebar-toggle');
const categoryNav  = $('category-nav');
const toastCont    = $('toast-container');

/* ═══════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════ */
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function saveFavs() {
  localStorage.setItem('lei_favs', JSON.stringify(state.favourites));
}

function isFav(id) { return state.favourites.includes(id); }

function showToast(msg, type = 'info', icon = 'ℹ️') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${msg}</span>`;
  toastCont.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setLoginLoading(loading) {
  const btnText = loginBtn.querySelector('.btn-text');
  const btnLoader = loginBtn.querySelector('.btn-loader');
  const btnArrow = loginBtn.querySelector('.btn-arrow');
  loginBtn.disabled = loading;
  btnText.classList.toggle('hidden', loading);
  btnLoader.classList.toggle('hidden', !loading);
  btnArrow.classList.toggle('hidden', loading);
}

/* ═══════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════ */
function tryLogin(username, password) {
  return USERS.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  ) || null;
}

function doLogin(user) {
  state.currentUser = user;
  sessionStorage.setItem('lei_user', JSON.stringify(user));

  // Update UI with user info
  const initials = getInitials(user.name);

  // Nav avatar — show photo if Google user, else initials
  const navAvatar = $('user-avatar-initials');
  if (user.picture) {
    navAvatar.innerHTML = `<img src="${user.picture}" alt="${user.name}" />`;
    navAvatar.classList.add('has-photo');
  } else {
    navAvatar.textContent = initials;
    navAvatar.classList.remove('has-photo');
  }

  // Dropdown avatar
  const dropAvatar = $('dropdown-avatar-initials');
  if (user.picture) {
    dropAvatar.innerHTML = `<img src="${user.picture}" alt="${user.name}" />`;
    dropAvatar.classList.add('has-photo');
  } else {
    dropAvatar.textContent = initials;
    dropAvatar.classList.remove('has-photo');
  }

  $('nav-display-name').textContent         = user.name;
  $('dropdown-display-name').textContent    = user.name;
  $('dropdown-email').textContent           = user.email;

  // Switch pages
  loginPage.classList.remove('active');
  dashPage.classList.add('active');
  document.body.style.overflow = '';

  // Init dashboard
  initDashboard();
}

function doLogout() {
  state.currentUser = null;
  sessionStorage.removeItem('lei_user');
  dashPage.classList.remove('active');
  loginPage.classList.add('active');
  loginForm.reset();
  loginError.classList.add('hidden');
  showToast('You have been signed out.', 'info', '👋');
}

// Restore session
function restoreSession() {
  const saved = sessionStorage.getItem('lei_user');
  if (saved) {
    try { doLogin(JSON.parse(saved)); return; } catch(e) {}
  }
}

/* ═══════════════════════════════════════════════════
   LOGIN FORM
   ═══════════════════════════════════════════════════ */
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  loginError.classList.add('hidden');

  const username = $('username').value.trim();
  const password = $('password').value;

  if (!username || !password) {
    loginErrMsg.textContent = 'Please fill in all fields.';
    loginError.classList.remove('hidden');
    return;
  }

  setLoginLoading(true);

  // Simulate async auth (replace with real API call)
  setTimeout(() => {
    const user = tryLogin(username, password);
    setLoginLoading(false);
    if (user) {
      doLogin(user);
    } else {
      loginErrMsg.textContent = 'Invalid username or password. Please try again.';
      loginError.classList.remove('hidden');
      pwdInput.value = '';
      pwdInput.focus();
    }
  }, 800);
});

// Password visibility toggle
togglePwd.addEventListener('click', () => {
  const isText = pwdInput.type === 'text';
  pwdInput.type = isText ? 'password' : 'text';
  togglePwd.querySelector('.eye-icon').style.opacity = isText ? '1' : '0.4';
});

/* ═══════════════════════════════════════════════════
   DASHBOARD INIT
   ═══════════════════════════════════════════════════ */
function initDashboard() {
  buildCategoryNav();
  updateStats();
  renderApps();

  // Sidebar default: collapsed on small screens, open on large
  if (window.innerWidth < 1024) {
    sidebarEl.classList.remove('open');
    mainContent.classList.add('expanded');
  }
}

/* ═══════════════════════════════════════════════════
   CATEGORY NAV
   ═══════════════════════════════════════════════════ */
function buildCategoryNav() {
  const categories = [...new Set(state.apps.map(a => a.category))].sort();
  const catEmojis = {
    Operations: '⚙️', Sales: '💼', HR: '👥', Finance: '💰',
    Analytics: '📊', Production: '🏭', Support: '🎫',
    Productivity: '🚀', Quality: '✅'
  };

  categoryNav.innerHTML = categories.map(cat => {
    const count = state.apps.filter(a => a.category === cat).length;
    const emoji = catEmojis[cat] || '📁';
    return `
      <a href="#" class="sidebar-link" data-filter="cat:${cat}" title="${cat}">
        <span style="font-size:1rem;line-height:1">${emoji}</span>
        ${cat}
        <span class="sidebar-badge" style="margin-left:auto">${count}</span>
      </a>`;
  }).join('');

  // Re-bind category links
  categoryNav.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', handleFilterClick);
  });
}

/* ═══════════════════════════════════════════════════
   STATS BAR
   ═══════════════════════════════════════════════════ */
function updateStats() {
  const online = state.apps.filter(a => a.status === 'online').length;
  const cats   = [...new Set(state.apps.map(a => a.category))].length;
  $('stat-total').textContent      = state.apps.length;
  $('stat-online').textContent     = online;
  $('stat-categories').textContent = cats;
  $('stat-favs').textContent       = state.favourites.length;
  $('all-count').textContent       = state.apps.length;
  $('fav-count').textContent       = state.favourites.length;
}

/* ═══════════════════════════════════════════════════
   FILTER & SORT
   ═══════════════════════════════════════════════════ */
function applyFilter() {
  let apps = [...state.apps];
  const q = state.searchQuery.toLowerCase();

  // Filter
  if (state.activeFilter === 'favourites') {
    apps = apps.filter(a => isFav(a.id));
  } else if (state.activeFilter.startsWith('cat:')) {
    const cat = state.activeFilter.slice(4);
    apps = apps.filter(a => a.category === cat);
  }

  // Search
  if (q) {
    apps = apps.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }

  // Sort
  if (state.sortBy === 'name') {
    apps.sort((a, b) => a.name.localeCompare(b.name));
  } else if (state.sortBy === 'category') {
    apps.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }
  // 'recent' keeps original APPS order

  state.filteredApps = apps;
}

/* ═══════════════════════════════════════════════════
   RENDER APPS
   ═══════════════════════════════════════════════════ */
function renderApps() {
  applyFilter();

  if (state.filteredApps.length === 0) {
    appGrid.innerHTML = '';
    noResults.classList.remove('hidden');
  } else {
    noResults.classList.add('hidden');
    appGrid.innerHTML = state.filteredApps.map(renderCard).join('');

    // Bind card events
    appGrid.querySelectorAll('[data-launch]').forEach(btn => {
      btn.addEventListener('click', () => openModal(btn.dataset.launch));
    });

    appGrid.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleFav(btn.dataset.fav, btn);
      });
    });
  }

  updateStats();
}

function renderCard(app) {
  const fav = isFav(app.id);
  const statusMap = { online: '🟢 Online', offline: '⚫ Offline', maintenance: '🟡 Maintenance' };

  return `
    <div class="app-card" style="--card-accent:${app.accent}" data-id="${app.id}">
      <div class="card-header">
        <div class="card-icon" style="background:${app.iconBg}">
          <span class="card-icon-text">${app.icon}</span>
        </div>
        <div class="card-actions">
          <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${app.id}" aria-label="Toggle favourite">
            <svg viewBox="0 0 24 24" fill="${fav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
          <span class="card-status-dot ${app.status}" title="${statusMap[app.status]}"></span>
        </div>
      </div>

      <div class="card-body">
        <div class="card-name">${app.name}</div>
        <div class="card-desc">${app.desc}</div>
      </div>

      <div class="card-footer">
        <span class="card-category" style="background:${app.catBg};color:${app.catColor}">${app.category}</span>
        <button class="card-launch-btn" data-launch="${app.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Launch
        </button>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════
   FAVOURITES
   ═══════════════════════════════════════════════════ */
function toggleFav(id, btn) {
  const idx = state.favourites.indexOf(id);
  const app = state.apps.find(a => a.id === id);

  if (idx === -1) {
    state.favourites.push(id);
    btn.classList.add('active');
    btn.querySelector('svg').setAttribute('fill', 'currentColor');
    showToast(`${app.name} added to favourites`, 'success', '⭐');
  } else {
    state.favourites.splice(idx, 1);
    btn.classList.remove('active');
    btn.querySelector('svg').setAttribute('fill', 'none');
    showToast(`${app.name} removed from favourites`, 'info', '🗑️');
  }

  saveFavs();
  updateStats();

  // Re-render if viewing favourites
  if (state.activeFilter === 'favourites') renderApps();
}

/* ═══════════════════════════════════════════════════
   LAUNCH MODAL
   ═══════════════════════════════════════════════════ */
function openModal(id) {
  const app = state.apps.find(a => a.id === id);
  if (!app) return;
  state.currentApp = app;

  const statusText = { online: '🟢 Online', offline: '⚫ Offline', maintenance: '🟡 Maintenance' };

  $('modal-app-icon').style.background = app.iconBg;
  $('modal-app-icon').textContent       = app.icon;
  $('modal-app-icon').style.fontSize    = '2rem';
  $('modal-app-name').textContent       = app.name;
  $('modal-app-desc').textContent       = app.desc;
  $('modal-app-url').textContent        = app.url;
  $('modal-app-category').textContent   = app.category;
  $('modal-app-category').style.background = app.catBg;
  $('modal-app-category').style.color      = app.catColor;
  $('modal-app-status').textContent     = statusText[app.status] || app.status;
  $('modal-launch-link').href           = app.url;

  launchModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  launchModal.classList.add('hidden');
  document.body.style.overflow = '';
  state.currentApp = null;
}

modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
launchModal.addEventListener('click', e => { if (e.target === launchModal) closeModal(); });

$('modal-launch-link').addEventListener('click', () => {
  if (state.currentApp) {
    showToast(`Launching ${state.currentApp.name}…`, 'success', '🚀');
    setTimeout(closeModal, 300);
  }
});

/* ═══════════════════════════════════════════════════
   SEARCH
   ═══════════════════════════════════════════════════ */
let searchDebounce;
appSearch.addEventListener('input', e => {
  clearTimeout(searchDebounce);
  state.searchQuery = e.target.value.trim();
  searchDebounce = setTimeout(renderApps, 200);
});

// Ctrl+K focus search
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    appSearch.focus();
    appSearch.select();
  }
  if (e.key === 'Escape') closeModal();
});

/* ═══════════════════════════════════════════════════
   SORT
   ═══════════════════════════════════════════════════ */
sortSelect.addEventListener('change', e => {
  state.sortBy = e.target.value;
  renderApps();
});

/* ═══════════════════════════════════════════════════
   VIEW TOGGLE
   ═══════════════════════════════════════════════════ */
gridViewBtn.addEventListener('click', () => {
  state.viewMode = 'grid';
  appGrid.classList.remove('list-mode');
  gridViewBtn.classList.add('active');
  listViewBtn.classList.remove('active');
});

listViewBtn.addEventListener('click', () => {
  state.viewMode = 'list';
  appGrid.classList.add('list-mode');
  listViewBtn.classList.add('active');
  gridViewBtn.classList.remove('active');
});

/* ═══════════════════════════════════════════════════
   SIDEBAR FILTERS
   ═══════════════════════════════════════════════════ */
function handleFilterClick(e) {
  e.preventDefault();
  const filter = e.currentTarget.dataset.filter;
  state.activeFilter = filter;
  state.searchQuery = '';
  appSearch.value = '';

  // Update active state
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  e.currentTarget.classList.add('active');

  // Update header title
  const titles = {
    all:        ['All Applications', 'Select an application to launch'],
    favourites: ['Favourites', 'Your starred applications'],
    recent:     ['Recently Used', 'Apps you opened recently'],
  };

  if (filter.startsWith('cat:')) {
    const cat = filter.slice(4);
    $('section-title').textContent    = cat;
    $('section-subtitle').textContent = `${cat} applications`;
  } else if (titles[filter]) {
    $('section-title').textContent    = titles[filter][0];
    $('section-subtitle').textContent = titles[filter][1];
  }

  renderApps();

  // Close sidebar on mobile
  if (window.innerWidth < 1024) {
    sidebarEl.classList.remove('open');
  }
}

// Top-level filter links
document.querySelectorAll('.sidebar-nav a[data-filter]').forEach(link => {
  link.addEventListener('click', handleFilterClick);
});

/* ═══════════════════════════════════════════════════
   SIDEBAR TOGGLE
   ═══════════════════════════════════════════════════ */
sidebarToggle.addEventListener('click', () => {
  if (window.innerWidth < 1024) {
    sidebarEl.classList.toggle('open');
  } else {
    sidebarEl.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
  }
});

/* ═══════════════════════════════════════════════════
   USER DROPDOWN
   ═══════════════════════════════════════════════════ */
userMenuTrig.addEventListener('click', e => {
  e.stopPropagation();
  const isOpen = userDropdown.classList.contains('open');
  userDropdown.classList.toggle('open', !isOpen);
  userMenuTrig.classList.toggle('open', !isOpen);
});

document.addEventListener('click', () => {
  userDropdown.classList.remove('open');
  userMenuTrig.classList.remove('open');
});

userDropdown.addEventListener('click', e => e.stopPropagation());

logoutBtn.addEventListener('click', e => {
  e.preventDefault();
  doLogout();
});

/* ═══════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════ */
restoreSession();
