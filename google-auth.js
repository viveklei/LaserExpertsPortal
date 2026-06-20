/**
 * google-auth.js — Google Sign-In Integration
 * Uses Google Identity Services (GIS) — completely FREE
 *
 * ─────────────────────────────────────────────────────────
 *  SETUP (takes ~5 minutes, one-time):
 *
 *  1. Go to: https://console.cloud.google.com/
 *  2. Create a new project (or select existing)
 *  3. Navigate to: APIs & Services → Credentials
 *  4. Click "Create Credentials" → "OAuth 2.0 Client ID"
 *  5. Application type: "Web application"
 *  6. Name: "Laser Experts Portal"
 *  7. Authorized JavaScript origins — add:
 *       • http://localhost         (for local testing)
 *       • http://localhost:3000    (if using dev server)
 *       • https://yourdomain.com   (your production domain)
 *  8. Click "Create" → copy the Client ID
 *  9. Paste it below where it says YOUR_GOOGLE_CLIENT_ID
 * ─────────────────────────────────────────────────────────
 */

const GOOGLE_CLIENT_ID = '1014113880303-fco3csrmb627vc5d7rq76emmd71rjteq.apps.googleusercontent.com';  // ← Paste your Client ID here

/* ─── Internal state ─────────────────────────────────── */
const _goog = {
  configured: GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID' && GOOGLE_CLIENT_ID.trim() !== '',
};

/* ─── Decode a JWT without a library ────────────────── */
function _decodeJWT(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch (e) {
    console.error('JWT decode failed', e);
    return null;
  }
}

/* ─── Called by Google GSI SDK after user consents ───── */
window.handleGoogleCredentialResponse = function (response) {
  const payload = _decodeJWT(response.credential);
  if (!payload || !payload.email) {
    showGoogleError('Google sign-in failed. Invalid payload.');
    return;
  }

  const emailLower = payload.email.toLowerCase();
  const admins = ['admin@lei.com', 'admin@laserexperts.in', 'pd@laserxprts.com'];
  const managers = ['marketing01@laserxprts.com', 'harisha.prabakaran@laserxprts.com', 'operations@laserxprts.com'];
  const role = (admins.includes(emailLower) || emailLower.startsWith('admin@') || emailLower.includes('admin')) ? 'Portal Administrator' :
               (managers.includes(emailLower) || emailLower.includes('manager')) ? 'Operations Manager' : 'Staff';

  const user = {
    username: payload.email,
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
    role: role,
    loginType: 'google',
  };

  const backendSsoUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5003/api/sso-login' 
    : window.location.origin + '/work-report/api/sso-login';

  const syncPromise = fetch(backendSsoUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email, name: payload.name, photo: payload.picture })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Registered/synced Google user with VPS SQLite database successfully:", data);
    if (data && data.token && data.user) {
      localStorage.setItem('work_report_token', data.token);
      localStorage.removeItem('sso_mode');
      
      user.name = data.user.name || user.name;
      user.picture = data.user.photo || user.picture;
      user.role = (data.user.role === 'admin' || data.user.email === 'admin@lei.com') ? 'Portal Administrator' :
                  (data.user.role === 'manager') ? 'Operations Manager' : 'Staff';
    }
    return user;
  })
  .catch(err => {
    console.warn("Could not sync Google user profile with VPS SQLite database:", err.message);
    return user;
  });

  // If Firebase config is not fully set up yet, fall back to simple login
  if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0 || firebaseConfig.apiKey === "YOUR_API_KEY") {
    syncPromise.then(finalUser => {
      doLogin(finalUser);
      showToast(`Welcome, ${finalUser.name}! (${finalUser.role})`, 'success', '🎉');
    });
    return;
  }

  // Firebase auth flow
  const credential = firebase.auth.GoogleAuthProvider.credential(response.credential);

  // Show a loading/signing in toast
  showToast("Authenticating with Firebase...", "info", "🔒");

  firebase.auth().signInWithCredential(credential)
    .catch((error) => {
      console.error("Firebase Sign-In Error", error);
      showGoogleError('Sign-in failed: ' + error.message);
    });
};

/* ─── Show an error on the login card ───────────────── */
function showGoogleError(msg) {
  const errEl = document.getElementById('login-error');
  const errMsg = document.getElementById('login-error-msg');
  if (errEl && errMsg) {
    errMsg.textContent = msg;
    errEl.classList.remove('hidden');
  }
}

/* ─── Fallback custom button click ──────────────────── */
function _handleCustomButtonClick() {
  if (!_goog.configured) {
    _showSetupNotice();
    return;
  }
  // Programmatically trigger the Google sign-in popup
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.prompt();
  }
}

/* ─── Show notice when Client ID not yet configured ─── */
function _showSetupNotice() {
  let notice = document.getElementById('google-setup-notice');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'google-setup-notice';
    notice.className = 'setup-notice';
    notice.innerHTML = `
      <span class="setup-notice-icon">⚙️</span>
      <span>
        Google Sign-In needs a <strong>Client ID</strong>.
        Open <code>google-auth.js</code> and set <code>GOOGLE_CLIENT_ID</code>.
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">
          Get it free →
        </a>
      </span>`;
    const wrap = document.querySelector('.google-signin-wrap');
    if (wrap) wrap.after(notice);
  }
  notice.classList.remove('hidden');
}

/* ─── Initialise once the page and GSI library load ─── */
function _initGoogleSignIn() {
  const wrap = document.querySelector('.google-signin-wrap');
  const customBtn = document.getElementById('btn-google-custom');

  if (!_goog.configured) {
    // Client ID not set — show friendly fallback button + notice
    if (customBtn) {
      customBtn.addEventListener('click', _handleCustomButtonClick);
    }
    return;
  }

  // Client ID is set — let GSI SDK take over
  if (!window.google || !google.accounts || !google.accounts.id) {
    // SDK not loaded yet (async), retry in 500 ms
    setTimeout(_initGoogleSignIn, 500);
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: window.handleGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  // Render the official Google button inside our container
  const container = document.getElementById('google-btn-container');
  if (container) {
    google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 340,
    });

    // Hide our custom button when SDK button is rendered
    if (wrap) wrap.classList.add('sdk-ready');
  }
}

/* ─── End of Google Sign-In script ─── */

/* ─── Boot ─────────────────────────────────────────── */
// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initGoogleSignIn);
} else {
  // GSI script loads async, give it a moment
  setTimeout(_initGoogleSignIn, 100);
}
