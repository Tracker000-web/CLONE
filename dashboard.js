// dashboard.js
import { checkAuth, logout } from './auth.js';
import { State as globalState } from './state.js';
import * as api from './api.js';
import * as UI from './ui.js';

const CACHE_NAME = 'tracker-cache-v1';
const ASSETS_TO_CACHE = [
    './index.html',
    './dashboard.html',
    './admin.html',
    './styles.css',
    './app.js',
    './state.js',
    './api.js',
    './auth.js',
    './spreadsheet.js',
    './manifest.json',
    './ui.js',
    './4840719.jpg'
];

// UI Elements
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const notifyToggle = document.getElementById("notifyToggle");
const menuBtn = document.getElementById("menuBtn");

// Apply saved theme on load
function applyTheme(theme) {
    document.body.className = `theme-${theme || 'dark'}`;
}

// API Interaction Example
export async function fetchData() {
    const response = await fetch(`${CONFIG.API_URL}/data`);
    return await response.json();
}

// 1. Immediate Security Check
if (checkAuth()) {
    console.log("User is authenticated. Loading dashboard...");
    initDashboard();
}

if (managerSearch) {
    managerSearch.oninput = () => renderManagers(managerSearch.value);
}

// Initializing Dashboard Logic
export async function initDashboard() {
    setupViewSwitching();

   try {
        // 2. Load background data
        await api.checkSession();
        loadDashboardStats().catch(() =>
            console.warn("Stats server unreachable")
        );
        loadManagers().catch(() =>
            console.warn("Managers server unreachable")
        );
    } 
    catch (error) {
        console.error(
            "Dashboard failed to initialize data, but UI is active:",
        error);
    }

    const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
            document.querySelectorAll('.admin-only')
            .forEach(el => el.remove());
}}

async function loadManagers() {
    try {
        const managers = await api.authenticatedFetch('/api/managers'); 
        const trackerList = document.getElementById('trackerManagersList');
        if (!trackerList) return;

        trackerList.innerHTML = '';

        if (!managers.length) {
            trackerList.innerHTML =
              `<p class="empty-msg">No managers available.</p>`;
            return;
        }

        managers.forEach(mgr => {
            const btn = document.createElement('button');
            btn.className = 'tracker-manager-btn';
            btn.textContent = mgr.name;

            btn.onclick = () => {
                window.location.href =
                  `tracker.html?managerId=${mgr.id}`;
            };

         trackerList.appendChild(btn);
        });

    } catch (err) {
        console.error("Error loading managers:", err);
    }
}

function renderManagers(managers) {
    const container = document.getElementById('trackers-body');
    container.innerHTML = '';

    managers.forEach(manager => {
        const div = document.createElement('div');
        div.className = 'manager-card';
        div.textContent = manager.name;
        div.dataset.id = manager.id;

        div.addEventListener('click', () => {
            location.hash = `#/trackers/${manager.id}`;
        });

        container.appendChild(div);
    });
}

async function loadDashboardStats() {
    try {
        // Changed to api.authenticatedFetch
        const data = await api.authenticatedFetch('/api/stats');
        const userCountEl = document.getElementById('user-count');
        if (userCountEl) userCountEl.textContent = data.count;
    } catch (error) {
        console.error("Failed to load stats:", error);
    }
}

// 3. Attach Logout Event
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

applyTheme(globalState.settings.theme);

function setupViewSwitching() {
    const navButtons = document.querySelectorAll('.menu-btn');
    const dashboardViews = document.querySelectorAll('.dashboard-view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');

            dashboardViews.forEach(view => view.style.display = 'none' );

            // Mapping logic: if target is 'reports', show 'metricsView'
            // Otherwise, show the target name + 'View' (e.g., 'trackersView')
            const targetId = (target === 'reports') ? 'metricsView' : `${target}View`;
            const viewToShow = document.getElementById(targetId);
            
            if (viewToShow) {
                viewToShow.style.display = 'block';
                
                console.log("Switched to:", targetId);
            } else {
                console.error("Could not find section with ID:", targetId);
            }
        });
    });
}


// Save settings to localStorage
function saveSettings() {
    localStorage.setItem("settings", JSON.stringify(globalState.settings));
}
// Load settings from localStorage
const savedSettings = localStorage.getItem("settings");
if (savedSettings) {
    globalState.settings = JSON.parse(savedSettings);
    notifyToggle.checked = globalState.settings.notifications;
}

// --- SYNC QUEUE PROCESSING ---
window.addEventListener('online', () => {
    UI.updateConnectionStatus(true);
    api.processSyncQueue();
});
window.addEventListener('offline', () => {
    UI.updateConnectionStatus(false);
});

// Check menu button and side menu
if (menuBtn && sideMenu && overlay) {
    menuBtn.onclick = () => { 
        sideMenu.classList.add("open"); 
        overlay.classList.add("active"); 
    };
    overlay.onclick = () => { 
        sideMenu.classList.remove("open"); 
        overlay.classList.remove("active"); 
    };
}

// Check settings panel
if (settingsBtn && settingsPanel) {
    settingsBtn.onclick = () => { 
        settingsPanel.style.display = settingsPanel.style.display === "block" ? "none" : "block"; 
    };
}

// Check manager search
if (managerSearch) {
    managerSearch.oninput = () => renderManagers(managerSearch.value);
}

if (notifyToggle) {
    notifyToggle.onchange = () => {
        globalState.settings.notifications = notifyToggle.checked;
        saveSettings();
    };
}

document.querySelectorAll(".themeBtn").forEach(btn => {
    btn.onclick = () => {
        globalState.settings.theme = btn.dataset.theme;
        applyTheme(globalState.settings.theme);
        saveSettings();
    };
});

document.getElementById('logoutBtn').addEventListener('click', logout);


// --- IGNORE ---