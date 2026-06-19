const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

export const api = {
    async ssoLogin(email, name) {
        const response = await fetch(`${API_BASE_URL}/sso-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name })
        });
        return handleResponse(response);
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
        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async updateProfile(profileData) {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });
        return handleResponse(response);
    },

    async getReports() {
        const response = await fetch(`${API_BASE_URL}/reports`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async saveReport(reportData) {
        const response = await fetch(`${API_BASE_URL}/reports`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(reportData)
        });
        return handleResponse(response);
    },

    async getSettings() {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async updateSettings(settings) {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(settings)
        });
        return handleResponse(response);
    },

    async getDraft() {
        const response = await fetch(`${API_BASE_URL}/draft`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async saveDraft(draftData) {
        const response = await fetch(`${API_BASE_URL}/draft`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(draftData)
        });
        return handleResponse(response);
    },

    // Admin Methods
    async getAdminUsers() {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async getAllReports() {
        const response = await fetch(`${API_BASE_URL}/admin/all-reports`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async updateAdminUser(email, role) {
        const response = await fetch(`${API_BASE_URL}/admin/update-user`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email, role })
        });
        return handleResponse(response);
    }
};
