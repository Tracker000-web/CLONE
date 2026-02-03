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

            UI.showToast("Welcome back!", "success");

            if (response.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            UI.showToast(err.message, "error");
        }
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