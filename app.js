/* ---------- app.js ---------- */
import { State } from './state.js';
import { Auth } from './auth.js';
import { API } from './api.js';
import { Spreadsheet } from './spreadsheet.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. SESSION INITIALIZATION
    try {
        State.currentUser = await API.checkSession();
        State.isLoggedIn = true;
        Auth.showApp();
    } catch {
        Auth.showLogin();
    }

    // 2. INITIAL COMPONENT RENDER
    applyTheme(State.settings.theme);
    Spreadsheet.renderManagers();
    
    const lastId = localStorage.getItem("activeManagerId");
    const lastManager = State.managers.find(m => m.id == lastId);
    if (lastManager) Spreadsheet.loadSpreadsheet(lastManager);

    // 3. AUTH & FORM LISTENERS
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

    // 4. UI & SIDEBAR INTERACTION
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

    // 5. DATA ACTIONS
    const addRowBtn = document.getElementById("addRowBtn");
    if (addRowBtn) {
        addRowBtn.onclick = () => {
            if (!State.currentActiveManager) return;
            State.currentActiveManager.rows.push(["", "", "", ""]);
            State.saveToLocal();
            Spreadsheet.loadSpreadsheet(State.currentActiveManager);
        };
    }

    // 6. GLOBAL OBSERVERS
    document.addEventListener('authChange', () => updateUIForRole());
});

function updateUIForRole() {
    const isAdmin = State.currentUser?.role === 'admin';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.setProperty('display', isAdmin ? 'block' : 'none', 'important');
    });
}

function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
}