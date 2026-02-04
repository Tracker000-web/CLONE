/* ---------- app.js ---------- */
import { state } from './state.js';
import { Auth } from './auth.js';
import { api } from './api.js';
import { Spreadsheet } from './spreadsheet.js';
import { UI } from './ui.js';

document.addEventListener("DOMContentLoaded", async () => {
    console.log("App Initialized");

    // 1. INITIALIZATION & VARIABLES
    UI.updateConnectionStatus(navigator.onLine);
    
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    // 2. ATTACH FORM LISTENERS
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const pass = document.getElementById('login-password').value;
            const remember = document.getElementById('rememberMe')?.checked;
            
            try {
                if (Auth && typeof Auth.handleLogin === 'function') {
                    await Auth.handleLogin(email, pass, remember);
                }
            } catch (err) {
                console.error("Login Error:", err);
                alert("Login failed.");
            }
        };
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.onsubmit = async (e) => {
            e.preventDefault();
            const userData = {
                username: document.getElementById('reg-name-input').value,
                email: document.getElementById('reg-email-input').value,
                password: document.getElementById('reg-password-input').value
            };
            try {
                // This calls your API register route
                await api.register(userData); 
                alert("Account created successfully! Please Sign In.");
                window.toggleAuth('login');
            } catch (err) {
                alert("Signup failed: " + err.message);
            }
        };
    }

    // 3. LOGOUT BUTTON LISTENER
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (Auth && typeof Auth.logout === 'function') {
                Auth.logout();
            }
        };
    }

    // 4. SECURITY GATEKEEPING
    if (!isLoggedIn && !isLoginPage) {
        window.location.href = 'index.html';
        return;
    }

    if (isLoginPage && !isLoggedIn) {
        if (typeof window.showLogin === 'function') window.showLogin(); 
        return; 
    }

    // 5. SESSION CHECK
    try {
        state.currentUser = await api.checkSession();
        state.isLoggedIn = true;
        if (typeof window.showApp === 'function') window.showApp();
        updateUIForRole();
    } catch (err) {
        if (typeof window.showLogin === 'function') window.showLogin();
        if (!isLoginPage) {
            localStorage.setItem('isLoggedIn', 'false');
            window.location.href = 'index.html';
        }
    }

    if (state.settings?.theme) applyTheme(state.settings.theme);
});

window.showLogin = function() {
    window.toggleAuth('login');
};

window.showApp = function() {
    const loginSec = document.getElementById('login-section');
    const signupSec = document.getElementById('signup-section');
    const appSec = document.getElementById('app-section');

    if (loginSec) loginSec.style.display = 'none';
    if (signupSec) signupSec.style.display = 'none';
    if (appSec) appSec.style.display = 'block';
};


// --- GLOBAL HELPERS (Accessible by HTML) ---
window.toggleAuth = function(mode) {
    const loginSec = document.getElementById('login-section');
    const signupSec = document.getElementById('signup-section');
    const forgotMod = document.getElementById('forgot-modal');

    if (loginSec) loginSec.style.display = 'none';
    if (signupSec) signupSec.style.display = 'none';
    if (forgotMod) forgotMod.style.display = 'none';

    if (mode === 'login') {
        loginSec.style.display = 'block';
    } else if (mode === 'signup') {
        signupSec.style.display = 'block';
    } else if (mode === 'forgot') {
        loginSec.style.display = 'block';
        forgotMod.style.display = 'flex';
    }
};

function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
}

function updateUIForRole() {
    const userRole = state.currentUser?.role; 
    const isAdmin = userRole === 'admin';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.setProperty('display', isAdmin ? 'block' : 'none', 'important');
    });
}