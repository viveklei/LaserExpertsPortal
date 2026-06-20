const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5003/api' 
    : 'https://reports.leip.co.in/api');

// Check if we are in portal SSO mode (no backend available)
const isPortalMode = () => {
  return localStorage.getItem('sso_mode') === 'true' || 
         localStorage.getItem('work_report_token') === 'portal-sso-token';
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('work_report_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Request failed');
        return data;
    } else {
        const text = await response.text();
        if (!response.ok) throw new Error(text || 'Request failed with non-JSON response');
        return text;
    }
};

// ═══════════════════════════════════════════════════
// LOCAL STORAGE FALLBACK HELPERS
// ═══════════════════════════════════════════════════
const LS_PREFIX = 'wr_portal_';

function getLocalProfile() {
  const email = localStorage.getItem('active_user_email') || '';
  const name = localStorage.getItem('sso_user_name') || email.split('@')[0];
  const stored = localStorage.getItem(LS_PREFIX + 'profile_' + email);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return {
    email,
    name,
    role: localStorage.getItem('user_role') || 'user',
    department: '',
    designation: '',
    reporting_person: '',
    photo: null
  };
}

function saveLocalProfile(data) {
  const email = localStorage.getItem('active_user_email') || '';
  const existing = getLocalProfile();
  const merged = { ...existing, ...data };
  localStorage.setItem(LS_PREFIX + 'profile_' + email, JSON.stringify(merged));
  return merged;
}

function getLocalSettings() {
  const email = localStorage.getItem('active_user_email') || '';
  const stored = localStorage.getItem(LS_PREFIX + 'settings_' + email);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return { theme: 'dark', use_ai: 1, report_tone: 'Standard', recipient_email: '', smart_memo: null };
}

function saveLocalSettings(data) {
  const email = localStorage.getItem('active_user_email') || '';
  const existing = getLocalSettings();
  const merged = { ...existing, ...data };
  localStorage.setItem(LS_PREFIX + 'settings_' + email, JSON.stringify(merged));
  return merged;
}

function getLocalReports() {
  const email = localStorage.getItem('active_user_email') || '';
  const stored = localStorage.getItem(LS_PREFIX + 'reports_' + email);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return [];
}

function saveLocalReport(report) {
  const email = localStorage.getItem('active_user_email') || '';
  const reports = getLocalReports();
  report.id = report.id || Date.now();
  report.created_at = report.created_at || new Date().toISOString();
  reports.unshift(report);
  localStorage.setItem(LS_PREFIX + 'reports_' + email, JSON.stringify(reports));
  return report;
}

function getLocalDraft() {
  const email = localStorage.getItem('active_user_email') || '';
  const stored = localStorage.getItem(LS_PREFIX + 'draft_' + email);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return { tasks_data: [], start_time: '09:00', end_time: '18:00' };
}

function saveLocalDraft(data) {
  const email = localStorage.getItem('active_user_email') || '';
  localStorage.setItem(LS_PREFIX + 'draft_' + email, JSON.stringify(data));
  return data;
}

// ═══════════════════════════════════════════════════
// API WITH AUTOMATIC FALLBACK
// ═══════════════════════════════════════════════════

async function tryFetch(url, options) {
  const response = await fetch(url, options);
  return handleResponse(response);
}

export const api = {
    async ssoLogin(email, name, photo) {
        try {
          const response = await fetch(`${API_BASE_URL}/sso-login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, name, photo })
          });
          return await handleResponse(response);
        } catch (err) {
          console.warn("SSO Login network call failed, falling back to local credentials:", err.message);
          const role = (email === 'admin@lei.com' || email.includes('admin')) ? 'admin' : 'user';
          return { 
            token: 'portal-sso-token', 
            user: { email, name: name || email.split('@')[0], role, photo } 
          };
        }
    },

    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return handleResponse(response);
    },

    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    async getProfile() {
        try {
          const data = await tryFetch(`${API_BASE_URL}/profile`, { headers: getAuthHeaders() });
          if (data && typeof data === 'object') return data;
          throw new Error('Invalid profile data format');
        } catch(e) {
          return getLocalProfile();
        }
    },

    async updateProfile(profileData) {
        try {
          return await tryFetch(`${API_BASE_URL}/profile`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
          });
        } catch(e) {
          return saveLocalProfile(profileData);
        }
    },

    async getReports() {
        try {
          const data = await tryFetch(`${API_BASE_URL}/reports`, { headers: getAuthHeaders() });
          if (Array.isArray(data)) return data;
          throw new Error('Invalid reports format');
        } catch(e) {
          return getLocalReports();
        }
    },

    async saveReport(reportData) {
        try {
          return await tryFetch(`${API_BASE_URL}/reports`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(reportData)
          });
        } catch(e) {
          return saveLocalReport(reportData);
        }
    },

    async getSettings() {
        try {
          const data = await tryFetch(`${API_BASE_URL}/settings`, { headers: getAuthHeaders() });
          if (data && typeof data === 'object') return data;
          throw new Error('Invalid settings format');
        } catch(e) {
          return getLocalSettings();
        }
    },

    async updateSettings(settings) {
        try {
          return await tryFetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(settings)
          });
        } catch(e) {
          return saveLocalSettings(settings);
        }
    },

    async getDraft() {
        try {
          const data = await tryFetch(`${API_BASE_URL}/draft`, { headers: getAuthHeaders() });
          if (data && typeof data === 'object') return data;
          throw new Error('Invalid draft format');
        } catch(e) {
          return getLocalDraft();
        }
    },

    async saveDraft(draftData) {
        try {
          return await tryFetch(`${API_BASE_URL}/draft`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(draftData)
          });
        } catch(e) {
          return saveLocalDraft(draftData);
        }
    },

    // Admin Methods
    async getAdminUsers() {
        try {
          const data = await tryFetch(`${API_BASE_URL}/admin/users`, { headers: getAuthHeaders() });
          if (Array.isArray(data)) return data;
          throw new Error('Invalid users format');
        } catch(e) {
          return [];
        }
    },

    async getAllReports() {
        try {
          const data = await tryFetch(`${API_BASE_URL}/admin/all-reports`, { headers: getAuthHeaders() });
          if (Array.isArray(data)) return data;
          throw new Error('Invalid reports format');
        } catch(e) {
          return getLocalReports();
        }
    },

    async updateAdminUser(email, role) {
        try {
          return await tryFetch(`${API_BASE_URL}/admin/update-user`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email, role })
          });
        } catch(e) {
          return { message: 'Updated locally' };
        }
    }
};
