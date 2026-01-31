/* ---------- api.js ---------- */
import { State } from './state.js';
import { UI } from './ui.js';

const BASE_URL = "http://127.0.0.1:5000";
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=random&name=";

// This helper handles the token for you
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

    if (response.status === 401) {
        // Optional: Auto-logout if token is expired/invalid
        localStorage.removeItem('userToken');
        window.location.href = 'index.html';
    }

    return response.json();
}


export const api = {
    async checkSession() {
        const res = await authenticatedFetch('/api/me');
        if (!res.ok) throw new Error("Not logged in");
        
        const data = await res.json();
        // If no profile pic exists, generate a default based on name
        if (!data.profilePic) {
            data.profilePic = `${DEFAULT_AVATAR}${encodeURIComponent(data.username || 'User')}`;
        }
        return data;
    },

    async addUser(userData) {
        return await fetch(`${BASE_URL}/add-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
    },

    async updateProfile(profileData) {
        const res = await fetch(`${BASE_URL}/api/update-profile`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Role': State.currentUser?.role || 'team'
            },
            body: JSON.stringify(profileData)
        });
        if (!res.ok) throw new Error("Failed to update profile");
        return await res.json();
    },

    async saveCell(managerId, row, col, value, role, isSyncing = false) {
        if (!navigator.onLine && !isSyncing) {
            State.addToSyncQueue({ managerId, row, col, value, role });
            UI.showToast("Offline: Change queued for sync", "info");
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/api/save-cell`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "X-Role": role 
                },
                body: JSON.stringify({ manager_id: managerId, row, col, value })
            });

            if (!res.ok) throw new Error("Server rejected save");
            if (!isSyncing) UI.showToast("Saved to cloud", "success");
        } catch (err) {
            if (!isSyncing) {
                State.addToSyncQueue({ managerId, row, col, value, role });
                UI.showToast("Server error: Queued for later", "error");
            }
            throw err;
        }
    },

    async processSyncQueue() {
        if (State.syncQueue.length === 0 || !navigator.onLine) return;

        const queue = [...State.syncQueue];
        for (const item of queue) {
            try {
                await this.saveCell(item.managerId, item.row, item.col, item.value, item.role, true);
                State.syncQueue = State.syncQueue.filter(q => q.id !== item.id);
            } catch (err) {
                console.warn("Sync interrupted:", err);
                break; 
            }
        }
        
        State.saveToLocal();
        if (State.syncQueue.length === 0) UI.showToast("All changes synced!", "success");
    }
};