import { api } from './api.js';
import { State } from './state.js';
import { UI } from './ui.js';

const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const appContainer = document.getElementById("app");

export const Auth = {
    async handleLogin(email, password, rememberMe) {
        try {
            // In a real app, you'd fetch a token here. 
            // For now, we update local state based on checkSession logic.
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const token = localStorage.getItem('userToken'); 
            State.currentUser = await API.checkSession();
            State.isLoggedIn = true;

            if (rememberMe) 
                {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberMeChecked', 'true');
                } 
            
            else 
                {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberMeChecked');
                }

            this.showApp();
            } 
        
        catch (err) {
            alert("Login failed. Check your credentials or server status.");
             }

            UI.showToast("Invalid credentials", "error");

            if (signupBtn) {
             signupBtn.addEventListener('click', () => toggleAuth('signup'));
            }
    },

    async handleSignup(name, email, password) {
        try {
            await API.addUser({ username: name, email, password });
            alert("Registration Successful! Please Sign In.");
            this.showLogin();
        } catch (err) {
            console.error("Signup failed", err);
        }
            UI.showToast("Registration Successful!", "success");
    },

    logout() {
        State.currentUser = null;
        State.isLoggedIn = false;
        API.logout().catch(() => console.log("Logged out locally."));
        this.showLogin();
    },

    showApp() {
        if (loginSection) loginSection.style.display = "none";
        if (signupSection) signupSection.style.display = "none";
        if (appContainer) appContainer.style.display = "block";
        // Trigger a custom event so app.js knows to refresh the UI
        document.dispatchEvent(new CustomEvent('authChange'));
    },

    showLogin() {
        if (appContainer) appContainer.style.display = "none";
        if (signupSection) signupSection.style.display = "none";
        if (loginSection) loginSection.style.display = "block";
    }
};

export function checkAuth() {
    // Check for both the flag and the token for extra safety
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('userToken'); 

    if (!isLoggedIn || !token) {
        window.location.href = 'index.html';
        return false;
    }
        return true;
}

export function logout() {
    localStorage.removeItem('userToken');
    window.location.href = 'index.html';
}

function toggleAuth(view) {
  document.getElementById('login-section').style.display = view === 'login' ? 'block' : 'none';
  document.getElementById('signup-section').style.display = view === 'signup' ? 'block' : 'none';
  document.getElementById('forgot-modal').style.display = view === 'forgot' ? 'flex' : 'none';
  document.getElementById('login-form').style.display = view === 'forgot' ? 'none' : 'block';
}

// Example Login Success
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // FOR TESTING: Set this to true to bypass validation
        const loginSuccessful = true; 

        if (loginSuccessful) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', 'admin');
            window.location.href = 'dashboard.html'; // This triggers the redirect
        } else {
            alert("Invalid credentials");
        }
    });
}

const addSafeListener = (id, view) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => toggleAuth(view));
};

addSafeListener('show-signup', 'signup');
addSafeListener('show-login', 'login');
addSafeListener('show-forgot', 'forgot');
addSafeListener('close-forgot', 'login');

/* ---------- admin.js ---------- */