// dashboard.js
import { checkAuth } from './auth.js';
import { globalState } from './state.js';
import { authenticatedFetch } from './api.js';
import { initSidebar, loadSidebarState } from './ui.js';

// UI Elements
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");
const settingsPanel = document.getElementById("settingsPanel");
const managerSearch = document.getElementById("managerSearch");
const notifyToggle = document.getElementById("notifyToggle");
const menuBtn = document.getElementById("menuBtn");

// Apply saved theme on load
function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
}


// API Interaction Example
export async function fetchData() {
    const response = await fetch(`${CONFIG.API_URL}/data`);
    return await response.json();
}

export async function initDashboard() {
    try {
        // 1. Verify session
        const user = await API.checkSession();
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

// 2. Initialize Dashboard Logic
function initDashboard() {
    // Your code to fetch data from api.js goes here
    loadDashboardStats();

}

// 3. Attach Logout Event
const logoutBtn = document.getElementById('logout-button');
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}


applyTheme(globalState.settings.theme);

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
}
);
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
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', loadManagers);



// --- IGNORE ---


