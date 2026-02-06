/* ---------- auth.js ---------- */
import { api } from './api.js';
import { UI } from './ui.js';

// --- AUTH FUNCTIONS ---
export function checkAuth() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

export function getUser() {
    return {
        token: localStorage.getItem('userToken'),
        role: localStorage.getItem('userRole')
    };
}

export function requireAdmin() {
    const user = getUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
    }
}

export function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// --- AUTH OBJECT ---
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
        localStorage.clear();
        window.location.href = 'index.html';
    }
};

// --- UI HELPERS ---
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

window.toggleAuth = (view) => {
    const login = document.getElementById('login-section');
    const signup = document.getElementById('signup-section');
    const forgot = document.getElementById('forgot-modal');

    if (login) login.style.display = view === 'login' ? 'block' : 'none';
    if (signup) signup.style.display = view === 'signup' ? 'block' : 'none';
    if (forgot) forgot.style.display = view === 'forgot' ? 'flex' : 'none';
};

// --- INIT ON LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');
    
    if (loginSection) loginSection.style.display = 'block';
    if (signupSection) signupSection.style.display = 'none';

    const savedEmail = localStorage.getItem('rememberedEmail');
    const emailInput = document.getElementById('email');
    const rememberCheckbox = document.getElementById('rememberMe');

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
});
