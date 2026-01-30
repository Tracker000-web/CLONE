import { fetchData } from './api.js';
import { checkAuth } from './auth.js';
import { globalState } from './state.js';
import { checkAuth, logout } from './auth.js';
import { authenticatedFetch } from './api.js';

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
// --- UI CONTROLS ---
if (menuBtn) {
menuBtn.onclick = () => { sideMenu.classList.add("open"); overlay.classList.add("active"); };
overlay.onclick = () => { sideMenu.classList.remove("open"); overlay.classList.remove("active"); };
settingsBtn.onclick = () => { settingsPanel.style.display = settingsPanel.style.display === "block" ? "none" : "block"; };
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

// --- IGNORE ---


