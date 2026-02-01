/* ---------- api.js ---------- */
import { State } from './state.js';
import { UI } from './ui.js';

const BASE_URL = "http://127.0.0.1:5000";
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=random&name=";

/**
 * Centralized authenticated fetch
 */
export async function authenticatedFetch(endpoint, options = {}) {
    const token = localStorage.getItem('userToken');

    const url = endpoint.startsWith('http')
        ? endpoint
        : `${BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers
        });
    } catch (networkError) {
        // Server is down / unreachable
        throw new Error("Cannot reach server. Is the backend running?");
    }

    // Handle unauthorized globally
    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'index.html';
        return new Promise(() => {});
    }

    // Detect non-JSON responses (e.g., HTML error pages)
    const contentType = response.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new Error(
            `Server returned non-JSON response (status ${response.status})`
        );
    }

    if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
}

/**
 * API wrapper
 */
export const api = {

    async login(email, password) {
        return authenticatedFetch('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async checkSession() {
        const data = await authenticatedFetch('/api/me');

        if (!data.profilePic) {
            data.profilePic = `${DEFAULT_AVATAR}${encodeURIComponent(
                data.username || 'User'
            )}`;
        }

        return data;
    },

    async addUser(userData) {
        return authenticatedFetch('/add-user', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async updateProfile(profileData) {
        return authenticatedFetch('/api/update-profile', {
            method: 'POST',
            body: JSON.stringify(profileData),
            headers: {
                'X-Role': State.currentUser?.role || 'team'
            }
        });
    },

    async saveCell(managerId, row, col, value, role, isSyncing = false) {
        if (!navigator.onLine && !isSyncing) {
            State.addToSyncQueue({ managerId, row, col, value, role });
            UI.showToast("Offline: Change queued", "info");
            return;
        }

        try {
            await authenticatedFetch('/api/save-cell', {
                method: 'POST',
                headers: { 'X-Role': role },
                body: JSON.stringify({
                    manager_id: managerId,
                    row,
                    col,
                    value
                })
            });

            if (!isSyncing) {
                UI.showToast("Saved to cloud", "success");
            }

        } catch (err) {
            if (!isSyncing) {
                State.addToSyncQueue({ managerId, row, col, value, role });
                UI.showToast("Sync queued", "error");
            }
            throw err;
        }
    }
};
