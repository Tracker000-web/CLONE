/* ---------- auth.js ---------- */
import { API } from './api.js';
import { State } from './state.js';
import { UI } from './ui.js';

// UI Elements (localized to this module)
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const appContainer = document.getElementById("app");

export const Auth = {
    async handleLogin(email, password, rememberMe) {
        try {
            // In a real app, you'd fetch a token here. 
            // For now, we update local state based on checkSession logic.
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
        loginSection.style.display = "none";
        signupSection.style.display = "none";
        appContainer.style.display = "block";
        // Trigger a custom event so app.js knows to refresh the UI
        document.dispatchEvent(new CustomEvent('authChange'));
    },

    showLogin() {
        appContainer.style.display = "none";
        signupSection.style.display = "none";
        loginSection.style.display = "block";
    }
};

function toggleAuth(view) {
  document.getElementById('login-section').style.display = view === 'login' ? 'block' : 'none';
  document.getElementById('signup-section').style.display = view === 'signup' ? 'block' : 'none';
  document.getElementById('forgot-modal').style.display = view === 'forgot' ? 'flex' : 'none';
}

// Example Login Success
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  // Perform your validation here...

if (loginSuccessful) {
   
    localStorage.setItem('isLoggedIn', 'true');  // 1. Save the session so dashboard.html knows you are allowed in
    localStorage.setItem('userRole', 'admin');   // or 'user' based on your data
    window.location.href = 'dashboard.html';       // 2. REDIRECT to the new dashboard file
} else {
    alert("Invalid credentials");
}});

document.getElementById('show-signup').addEventListener('click', () => toggleAuth('signup'));
document.getElementById('show-login').addEventListener('click', () => toggleAuth('login'));
document.getElementById('show-forgot').addEventListener('click', () => toggleAuth('forgot'));
document.getElementById('close-forgot').addEventListener('click', () => toggleAuth('login'));

/* ---------- admin.js ---------- */