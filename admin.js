/**
 * ADMIN.JS - Frontend Logic
 * Responsible for Audit Logs, User Management, and Admin UI
 */

import { requireAdmin, getUser } from "./auth.js";

// --- 1. SECURITY INITIALIZATION ---
// Immediately kick out non-admins before anything else loads
requireAdmin(); 
const currentUser = getUser();

// Global state for logs to allow filtering without re-fetching
let logs = []; 

// --- 2. DATA FETCHING ---
async function fetchLogs() {
    try {
        const res = await fetch("/api/logs", {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        if (!res.ok) throw new Error("Failed to fetch logs");
        logs = await res.json();
        renderLogs(logs);
    } catch (err) {
        console.error("Error loading logs:", err);
        // Fallback dummy data for development/testing
        logs = [
            { user: "John Doe", role: "user", phone: "09123456789", disposition: "Completed", history: "Submitted form", timestamp: "2026-01-27 10:00" },
            { user: "Jane Admin", role: "admin", phone: "09234567890", disposition: "Pending", history: "Edited manager", timestamp: "2026-01-27 11:00" }
        ];
        renderLogs(logs);
    }
}

// --- 3. UI RENDERING ---
function renderLogs(logsToRender) {
    const tableBody = document.querySelector("#logsTable tbody");
    if (!tableBody) return; 

    tableBody.innerHTML = "";
    logsToRender.forEach(log => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${log.user}</td>
            <td><strong>${log.role.toUpperCase()}</strong></td>
            <td>${log.phone}</td>
            <td><span class="status-badge status-${log.disposition.toLowerCase()}">${log.disposition}</span></td>
            <td>${log.history}</td>
            <td>${log.timestamp}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// --- 4. FILTERING & SEARCH ---
function filterLogs() {
    const role = document.getElementById("roleFilter")?.value.toLowerCase() || "";
    const disposition = document.getElementById("dispositionFilter")?.value.toLowerCase() || "";
    const phone = document.getElementById("phoneFilter")?.value.toLowerCase() || "";

    const filtered = logs.filter(log => {
        return (
            (role === "" || log.role.toLowerCase() === role) &&
            (disposition === "" || log.disposition.toLowerCase() === disposition) &&
            (phone === "" || log.phone.includes(phone))
        );
    });
    renderLogs(filtered);
}

// --- 5. EVENT LISTENERS & DOM READY ---
document.addEventListener("DOMContentLoaded", () => {
    // Initial data load
    fetchLogs();

    // Setup Filter Listeners
    const filters = ["roleFilter", "dispositionFilter", "phoneFilter"];
    filters.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const eventType = id === "phoneFilter" ? "input" : "change";
            el.addEventListener(eventType, filterLogs);
        }
    });

    // Clear Filters Button
    const clearBtn = document.getElementById("clearFilters");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            document.getElementById("roleFilter").value = "";
            document.getElementById("dispositionFilter").value = "";
            document.getElementById("phoneFilter").value = "";
            renderLogs(logs);
        });
    }

    // Logout Functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});