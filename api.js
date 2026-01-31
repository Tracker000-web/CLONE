/* ---------- api.js ---------- */
import { State } from './state.js';
import { UI } from './ui.js';

const BASE_URL = "http://127.0.0.1:5000";
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=random&name=";

export async function authenticatedFetch(endpoint, options = {}) {
    const token = localStorage.getItem('userToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    // Automatically handle unauthorized access
    if (response.status === 401) {
        localStorage.clear(); 
        window.location.href = 'index.html';
        return;
    }

    var

    // Throw an error if the server returns a 400/500 range status
    if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
    }

    return data; // Returns the actual object (no need to call .json() again)
}

export const api = {
    async login(email, password) {
        return await authenticatedFetch('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    async checkSession() {
        // data is already the parsed JSON object here
        const data = await authenticatedFetch('/api/me');
        
        if (!data.profilePic) {
            data.profilePic = `${DEFAULT_AVATAR}${encodeURIComponent(data.username || 'User')}`;
        }
        return data;
    },

    async addUser(userData) {
        return await authenticatedFetch('/add-user', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async updateProfile(profileData) {
        return await authenticatedFetch('/api/update-profile', {
            method: 'POST',
            body: JSON.stringify(profileData),
            headers: { 'X-Role': State.currentUser?.role || 'team' }
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
                method: "POST",
                headers: { "X-Role": role },
                body: JSON.stringify({ manager_id: managerId, row, col, value })
            });

            if (!isSyncing) UI.showToast("Saved to cloud", "success");
        } catch (err) {
            if (!isSyncing) {
                State.addToSyncQueue({ managerId, row, col, value, role });
                UI.showToast("Sync queued", "error");
            }
            throw err;
        }
    }
};