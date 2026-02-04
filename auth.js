/* ---------- auth.js ---------- */
import { api } from './api.js';
import { state } from './state.js';
import { UI } from './ui.js';

export const Auth = {
    async handleLogin(email, password, rememberMe) {
        try {
            const response = await api.login(email, password); 
            
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userToken', response.token); 
            localStorage.setItem('userRole', response.role);

            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
    

            UI.showToast("Welcome back!", "success");

            if (response.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            UI.showToast(err.message, "error");
        }
    },
    
        logout() {
        console.log("Logging out user...");
        
        // 1. Clear all credentials from storage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userRole');
        
        // 2. Send them back to the login screen
        window.location.href = 'index.html';
    }
}; // <--- THIS BRACE CLOSES THE AUTH OBJECT

// MOVE THESE OUTSIDE
window.logout = () => {
    localStorage.clear();
    window.location.href = 'index.html';
};

window.showLogin = () => {
    const loginSection = document.getElementById('login-section');
    const appSection = document.getElementById('app-section');
    if (loginSection) loginSection.style.display = 'block';
    if (appSection) appSection.style.display = 'none';
};

window.showApp = () => {
    const loginSection = document.getElementById('login-section');
    const appSection = document.getElementById('app-section');
    if (loginSection) loginSection.style.display = 'none';
    if (appSection) appSection.style.display = 'block';
};

// Global expose for inline HTML
window.toggleAuth = (view) => {
    const login = document.getElementById('login-section');
    const signup = document.getElementById('signup-section');
    const forgot = document.getElementById('forgot-modal');

    if (login) login.style.display = view === 'login' ? 'block' : 'none';
    if (signup) signup.style.display = view === 'signup' ? 'block' : 'none';
    if (forgot) forgot.style.display = view === 'forgot' ? 'flex' : 'none';
};

/**
 * Toggles between Login and Signup forms
 */
function toggleAuth() {
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');

    // If login is currently hidden or not set, show login and hide signup
    if (loginSection.style.display === 'none' || !loginSection.style.display) {
        loginSection.style.display = 'block';
        signupSection.style.display = 'none';
    } else {
        loginSection.style.display = 'none';
        signupSection.style.display = 'block';
    }
}

// Attach to window so the HTML onclick="toggleAuth()" can find it
window.toggleAuth = toggleAuth;

// Initialize view: Show login by default on first load
document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');
    
    // Set initial view
    if (loginSection) loginSection.style.display = 'block';
    if (signupSection) signupSection.style.display = 'none';

    // --- AUTO-FILL REMEMBERED EMAIL ---
    const savedEmail = localStorage.getItem('rememberedEmail');
    const emailInput = document.getElementById('email');
    const rememberCheckbox = document.getElementById('rememberMe');

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
    // ----------------------------------
});