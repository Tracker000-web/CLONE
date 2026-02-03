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

    // 2. ATTACH LOGIN FORM LISTENER (Must be before any returns!)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log("Login form detected, attaching listener...");
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const pass = document.getElementById('login-password').value;
            const remember = document.getElementById('rememberMe')?.checked;
            
            console.log("Sign In clicked for:", email);

            try {
                // Ensure Auth.handleLogin exists and call it
                if (Auth && typeof Auth.handleLogin === 'function') {
                    await Auth.handleLogin(email, pass, remember);
                } else {
                    console.error("Auth.handleLogin is not defined! Check your auth.js exports.");
                }
            } catch (err) {
                console.error("Login Error:", err);
                alert("Login failed. Check console for details.");
            }
        };
    }

    // 3. SECURITY GATEKEEPING
    if (!isLoggedIn && !isLoginPage) {
        console.log("Unauthorized access. Redirecting to login...");
        window.location.href = 'index.html';
        return;
    }

    if (isLoginPage && !isLoggedIn) {
        console.log("Ready for user login.");

        // We must show the form BEFORE we stop the script
        if (typeof window.showLogin === 'function') {
            window.showLogin(); 
        }

        return; // Stops here to wait for user input
    }

    // 4. SESSION CHECK (Only for active sessions)
    try {
        state.currentUser = await api.checkSession();
        state.isLoggedIn = true;

        // 1. Show the dashboard/app UI
        if (typeof window.showApp === 'function') {
            window.showApp();
        }

        // 2. Hide/Show buttons based on if they are an admin or user
        updateUIForRole();

    } catch (err) {
        console.warn("Session expired or backend offline.");

        // 3. Fix the blank screen: force the login form to show if session fails
        if (typeof window.showLogin === 'function') {
            window.showLogin();
        }

        // 4. Only kick them to index.html if they are currently on a dashboard page
        if (!isLoginPage) {
            localStorage.setItem('isLoggedIn', 'false');
            window.location.href = 'index.html';
        }
    }

    // 5. OTHER UI INITIALIZATION
    if (state.settings?.theme) applyTheme(state.settings.theme);
    
    // Add logic for logout button if it exists
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.onclick = () => Auth.logout();
    }
});

// --- HELPER FUNCTIONS ---
function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
}

function updateUIForRole() {
    // app.py returns 'role' directly in the user object
    const userRole = state.currentUser?.role; 
    const isAdmin = userRole === 'admin';
    
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.setProperty('display', isAdmin ? 'block' : 'none', 'important');
    });
}

export async function fetchData(endpoint) {
    const response = await fetch(`http://127.0.0.1:5000/api/${endpoint}`);
    if (!response.ok) throw new Error("Data fetch failed");
    return await response.json();
}