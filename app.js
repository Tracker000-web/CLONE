/* ---------- app.js ---------- */
import { state } from './state.js';
import { Auth } from './auth.js';
import { api } from './api.js';
import { Spreadsheet } from './spreadsheet.js';
import { UI } from './ui.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. SESSION & NETWORK INITIALIZATION
    UI.updateConnectionStatus(navigator.onLine);
    
    // Safety check for login status
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        // If we are not on index.html and not logged in, redirect
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
            return;
        }
    }

    // Only attempt session check if server is expected to be up
    try {
        state.currentUser = await api.checkSession();
        state.isLoggedIn = true;
        Auth.showApp();
        if (navigator.onLine) api.processSyncQueue();
    } catch (err) {
        console.warn("Session check failed. Backend might be offline.");
        // Only show login UI if elements exist on this page
        window.showLogin();
    }

    // 2. INITIAL COMPONENT RENDER
    if (state.settings?.theme) applyTheme(state.settings.theme);
    
    // Check if Spreadsheet functions exist before calling
    if (typeof Spreadsheet.renderManagers === 'function') {
        Spreadsheet.renderManagers();
    }
    
    const lastId = localStorage.getItem("activeManagerId");
    const lastManager = state.managers.find(m => m.id == lastId);
    if (lastManager && typeof Spreadsheet.loadSpreadsheet === 'function') {
        Spreadsheet.loadSpreadsheet(lastManager);
    }

    // 3. EVENT LISTENERS: AUTH & FORMS
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const pass = document.querySelector('#password').value;
            const remember = document.getElementById('rememberMe')?.checked;
            Auth.handleLogin(email, pass, remember);
        };
    }

    // 4. EVENT LISTENERS: UI & NAVIGATION (Fixes Null Property Crashes)
    const menuBtn = document.getElementById("menuBtn");
    if (menuBtn) {
        menuBtn.onclick = () => {
            document.getElementById("sideMenu")?.classList.add("open");
            document.getElementById("overlay")?.classList.add("active");
        };
    }

    const overlay = document.getElementById("overlay");
    if (overlay) {
        overlay.onclick = () => {
            document.getElementById("sideMenu")?.classList.remove("open");
            overlay.classList.remove("active");
        };
    }

    const managerSearch = document.getElementById("managerSearch");
    if (managerSearch) {
        managerSearch.oninput = (e) => {
            Spreadsheet.renderManagers(e.target.value);
        };
    }

    const settingsBtn = document.getElementById("settingsBtn");
    if (settingsBtn) {
        settingsBtn.onclick = () => UI.openSettingsModal();
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.onclick = () => Auth.logout();
    }

    

    // 5. DATA & ADMIN ACTIONS
    const addRowBtn = document.getElementById("addRowBtn");
    if (addRowBtn) {
        addRowBtn.onclick = () => {
            if (!State.currentActiveManager) return;
            State.currentActiveManager.rows.push(["", "", "", ""]);
            State.saveToLocal();
            Spreadsheet.loadSpreadsheet(State.currentActiveManager);
        };
    }

    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
        exportBtn.onclick = () => Spreadsheet.downloadCSV();
    }

    // 6. GLOBAL OBSERVERS
    window.addEventListener('online', () => {
        UI.updateConnectionStatus(true);
        api.processSyncQueue();
    });

    window.addEventListener('offline', () => {
        UI.updateConnectionStatus(false);
    });

    document.addEventListener('authChange', () => updateUIForRole());
});

// --- HELPER FUNCTIONS ---
function updateUIForRole() {
    const isAdmin = State.currentUser?.role === 'admin';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.setProperty('display', isAdmin ? 'block' : 'none', 'important');
    });
}

function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
}

// Add this to resolve the SyntaxError
export async function fetchData(endpoint) {
    const response = await fetch(`http://127.0.0.1:5000/api/${endpoint}`);
    if (!response.ok) throw new Error("Data fetch failed");
    return await response.json();
}

const toggleLinks = document.querySelectorAll('.toggle-auth-link'); // Add this class to your <a> tags
toggleLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Put your toggle logic here
    });
});

// This runs when the user logs in or refreshes the page
async function renderManagers() {
    const managerList = document.getElementById("managerList");
    if (!managerList) return;

    try {
        // Fetch the list of managers added by the Admin
        const res = await fetch("http://127.0.0.1:5000/api/managers");
        const managers = await res.json();

        managerList.innerHTML = ""; // Clear old list

        managers.forEach(m => {
            const div = document.createElement("div");
            div.className = "manager-item";
            div.innerHTML = `<span>${m.name}</span>`;
            
            // Output: When clicked, the table "pops out" (loads)
            div.onclick = () => loadSpreadsheet(m); 
            
            managerList.appendChild(div);
        });
    } catch (err) {
        console.warn("Could not fetch managers. Server might be offline.");
    }
}