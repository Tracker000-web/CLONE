/* ---------- auth.js ---------- */
import { api } from './api.js';
import { State } from './state.js';
import { UI } from './ui.js';

export const Auth = {
    async handleLogin(email, password, rememberMe) {
    try {
        const response = await api.login(email, password); 
        
        // 1. Store the session and the role
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userToken', response.token); 
        localStorage.setItem('userRole', response.user.role); // Crucial for routing

        UI.showToast("Welcome back!", "success");

        // 2. Redirect based on role
        if (response.user.role === 'admin') {
            window.location.href = 'admin.html'; // Admin Dashboard
        } else {
            window.location.href = 'dashboard.html'; // Regular User Dashboard
        }
    } catch (err) {
        UI.showToast(err.message, "error");
    }
    }

    logout() {
        localStorage.clear();
        window.location.href = 'index.html';
    }
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