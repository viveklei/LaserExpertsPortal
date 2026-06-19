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
// Initialize Cloud Firestore database client
let db = null;
if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  db = firebase.firestore();
}

let state = {
  currentUser: null,
  apps: [], // loaded dynamically from database/localStorage
  filteredApps: [],
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
  document.querySelectorAll('.nav-user-role').forEach(el => el.textContent = user.role);

  // If login page is active, let the success animation finish first
  const mascot = $('login-mascot-container');
  const isLoginPageActive = loginPage.classList.contains('active');

  if (isLoginPageActive && mascot) {
    mascot.className = 'login-mascot-container happy-success';
    setTimeout(() => {
      // Switch pages
      loginPage.classList.remove('active');
      dashPage.classList.add('active');
      document.body.style.overflow = '';
      mascot.className = 'login-mascot-container'; // reset
    }, 1000);
  } else {
    // Switch pages immediately
    loginPage.classList.remove('active');
    dashPage.classList.add('active');
    document.body.style.overflow = '';
  }

  // Show/Hide Add Application button based on Admin role
  const addAppBtn = $('btn-add-app');
  if (addAppBtn) {
    if (user.role === 'Portal Administrator') {
      addAppBtn.classList.remove('hidden');
    } else {
      addAppBtn.classList.add('hidden');
    }
  }

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
  
  // Sign out from Firebase if configured
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.auth().signOut().catch(err => console.error("Firebase Signout Error", err));
  }

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
      const mascot = $('login-mascot-container');
      if (mascot) {
        mascot.classList.add('shake-error');
        setTimeout(() => mascot.classList.remove('shake-error'), 600);
      }
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
function loadAppsFromDatabase(callback) {
  if (!db) {
    // If Firebase is not configured, load from localStorage or fallback
    state.apps = JSON.parse(localStorage.getItem('lei_apps')) || [...APPS];
    if (callback) callback();
    return;
  }

  // Load from Firestore
  db.collection('portal').doc('applications').get()
    .then((doc) => {
      if (doc.exists && doc.data().list) {
        state.apps = doc.data().list;
        console.log("Apps loaded from Cloud Database.");
      } else {
        // If Firestore is empty, initialize it with the default APPS list
        state.apps = [...APPS];
        db.collection('portal').doc('applications').set({ list: [...APPS] })
          .then(() => console.log("Initialized database with default apps."))
          .catch(err => console.error("Error initializing database", err));
      }
      if (callback) callback();
    })
    .catch((err) => {
      console.error("Error loading apps from Firestore:", err);
      // Fallback to localStorage
      state.apps = JSON.parse(localStorage.getItem('lei_apps')) || [...APPS];
      if (callback) callback();
    });
}

function initDashboard() {
  loadAppsFromDatabase(() => {
    buildCategoryNav();
    updateStats();
    renderApps();

    // Sidebar default: collapsed on small screens, open on large
    if (window.innerWidth < 1024) {
      sidebarEl.classList.remove('open');
      mainContent.classList.add('expanded');
    }
  });
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

    // Bind Admin events
    appGrid.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openManageModal(btn.dataset.edit);
      });
    });

    appGrid.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        deleteApp(btn.dataset.delete);
      });
    });
  }

  updateStats();
}

function renderCard(app) {
  const fav = isFav(app.id);
  const statusMap = { online: '🟢 Online', offline: '⚫ Offline', maintenance: '🟡 Maintenance' };
  
  // Show management controls only if logged in as Admin
  const isAdmin = state.currentUser && state.currentUser.role === 'Portal Administrator';
  const adminControls = isAdmin ? `
    <button class="card-edit-btn" data-edit="${app.id}" title="Edit Application">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/>
      </svg>
    </button>
    <button class="card-delete-btn" data-delete="${app.id}" title="Delete Application">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
    </button>
  ` : '';

  return `
    <div class="app-card" style="--card-accent:${app.accent}" data-id="${app.id}">
      <div class="card-header">
        <div class="card-icon" style="background:${app.iconBg}">
          <span class="card-icon-text">${app.icon}</span>
        </div>
        <div class="card-actions">
          ${adminControls}
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
        <button class="card-launch-btn" data-launch="${app.id}" ${app.status === 'offline' || app.status === 'maintenance' ? 'disabled title="Application is currently offline or under maintenance"' : ''}>
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
  const isOffline = app.status === 'offline' || app.status === 'maintenance';
  const launchLink = $('modal-launch-link');
  if (isOffline) {
    launchLink.setAttribute('disabled', 'true');
    launchLink.style.pointerEvents = 'none';
    launchLink.style.opacity = '0.5';
    launchLink.style.cursor = 'not-allowed';
    launchLink.removeAttribute('href');
  } else {
    launchLink.removeAttribute('disabled');
    launchLink.style.pointerEvents = 'auto';
    launchLink.style.opacity = '1';
    launchLink.style.cursor = 'pointer';
    
    // Check if it's the Work Report App
    const isWorkReport = app.name.toLowerCase().includes('report') || 
                         app.id.toLowerCase().includes('report') ||
                         app.url.toLowerCase().includes('report');
    
    // Append SSO params if user is authenticated
    let launchUrl = isWorkReport ? './work-report/dist/' : app.url;
    if (state.currentUser && launchUrl) {
      try {
        const urlObj = new URL(launchUrl, window.location.origin);
        urlObj.searchParams.set('sso_email', state.currentUser.email);
        urlObj.searchParams.set('sso_name', state.currentUser.name);
        launchUrl = urlObj.toString();
      } catch (err) {
        console.error("Invalid app launch URL:", err);
      }
    }
    launchLink.href = launchUrl;
  }

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

$('modal-launch-link').addEventListener('click', (e) => {
  if (state.currentApp) {
    const isOffline = state.currentApp.status === 'offline' || state.currentApp.status === 'maintenance';
    if (isOffline) {
      e.preventDefault();
      return;
    }

    const isWorkReport = state.currentApp.name.toLowerCase().includes('report') || 
                         state.currentApp.id.toLowerCase().includes('report') ||
                         state.currentApp.url.toLowerCase().includes('report');

    let targetUrl = isWorkReport ? './work-report/dist/' : state.currentApp.url;

    // Determine if it should launch in the embedded portal iframe
    const isInternal = isWorkReport ||
                       targetUrl.startsWith('.') || 
                       targetUrl.startsWith('/') || 
                       targetUrl.includes(window.location.host);

    if (isInternal) {
      e.preventDefault();
      showToast(`Launching ${state.currentApp.name} inside Portal…`, 'success', '🚀');
      launchEmbeddedApp(state.currentApp.name, targetUrl);
    } else {
      showToast(`Launching ${state.currentApp.name}…`, 'success', '🚀');
      setTimeout(closeModal, 300);
    }
  }
});

// Helper to launch app in embedded iframe
function launchEmbeddedApp(name, url) {
  // Hide main pages
  loginPage.classList.remove('active');
  dashPage.classList.remove('active');

  const embeddedPage = $('embedded-app-page');
  const iframe = $('embedded-app-iframe');
  const title = $('embedded-app-title');

  title.textContent = name;

  // Append SSO parameters dynamically
  let targetUrl = url;
  if (state.currentUser && targetUrl) {
    try {
      const urlObj = new URL(targetUrl, window.location.origin);
      urlObj.searchParams.set('sso_email', state.currentUser.email);
      urlObj.searchParams.set('sso_name', state.currentUser.name);
      targetUrl = urlObj.toString();
    } catch (err) {
      console.error("SSO URL construction error:", err);
    }
  }

  iframe.src = targetUrl;
  embeddedPage.classList.add('active');
  closeModal();
}

// Back to portal listener
$('btn-back-to-portal').addEventListener('click', () => {
  $('embedded-app-page').classList.remove('active');
  $('embedded-app-iframe').src = '';
  dashPage.classList.add('active');
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
   APP MANAGEMENT (ADMIN CRUD)
   ═══════════════════════════════════════════════════ */
const manageModal = $('manage-modal');
const manageForm  = $('manage-app-form');

// Show the modal to add a new app
$('btn-add-app').addEventListener('click', () => {
  $('manage-modal-title').textContent = "Add New Application";
  manageForm.reset();
  $('manage-app-id').value = '';
  manageModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
});

// Show the modal to edit an existing app
function openManageModal(id) {
  const app = state.apps.find(a => a.id === id);
  if (!app) return;

  $('manage-modal-title').textContent = "Edit Application";
  $('manage-app-id').value = app.id;
  $('manage-name').value = app.name;
  $('manage-url').value = app.url;
  $('manage-desc').value = app.desc;
  $('manage-category').value = app.category;
  $('manage-status').value = app.status;
  $('manage-icon').value = app.icon;
  $('manage-accent').value = app.accent || '#1a56db';

  manageModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeManageModal() {
  manageModal.classList.add('hidden');
  document.body.style.overflow = '';
}

$('manage-modal-close').addEventListener('click', closeManageModal);
$('manage-modal-cancel').addEventListener('click', closeManageModal);
manageModal.addEventListener('click', e => { if (e.target === manageModal) closeManageModal(); });

// Handle form submission (Add / Edit)
manageForm.addEventListener('submit', e => {
  e.preventDefault();

  const id = $('manage-app-id').value;
  const name = $('manage-name').value.trim();
  const url = $('manage-url').value.trim();
  const desc = $('manage-desc').value.trim();
  const category = $('manage-category').value;
  const status = $('manage-status').value;
  const icon = $('manage-icon').value.trim();
  const accent = $('manage-accent').value;

  // Category visual styles (matching app registry definitions)
  const catStyles = {
    Operations: { bg: '#dbeafe', color: '#1e40af' },
    Sales:      { bg: '#d1fae5', color: '#15803d' },
    HR:         { bg: '#fce7f3', color: '#9d174d' },
    Finance:    { bg: '#d1fae5', color: '#065f46' },
    Analytics:  { bg: '#ede9fe', color: '#5b21b6' },
    Production: { bg: '#ffedd5', color: '#9a3412' },
    Support:    { bg: '#e0e7ff', color: '#3730a3' },
    Productivity: { bg: '#e0f2fe', color: '#0c4a6e' }
  };

  const style = catStyles[category] || { bg: '#f1f5f9', color: '#475569' };

  const appData = {
    id: id || 'app_' + Date.now(),
    name,
    desc,
    url,
    icon,
    iconBg: `linear-gradient(135deg, ${accent}22, ${accent}44)`,
    accent,
    category,
    catBg: style.bg,
    catColor: style.color,
    status
  };

  if (id) {
    // Edit mode
    const idx = state.apps.findIndex(a => a.id === id);
    if (idx !== -1) {
      state.apps[idx] = appData;
      showToast(`Application "${name}" updated successfully.`, 'success', '✏️');
    }
  } else {
    // Add mode
    state.apps.push(appData);
    showToast(`Application "${name}" added successfully.`, 'success', '➕');
  }

  // Save state and sync to cloud database
  syncAppsToDatabase();
  
  closeManageModal();
  buildCategoryNav(); // rebuild category filter counts
  renderApps();
});

// Helper to sync local state to Firestore
function syncAppsToDatabase() {
  // Always save to localStorage as a local backup
  localStorage.setItem('lei_apps', JSON.stringify(state.apps));

  // Sync to Cloud Firestore if enabled
  if (db) {
    db.collection('portal').doc('applications').set({ list: state.apps })
      .then(() => {
        showToast("Changes synced to database!", "success", "☁️");
      })
      .catch(err => {
        console.error("Error syncing to Firestore:", err);
        showToast("Local change saved, but sync to database failed.", "warning", "⚠️");
      });
  } else {
    showToast("Changes saved locally.", "success", "💾");
  }
}

// Delete an app
function deleteApp(id) {
  const app = state.apps.find(a => a.id === id);
  if (!app) return;

  if (confirm(`Are you sure you want to delete the application "${app.name}"?`)) {
    state.apps = state.apps.filter(a => a.id !== id);
    
    // Remove from favourites if present
    const favIdx = state.favourites.indexOf(id);
    if (favIdx !== -1) {
      state.favourites.splice(favIdx, 1);
      saveFavs();
    }

    // Save state and sync to cloud database
    syncAppsToDatabase();
    showToast(`Application "${app.name}" deleted.`, 'info', '🗑️');
    buildCategoryNav(); // rebuild category filter counts
    renderApps();
  }
}

/* ─── Firebase Auth State Observer ─── */
if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  firebase.auth().onAuthStateChanged((firebaseUser) => {
    if (firebaseUser) {
      // User is signed in via Firebase
      const user = {
        username:  firebaseUser.email,
        name:      firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email:     firebaseUser.email,
        picture:   firebaseUser.photoURL,
        role:      'Google Account',
        loginType: 'google',
      };
      doLogin(user);
    } else {
      // If user is currently marked as logged in via google in this session, log out
      const current = sessionStorage.getItem('lei_user');
      if (current) {
        try {
          const u = JSON.parse(current);
          if (u.loginType === 'google') {
            doLogout();
          }
        } catch(e) {}
      }
    }
  });
} else {
  // Fall back to local session restoration (for manual users and demo mode)
  restoreSession();
}

/* ═══════════════════════════════════════════════════
   MASCOT INTERACTION & ANIMATION
   ═══════════════════════════════════════════════════ */
function initMascotAnimation() {
  const mascotContainer = $('login-mascot-container');
  const mascotEyesGroup = $('mascot-eyes-group');
  const usernameInput = $('username');
  const passwordInput = $('password');

  if (!mascotContainer || !mascotEyesGroup || !usernameInput || !passwordInput) return;

  // Track username input focus and typing to shift eyes
  function updateEyePosition() {
    const value = usernameInput.value || '';
    const length = value.length;
    // Calculate horizontal shift based on input length (max shift of ~6px left/right)
    const maxChars = 30;
    const ratio = Math.min(length / maxChars, 1);
    const xShift = -6 + ratio * 12; // ranges from -6 to +6
    const yShift = 3; // look down slightly at the text box
    mascotEyesGroup.style.transform = `translate(${xShift}px, ${yShift}px)`;
  }

  usernameInput.addEventListener('focus', updateEyePosition);
  usernameInput.addEventListener('input', updateEyePosition);
  usernameInput.addEventListener('blur', () => {
    mascotEyesGroup.style.transform = 'translate(0px, 0px)';
  });

  // Track password focus to cover eyes
  passwordInput.addEventListener('focus', () => {
    mascotContainer.classList.add('hide-eyes');
  });
  passwordInput.addEventListener('blur', () => {
    mascotContainer.classList.remove('hide-eyes');
  });
}

// Start mascot animations
initMascotAnimation();

