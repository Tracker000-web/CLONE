import { authenticatedFetch } from './api.js'; 
import { Auth } from './auth.js';

async function handleLogin(e) {
    e.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('login-password');
    
    if (!emailInput || !passwordInput) {
        console.error("Could not find input fields in the HTML.");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        const data = await authenticatedFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        console.log("Login successful!", data);

        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userRole', data.role);

        // Redirect based on role
        if (data.role === "admin") {
            console.log("Admin Access Granted.");
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (error) {
        console.error("Login failed:", error.message);
        alert("Login Error: " + error.message);
        alert(error.message || "Invalid email or password");
    }
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = loginForm.querySelector('input[name="remember"]').checked;

        await Auth.handleLogin(email, password, rememberMe);
    });
}