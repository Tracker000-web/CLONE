/* ---------- app.js ---------- */
import { state } from './state.js';
import { Auth } from './auth.js';
import { api } from './api.js';
import { Spreadsheet } from './spreadsheet.js';
import { UI } from './ui.js';

document.addEventListener("DOMContentLoaded", async () => {
    console.log("App Initialized");

    // 1. SPLASH SCREEN LOGIC (Run this first!)
    const splash = document.getElementById('splash-screen');
    const authWrapper = document.querySelector('.auth-wrapper');

    // Wait for the window to fully load assets, then fade splash
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (splash) {
                splash.style.opacity = '0';
                splash.style.visibility = 'hidden';
                // Remove from layout after fade animation
                setTimeout(() => splash.style.display = 'none', 500);
            }
            if (authWrapper) {
                authWrapper.classList.add('visible');
            }
        }, 1500); 
    });

    // 2. INITIALIZATION & UI
    UI.updateConnectionStatus(navigator.onLine);
    
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    // 3. ATTACH FORM LISTENERS
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
                await api.register(userData); 
                alert("Account created successfully! Please Sign In.");
                window.toggleAuth('login');
            } catch (err) {
                alert("Signup failed: " + err.message);
            }
        };
    }

    // 4. PASSWORD VISIBILITY TOGGLE
    const togglePassword = document.querySelector('#togglePassword');
    const password = document.querySelector('#login-password');
    if (togglePassword && password) {
        togglePassword.addEventListener('click', function () {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    }

    // 5. LOGOUT BUTTON
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (Auth && typeof Auth.logout === 'function') {
                Auth.logout();
            }
        };
    }

    // 6. SECURITY GATEKEEPING
    if (!isLoggedIn && !isLoginPage) {
        window.location.href = 'index.html';
        return;
    }

    if (isLoginPage && !isLoggedIn) {
        window.toggleAuth('login'); 
    }

    // 7. SESSION CHECK
    try {
        state.currentUser = await api.checkSession();
        state.isLoggedIn = true;
        // if (typeof window.showApp === 'function') window.showApp();
    } catch (err) {
        if (typeof window.showLogin === 'function') window.showLogin();
        if (!isLoginPage) {
            localStorage.setItem('isLoggedIn', 'false');
            window.location.href = 'index.html';
        }
    }

    if (state.settings?.theme) applyTheme(state.settings.theme);

    if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("Service Worker Registered"));
}

}); // End of DOMContentLoaded

// --- GLOBAL HELPERS (Outside the DOMContentLoaded block) ---

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

window.toggleAuth = function(mode) {
    const loginSec = document.getElementById('login-section');
    const signupSec = document.getElementById('signup-section');
    const forgotMod = document.getElementById('forgot-modal');

    if (loginSec) loginSec.style.display = 'none';
    if (signupSec) signupSec.style.display = 'none';
    if (forgotMod) forgotMod.style.display = 'none';

    if (mode === 'login') {
        if (loginSec) loginSec.style.display = 'block';
    } else if (mode === 'signup') {
        if (signupSec) signupSec.style.display = 'block';
    } else if (mode === 'forgot') {
        if (loginSec) loginSec.style.display = 'block';
        if (forgotMod) forgotMod.style.display = 'flex';
    }
};

function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
}

let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    if (installBtn) installBtn.style.display = 'block';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
        }
    });
}