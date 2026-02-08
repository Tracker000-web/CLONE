/**
 * ADMIN.JS - Frontend Logic
 * Handles Admin Dashboard: Logs, Trackers, Managers, and UI
 */

import { requireAdmin, getUser } from "./auth.js";
import { api } from "./api.js";

// --- SECURITY ---
requireAdmin();
const currentUser = getUser();
if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = 'index.html';
}

// --- GLOBAL STATE ---
let logs = [];
let managers = [];

// --- DOM ELEMENTS ---
let menuButtons, logsView, trackersView, viewTitle;
let expandAddBtn, trackerExpansionPanel, mgrNameInput, mgrInstructionsInput, finalizeTrackerBtn, trackersBody;
let sheetOverlay, openSheetBtn, closeSheetBtn;
let managerListContainer;

// --- MAIN INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // --- QUERY DOM ELEMENTS ---
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".side-menu");

    logsView = document.getElementById('logsView');
    trackersView = document.getElementById('trackersView');
    viewTitle = document.getElementById('viewTitle');

    expandAddBtn = document.getElementById('expandAddBtn');
    trackerExpansionPanel = document.getElementById('trackerExpansionPanel');
    mgrNameInput = document.getElementById('mgrNameInput');
    mgrInstructionsInput = document.getElementById('mgrInstructionsInput');
    finalizeTrackerBtn = document.getElementById('finalizeTrackerBtn');
    trackersBody = document.getElementById('trackers-body');

    sheetOverlay = document.getElementById('spreadsheetOverlay');
    openSheetBtn = document.getElementById('openSheetBtn');
    closeSheetBtn = document.getElementById('closeSheetBtn');

    managerListContainer = document.getElementById('managerList');

    menuButtons = document.querySelectorAll('.menu-btn');

    // --- SIDEBAR TOGGLE ---
    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        updateToolbarState();
    });

    function updateToolbarState() {
        if (sidebar.classList.contains("collapsed")) {
            document.body.classList.remove("sidebar-expanded");
            document.body.classList.add("sidebar-collapsed");
        } else {
            document.body.classList.remove("sidebar-collapsed");
            document.body.classList.add("sidebar-expanded");
        }
    }

    updateToolbarState(); // initial state

    // --- MENU SWITCHING ---
    setupMenuSwitching();

    // --- TRACKER PANEL TOGGLE ---
    expandAddBtn?.addEventListener('click', () => {
        const isActive = trackerExpansionPanel.classList.toggle('active');
        trackerExpansionPanel.style.display = isActive ? 'block' : 'none';
        expandAddBtn.innerText = isActive ? 'Close Editor' : '+ Add New Manager Tracker';
    });

    // --- SPREADSHEET MODAL ---
    openSheetBtn?.addEventListener('click', () => sheetOverlay.style.display = 'flex');
    closeSheetBtn?.addEventListener('click', () => sheetOverlay.style.display = 'none');

    // --- LOAD DATA ---
    await fetchLogs();
    await renderManagersSidebar();

    // --- FILTERS ---
    setupFilters();

    // --- FINALIZE TRACKER ---
    finalizeTrackerBtn?.addEventListener('click', finalizeTracker);
});

// -------------------- MENU SWITCHING --------------------
function setupMenuSwitching() {
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;

            menuButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (target === 'trackers') {
                trackersView.style.display = 'block';
                logsView.style.display = 'none';
                viewTitle.textContent = 'Manager Trackers';
            } else if (target === 'logs') {
                logsView.style.display = 'block';
                trackersView.style.display = 'none';
                viewTitle.textContent = 'System Audit Logs';
            } else {
                logsView.style.display = 'none';
                trackersView.style.display = 'none';
            }
        });
    });
}

// -------------------- LOGS --------------------
async function fetchLogs() {
    try {
        logs = await api.authenticatedFetch('/api/logs');
    } catch {
        logs = [
            { user: "John Doe", role: "user", phone: "09123456789", disposition: "Completed", history: "Submitted form", timestamp: "2026-01-27 10:00" },
            { user: "Jane Admin", role: "admin", phone: "09234567890", disposition: "Pending", history: "Edited manager", timestamp: "2026-01-27 11:00" }
        ];
    }
    renderLogs(logs);
}

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

// -------------------- FILTERS --------------------
function setupFilters() {
    const roleFilter = document.getElementById("roleFilter");
    const dispositionFilter = document.getElementById("dispositionFilter");
    const phoneFilter = document.getElementById("phoneFilter");
    const clearBtn = document.getElementById("clearFilters");

    const filterLogsFunc = () => {
        const role = roleFilter?.value.toLowerCase() || "";
        const disposition = dispositionFilter?.value.toLowerCase() || "";
        const phone = phoneFilter?.value || "";

        const filtered = logs.filter(log =>
            (role === "" || log.role.toLowerCase() === role) &&
            (disposition === "" || log.disposition.toLowerCase() === disposition) &&
            (phone === "" || log.phone.includes(phone))
        );
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

// -------------------- MANAGERS --------------------
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
                // Open editor panel
                trackerExpansionPanel.style.display = 'block';
                trackerExpansionPanel.classList.add('active');
                expandAddBtn.innerText = 'Close Editor';
                mgrNameInput.value = mgr.name;
                loadManagerTrackers(mgr.id);
            });

            managerListContainer.appendChild(div);
        });
    } catch {
        managerListContainer.innerHTML = '<p class="empty-msg">Failed to load managers.</p>';
    }
}

async function loadManagerTrackers(managerId) {
    try {
        const trackers = await api.authenticatedFetch(`/api/trackers?manager_id=${managerId}`);

        // Only show the list of trackers inside a sub-container, not wipe the whole panel
        const panelContent = document.createElement('div');
        if (!trackers.length) {
            panelContent.innerHTML = '<p>No previous trackers</p>';
        } else {
            trackers.forEach(tr => {
                const div = document.createElement('div');
                div.className = 'tracker-item';
                div.textContent = `${tr.date || tr.createdAt} | ${tr.instructions}`;
                panelContent.appendChild(div);
            });
        }

        // Clear previous content except input blocks and footer
        const inputBlocks = trackerExpansionPanel.querySelectorAll('.editor-row, .editor-footer');
        trackerExpansionPanel.innerHTML = '';
        inputBlocks.forEach(el => trackerExpansionPanel.appendChild(el));
        trackerExpansionPanel.appendChild(panelContent);
    } catch {
        trackerExpansionPanel.innerHTML += '<p>Error loading trackers</p>';
    }
}

// -------------------- FINALIZE TRACKER --------------------
async function finalizeTracker() {
    const name = mgrNameInput.value.trim();
    const instructions = mgrInstructionsInput.value.trim();

    if (!name) return alert("Manager Name is required");

    const newManager = {
        name,
        instructions,
        createdAt: new Date().toISOString(),
        rows: [["", "", "Pending", ""]]
    };

    try {
        const response = await api.authenticatedFetch('/api/add-manager', {
            method: 'POST',
            body: JSON.stringify(newManager),
            headers: { 'Content-Type': 'application/json' }
        });

        renderManagerInBody(response);

        mgrNameInput.value = '';
        mgrInstructionsInput.value = '';
        trackerExpansionPanel.style.display = 'none';
        trackerExpansionPanel.classList.remove('active');
        expandAddBtn.innerText = '+ Add New Manager Tracker';

        alert("Manager added successfully!");
    } catch {
        alert("Error adding manager");
    }
}

function renderManagerInBody(manager) {
    if (!trackersBody) return;

    const div = document.createElement('div');
    div.className = 'manager-card';
    div.textContent = manager.name;
    div.dataset.id = manager.id;

    div.addEventListener('click', () => {
        location.hash = `#/trackers/${manager.id}`;
    });

    trackersBody.appendChild(div);
}
