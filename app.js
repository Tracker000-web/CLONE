/* ---------- app.js ---------- */
import { State } from './state.js';
import { Auth } from './auth.js';
import { API } from './api.js';
import { Spreadsheet } from './spreadsheet.js';
import { UI } from './ui.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. SESSION & NETWORK INITIALIZATION
    UI.updateConnectionStatus(navigator.onLine);
    
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    try {
        State.currentUser = await API.checkSession();
        State.isLoggedIn = true;
        Auth.showApp();
        if (navigator.onLine) API.processSyncQueue();
    } catch {
        Auth.showLogin();
    }

    // 2. INITIAL COMPONENT RENDER
    applyTheme(State.settings.theme);
    Spreadsheet.renderManagers();
    
    const lastId = localStorage.getItem("activeManagerId");
    const lastManager = State.managers.find(m => m.id == lastId);
    if (lastManager) Spreadsheet.loadSpreadsheet(lastManager);

    // 3. EVENT LISTENERS: AUTH & FORMS
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }



    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const pass = document.querySelector('#password').value;
            const remember = document.getElementById('rememberMe').checked;
            Auth.handleLogin(email, pass, remember);
        };
    }

    // 4. EVENT LISTENERS: UI & NAVIGATION

 
    document.getElementById("menuBtn").onclick = () => {
        document.getElementById("sideMenu").classList.add("open");
        document.getElementById("overlay").classList.add("active");
    };

    document.getElementById("overlay").onclick = () => {
        document.getElementById("sideMenu").classList.remove("open");
        document.getElementById("overlay").classList.remove("active");
    };

    document.getElementById("managerSearch").oninput = (e) => {
        Spreadsheet.renderManagers(e.target.value);
    };
    document.getElementById("settingsBtn").onclick = () => {
        UI.openSettingsModal();
    };

    document.getElementById("logoutBtn").onclick = () => {
        Auth.logout();
    };
       document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    });

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

    // 6. GLOBAL OBSERVERS (Network & Auth)
    window.addEventListener('online', () => {
        UI.updateConnectionStatus(true);
        API.processSyncQueue();
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

// 7. SERVICE WORKER REGISTRATION
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker: Active'))
            .catch(err => console.error('Service Worker: Failed', err));
    });
}

/* ---------- app.js addition ---------- */
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profilePicInput = document.getElementById("profilePicInput");

if (saveProfileBtn) {
    saveProfileBtn.onclick = async () => {
        const name = document.getElementById('profile-name').value;
        const phone = document.getElementById('profile-phone').value;
        const file = profilePicInput.files[0];

        let profileData = { name, phone };

        if (file) {
            // Convert image to string before sending
            const base64String = await UI.handleImageUpload(file);
            profileData.profilePic = base64String;
        }

        try {
            await API.updateProfile(profileData);
            UI.showToast("Profile Updated!", "success");
            
            // Update local state so the UI reflects changes immediately
            State.currentUser.name = name;
            if (profileData.profilePic) {
                document.getElementById('nav-profile-pic').src = profileData.profilePic;
            }
        } catch (err) {
            UI.showToast("Update failed", "error");
        }
    };
}

