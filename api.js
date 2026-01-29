/* ---------- api.js ---------- */
import { State } from './state.js';
import { UI } from './ui.js';

const BASE_URL = "http://127.0.0.1:5000";

export const API = {
    async checkSession() {
        const res = await fetch(`${BASE_URL}/api/me`, { credentials: "include" });
        if (!res.ok) throw new Error("Not logged in");
        return await res.json();
    },

    async addUser(userData) {
        return await fetch(`${BASE_URL}/add-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
    },

    async updateProfile(profileData) {
        return await fetch(`${BASE_URL}/api/update-profile`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Role': State.currentUser.role 
            },
            body: JSON.stringify(profileData)
        });
    }

    // Consolidating your logic into one saveCell function
    async saveCell(managerId, row, col, value, role, isSyncing = false) {
        // Handle Offline State
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
            throw err; // Re-throw so processSyncQueue knows to stop
        }
    },

    async processSyncQueue() {
        if (State.syncQueue.length === 0 || !navigator.onLine) return;

        // Create a copy to iterate through
        const queue = [...State.syncQueue];
        
        for (const item of queue) {
            try {
                await this.saveCell(item.managerId, item.row, item.col, item.value, item.role, true);
                // If successful, remove from the actual state
                State.syncQueue = State.syncQueue.filter(q => q.id !== item.id);
            } catch (err) {
                console.warn("Batch sync interrupted:", err);
                break; 
            }
        }
        
        State.saveToLocal();
        if (State.syncQueue.length === 0) {
            UI.showToast("All changes synced!", "success");
        }
    },

    async forgotPassword(email) {
        return await fetch(`${BASE_URL}/api/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
    }
};

async updateProfile(profileData) {
    return await fetch(`${BASE_URL}/api/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
    });
}