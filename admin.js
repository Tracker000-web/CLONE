/**
 * ADMIN.JS - Frontend Logic
 * Handles Admin Dashboard: Logs, Trackers, Managers, and UI
 */

import { requireAdmin, getUser } from "./auth.js";
import { api } from "./api.js";

// --- SECURITY ---
requireAdmin();
const currentUser = getUser();

// Redirect non-admins just in case
if (localStorage.getItem('userRole') !== 'admin') {
    window.location.href = 'index.html';
}

// Global state
let logs = [];
let managers = [];

// --- DOM ELEMENTS ---
const menuButtons = document.querySelectorAll('.menu-btn');
const logsView = document.getElementById('logsView');
const trackersView = document.getElementById('trackersView');
const viewTitle = document.getElementById('viewTitle');

const expandAddBtn = document.getElementById('expandAddBtn');
const trackerExpansionPanel = document.getElementById('trackerExpansionPanel');
const mgrNameInput = document.getElementById('mgrNameInput');
const mgrInstructionsInput = document.getElementById('mgrInstructionsInput');
const finalizeTrackerBtn = document.getElementById('finalizeTrackerBtn');
const trackersBody = document.getElementById('trackers-body');

const sheetOverlay = document.getElementById('spreadsheetOverlay');
const openSheetBtn = document.getElementById('openSheetBtn');
const closeSheetBtn = document.getElementById('closeSheetBtn');

const managerListContainer = document.getElementById('managerList');

// Toggle panel
expandAddBtn.onclick = () => {
    trackerExpansionPanel.classList.toggle('active');
    expandAddBtn.innerText = trackerExpansionPanel.classList.contains('active')
        ? 'Close Editor'
        : '+ Add New Manager Tracker';
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load logs
    await fetchLogs();

    // 2. Load managers sidebar
    await fetchManagers();

    // 3. Setup menu buttons
    setupMenuSwitching();

    // 4. Setup filters
    setupFilters();

    // 5. Expand/collapse tracker panel
    expandAddBtn.onclick = () => {
        trackerExpansionPanel.classList.toggle('active');
        expandAddBtn.innerText = trackerExpansionPanel.classList.contains('active')
            ? 'Close Editor'
            : '+ Add New Manager Tracker';
    };

    // 6. Spreadsheet modal
    if (openSheetBtn) openSheetBtn.onclick = () => sheetOverlay.style.display = 'flex';
    if (closeSheetBtn) closeSheetBtn.onclick = () => sheetOverlay.style.display = 'none';

    // 7. Finalize tracker
    if (finalizeTrackerBtn) {
        finalizeTrackerBtn.onclick = async () => {
        const name = mgrNameInput.value.trim();
        const instructions = mgrInstructionsInput.value.trim();

        if (!name) return alert("Manager Name Required");
        const manager = managers.find(m => m.name === name);
        if (!manager) return alert("Please select a valid manager from the list");

        try {
            await api.addTracker(manager.id, { instructions });
            alert("Tracker Sync Successful!");
            mgrInstructionsInput.value = "";
            trackerExpansionPanel.classList.remove('active');
            expandAddBtn.innerText = '+ Add New Manager Tracker';
            loadManagerTrackers(manager.id);
        } catch (err) {
            console.error("Sync Error:", err);
            alert("Failed to add tracker");
        }
    };
}});

// Fetch logs from backend
async function fetchLogs() {
    try {
        const res = await api.authenticatedFetch('/api/logs');
        logs = res;
    } catch (err) {
        console.warn("Failed to fetch logs, using fallback", err);
        logs = [
            { user: "John Doe", role: "user", phone: "09123456789", disposition: "Completed", history: "Submitted form", timestamp: "2026-01-27 10:00" },
            { user: "Jane Admin", role: "admin", phone: "09234567890", disposition: "Pending", history: "Edited manager", timestamp: "2026-01-27 11:00" }
        ];
    }
    renderLogs(logs);
}

// Render logs table
function renderLogs(logsToRender) {
    const tableBody = document.querySelector("#logsTable tbody");
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

// Filter setup
function setupFilters() {
    const roleFilter = document.getElementById("roleFilter");
    const dispositionFilter = document.getElementById("dispositionFilter");
    const phoneFilter = document.getElementById("phoneFilter");
    const clearBtn = document.getElementById("clearFilters");

    const filterLogsFunc = () => {
        const role = roleFilter.value.toLowerCase();
        const disposition = dispositionFilter.value.toLowerCase();
        const phone = phoneFilter.value.toLowerCase();

        const filtered = logs.filter(log => {
            return (
                (role === "" || log.role.toLowerCase() === role) &&
                (disposition === "" || log.disposition.toLowerCase() === disposition) &&
                (phone === "" || log.phone.includes(phone))
            );
        });
        renderLogs(filtered);
    };

    roleFilter?.addEventListener("change", filterLogsFunc);
    dispositionFilter?.addEventListener("change", filterLogsFunc);
    phoneFilter?.addEventListener("input", filterLogsFunc);

    clearBtn?.addEventListener("click", () => {
        roleFilter.value = "";
        dispositionFilter.value = "";
        phoneFilter.value = "";
        renderLogs(logs);
    });
}

// --- MENU SWITCHING ---
function setupMenuSwitching() {
    const menuButtons = document.querySelectorAll('.menu-btn');
    const sections = document.querySelectorAll('.admin-view');

    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;

            // Remove 'active' from all buttons
            menuButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show/hide views
            if (target === 'trackers') {
                trackersView.style.display = 'block';
                logsView.style.display = 'none';
                viewTitle.textContent = 'Manager Trackers';
            } else if (target === 'logs') {
                logsView.style.display = 'block';
                trackersView.style.display = 'none';
                viewTitle.textContent = 'System Audit Logs';
            } else {
                // Hide all if unknown
                trackersView.style.display = 'none';
                logsView.style.display = 'none';
            }
        });
    });
}



// Render managers in sidebar
async function renderManagersSidebar() {
    try {
        managers = await api.authenticatedFetch('/api/managers');
        managerListContainer.innerHTML = '';
        if (!managers.length) {
            managerListContainer.innerHTML = '<p class="empty-msg">No managers found.</p>';
            return;
        }

        managers.forEach(mgr => {
            const div = document.createElement('div');
            div.className = 'manager-card';
            div.textContent = mgr.name;
            div.dataset.id = mgr.id;

            div.addEventListener('click', () => {
                mgrNameInput.value = mgr.name;
                loadManagerTrackers(mgr.id);
                trackerExpansionPanel.classList.add('active');
            });

            managerListContainer.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        managerListContainer.innerHTML = '<p class="empty-msg">Failed to load managers.</p>';
    }
}

// Load previous trackers for a manager
async function loadManagerTrackers(managerId) {
    const panel = trackerExpansionPanel;
    try {
        const trackers = await api.authenticatedFetch(`/api/trackers?manager_id=${managerId}`);
        panel.innerHTML = ''; // Clear old trackers
        if (!trackers.length) {
            panel.innerHTML = '<p>No previous trackers</p>';
            return;
        }

        trackers.forEach(tr => {
            const div = document.createElement('div');
            div.className = 'tracker-item';
            div.textContent = `${tr.date || tr.createdAt} | ${tr.instructions}`;
            panel.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        panel.innerHTML = '<p>Error loading trackers</p>';
    }
}

// Finalize manager creation
finalizeTrackerBtn.onclick = async () => {
    const name = mgrNameInput.value.trim();
    const instructions = mgrInstructionsInput.value.trim();

    if (!name) return alert("Manager Name is required");

    const newManager = {
        name,
        instructions,
        createdAt: new Date().toISOString(),
        rows: [["", "", "Pending", ""]] // optional initial row
    };

    try {
        // Send to backend
        const response = await api.authenticatedFetch('/api/add-manager', {
            method: 'POST',
            body: JSON.stringify(newManager),
            headers: { 'Content-Type': 'application/json' }
        });

        // Render in body instead of sidebar
        renderManagerInBody(response);

        // Reset inputs and collapse panel
        mgrNameInput.value = '';
        mgrInstructionsInput.value = '';
        trackerExpansionPanel.classList.remove('active');
        expandAddBtn.innerText = '+ Add New Manager Tracker';

        alert("Manager added successfully!");
    } catch (err) {
        console.error("Failed to add manager:", err);
        alert("Error adding manager");
    }
};

// Render manager in the main trackers body
function renderManagerInBody(manager) {
    if (!trackersBody) return;

    const div = document.createElement('div');
    div.className = 'manager-card';
    div.textContent = manager.name;
    div.dataset.id = manager.id;

    div.onclick = () => {
        // Here you can route to manager tracker page or expand details
        location.hash = `#/trackers/${manager.id}`;
    };

    trackersBody.appendChild(div);

}