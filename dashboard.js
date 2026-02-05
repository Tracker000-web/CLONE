// dashboard.js
import { checkAuth, logut } from './auth.js';
import { State } from './state.js';
import { authenticatedFetch } from './api.js';
import { initSidebar, loadSidebarState } from './ui.js';

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

// 1. Immediate Security Check
if (checkAuth()) {
    console.log("User is authenticated. Loading dashboard...");
    initDashboard();
}

// API Interaction Example
export async function fetchData() {
    const response = await fetch(`${CONFIG.API_URL}/data`);
    return await response.json();
}

// Initializing Dashboard Logic
export async function initDashboard() {
    try {
        // 1. Verify session
        const user = await api.checkSession();
        State.currentUser = user;

        // 2. Fetch data from your backend
        const data = await fetchData('managers'); 
        
        // 3. Populate State and UI
        State.managers = data;
        Spreadsheet.renderManagers();
        
        UI.showToast(`Welcome, ${user.username}`, "success");
    } catch (error) {
        console.error("Dashboard failed to initialize:", error);
        // Handle the ERR_CONNECTION_REFUSED error
        UI.showToast("Server connection failed. Check your backend.", "error");
    }

    // 4. Load Dashboard Stats
    await loadDashboardStats();
    
    const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
        // Hide the link to the Admin Logs page
        const adminLink = document.querySelector('a[href="admin.html"]');
        if (adminLink) adminLink.style.display = 'none';
    
        // Hide any other admin-specific buttons (like "Add Column")
    document.querySelectorAll('.admin-only').forEach(el => el.remove());
}
}


// 1. Immediate Security Check
if (checkAuth()) {
    console.log("User is authenticated. Loading dashboard...");
    initDashboard();
}

async function loadDashboardStats() {
    try {
        const data = await authenticatedFetch('/api/stats');
        document.getElementById('user-count').textContent = data.count;
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
    const trackersBtn = document.getElementById('trackersBtn');
    const trackersView = document.getElementById('trackers-view');
    const logsView = document.getElementById('logs-view');

    if (trackersBtn && trackersView && logsView) {
        trackersBtn.addEventListener('click', () => {
            logsView.style.display = 'none';
            trackersView.style.display = 'block';
            document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
            trackersBtn.classList.add('active');
        });
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

notifyToggle.onchange = () => {
    globalState.settings.notifications = notifyToggle.checked;
    saveSettings();
}
document.querySelectorAll(".themeBtn").forEach(btn => {
    btn.onclick = () => {
        globalState.settings.theme = btn.dataset.theme;
        applyTheme(globalState.settings.theme);
        saveSettings();
    };
});

document.addEventListener('DOMContentLoaded', () => {
    loadSidebarState(); // Set preferred state
    initSidebar();      // Enable clicking

    const trackersBtn = document.getElementById('trackersBtn');
    const logsBtn = document.getElementById('logsBtn'); // Add an ID to your Logs button too
    const trackersView = document.getElementById('trackers-view');
    const logsView = document.getElementById('logs-view');


    // Default state: Show logs, hide trackers
    // Define the switching function
    function showView(viewToShow) {
        // Hide all views first
        if (logsView) logsView.style.display = 'none';
        if (trackersView) trackersView.style.display = 'none';

        // Show the requested view
        if (viewToShow) viewToShow.style.display = 'block';
    }

    if (logsBtn) {
        logsBtn.addEventListener('click', () => {
            showView(logsView);
            document.querySelectorAll('.primary-btn, .menu-btn').forEach(btn => btn.classList.remove('active'));
            logsBtn.classList.add('active');
            
            console.log("Switched to Logs Dashboard");
        });
    }

    if (trackersBtn) {
        trackersBtn.addEventListener('click', () => {
            // 1. Toggle visibility
            if (logsView) logsView.style.display = 'none';
            if (trackersView) trackersView.style.display = 'block';

            // 2. Visual feedback (blue highlight)
            document.querySelectorAll('.primary-btn, .menu-btn').forEach(btn => btn.classList.remove('active'));
            trackersBtn.classList.add('active');
            
            console.log("Switched to Trackers Dashboard");
        });
    }
});

async function loadManagers() {
    const managerContainer = document.getElementById('managerList');
    
    try {
        // 1. Fetch the list from your app.py backend
        const managers = await authenticatedFetch('/api/managers');
        
        // 2. Clear existing placeholder content
        managerContainer.innerHTML = '';

        // 3. Loop through and create a button for each manager
        managers.forEach(manager => {
            const btn = document.createElement('button');
            btn.className = 'manager-item';
            btn.innerHTML = `<span>${manager.name}</span>`;
            
            // Add click event to update the main content area
            btn.onclick = () => {
                document.getElementById('activeManager').textContent = manager.name;
                // Add logic here to load specific metrics for this manager
            };

            managerContainer.appendChild(btn);
        });
    } catch (error) {
        console.error("Error loading managers:", error);
    }

    setInterval(async () => {
        const trackers = await api.getTrackers();
        UI.renderTrackers(trackers);
    }, 30000); // 30 seconds
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', loadManagers);
document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());



// --- IGNORE ---


