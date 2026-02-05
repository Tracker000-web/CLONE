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
const managerSearch = document.getElementById("managerSearch");
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

// Initializing Dashboard Logic
export async function initDashboard() {
  // 1. ATTACH LISTENERS FIRST (Ensures buttons work even if code below fails)
    setupViewSwitchin;

   try {
        // 2. Load background data
        await api.checkSession();
        loadDashboardStats().catch(err => console.warn("Stats server unreachable"));
        loadManagers().catch(err => console.warn("Managers server unreachable"));
    } 
    catch (error) {
        console.error("Dashboard failed to initialize data, but UI is active:", error);
    }


    const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
        // Hide the link to the Admin Logs page
        const adminLink = document.querySelector('a[href="admin.html"]');
        if (adminLink) adminLink.style.display = 'none';
    
        // Hide any other admin-specific buttons (like "Add Column")
    document.querySelectorAll('.admin-only').forEach(el => el.remove());
}}

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
const logoutBtn = document.getElementById('logout-button');
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

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

function initTrackerLogic() {
    const modal = document.getElementById('trackerModal');
    const openBtn = document.getElementById('openTrackerModal') || document.getElementById('addTrackerBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const saveBtn = document.getElementById('saveTrackerBtn');
    const trackerList = document.getElementById('trackerListContainer');
    
    if (openBtn && modal) {
        openBtn.onclick = () => {
            modal.style.display = 'flex';
            console.log("Modal opened");
        }
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const managerSelect = document.getElementById('modalManager');
            const managerName = managerSelect.options[managerSelect.selectedIndex].text;
            const shift = document.getElementById('modalShift').value;
            const date = document.getElementById('modalDate').value;

            if (!managerSelect.value || !date) return alert("Please fill everything!");

            try {
                // SYNC: Optional API call
                // await api.addTracker({ managerName, shift, date });

                // CREATE TAB
                const tab = document.createElement('div');
                tab.className = 'tracker-tab';
                tab.innerHTML = `
                    <div class="tab-info">
                        <strong>${managerName}</strong>
                        <span>${shift} | ${date}</span>
                    </div>
                    <div class="tab-status">Active</div>
                `;

                // Click the tab to open the spreadsheet
                tab.onclick = () => openSpreadsheet(managerName);

                trackerList.prepend(tab);

                // HIDE FORM (Sudden disappearance)
                modal.style.display = 'none';
                
                // RESET FORM
                const emptyMsg = trackerList.querySelector('.empty-msg');
                if (emptyMsg) emptyMsg.remove();
                
            } catch (err) {
                console.error("Sync failed", err);
            }
        };
    }
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
    API.processSyncQueue();
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



// Call the function when the page loads
document.addEventListener('DOMContentLoaded', loadManagers);
async function loadManagers() {
    try {
        // Fetch managers from your API
        const managers = await api.authenticatedFetch('/api/managers'); 
        const select = document.getElementById('modalManager');
        const sideList = document.getElementById('managerList');

        if (!select) return;

        // Clear existing options except the first one
        select.innerHTML = '<option value="">Select Manager</option>';

        managers.forEach(mgr => {
            // Populate Modal Dropdown
            const opt = document.createElement('option');
            opt.value = mgr.id;
            opt.textContent = mgr.name;
            select.appendChild(opt);

            // Optional: Populate Sidebar list if needed
            if (sideList) {
                const btn = document.createElement('button');
                btn.className = 'menu-btn';
                btn.textContent = mgr.name;
                sideList.appendChild(btn);
            }
        });
    } catch (err) {
        console.error("Error loading managers:", err);
    }
}

function renderManagersToUI(managers) {
    const select = document.getElementById('modalManager');
    if (!select) return;
    select.innerHTML = '<option value="">Select Manager</option>';
    managers.forEach(mgr => {
        const opt = document.createElement('option');
        opt.value = mgr.id;
        opt.textContent = mgr.name;
        select.appendChild(opt);
    });
}

document.getElementById('logoutBtn').addEventListener('click', logout);


// --- IGNORE ---