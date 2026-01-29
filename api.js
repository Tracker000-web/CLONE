/* ---------- api.js ---------- */
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

    async saveCell(managerId, row, col, value, role) {
        return await fetch(`${BASE_URL}/api/save-cell`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-Role": role 
            },
            body: JSON.stringify({ manager_id: managerId, row, col, value })
        });
    },

    async forgotPassword(email) {
        return await fetch(`${BASE_URL}/api/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
    }
};



/* ---------- End of api.js ---------- */