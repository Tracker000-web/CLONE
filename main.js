import { state } from './state.js';
import * as api from './api.js';
import * as ui from './ui.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Initial Session Check
    try {
        state.currentUser = await api.checkSession();
        console.log("Logged in as:", state.currentUser.role);
    } catch (err) {
        console.warn("User not authenticated.");
    }

    ui.applySettings();

    // UI Listeners (Safety checks included)
    const menuBtn = document.getElementById("menuBtn");
    if (menuBtn) {
        menuBtn.onclick = () => {
            document.getElementById("sideMenu")?.classList.add("open");
            document.getElementById("overlay")?.classList.add("active");
        };
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        };
    }
});