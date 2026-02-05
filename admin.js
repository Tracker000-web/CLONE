/**
 * ADMIN.JS - Frontend Logic
 * Responsible for Audit Logs, User Management, and Admin UI
 */

import { requireAdmin, getUser } from "./auth.js";

// --- 1. SECURITY INITIALIZATION ---
// Immediately kick out non-admins before anything else loads
requireAdmin(); 
const currentUser = getUser();

const role = localStorage.getItem('userRole');
if (role !== 'admin') {
    window.location.href = 'admin.html'; // Boot them to the user page
}
// Global state for logs to allow filtering without re-fetching
let logs = []; 

// --- 2. DATA FETCHING ---
async function fetchLogs() {
    try {
        const res = await fetch("/api/logs", {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        if (!res.ok) throw new Error("Failed to fetch logs");
        logs = await res.json();
        renderLogs(logs);
    } catch (err) {
        console.error("Error loading logs:", err);
        // Fallback dummy data for development/testing
        logs = [
            { user: "John Doe", role: "user", phone: "09123456789", disposition: "Completed", history: "Submitted form", timestamp: "2026-01-27 10:00" },
            { user: "Jane Admin", role: "admin", phone: "09234567890", disposition: "Pending", history: "Edited manager", timestamp: "2026-01-27 11:00" }
        ];
        renderLogs(logs);
    }
}

// --- 3. UI RENDERING ---
function renderLogs(logsToRender) {
    const tableBody = document.querySelector("#logsTable tbody");
    if (!tableBody) return; 

    tableBody.innerHTML = "";
    logsToRender.forEach(log => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${log.user}</td>
            <td><strong>${log.role.toUpperCase()}</strong></td>
            <td>${log.phone}</td>
            <td><span class="status-badge status-${log.disposition.toLowerCase()}">${log.disposition}</span></td>
            <td>${log.history}</td>
            <td>${log.timestamp}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// --- 4. FILTERING & SEARCH ---
function filterLogs() {
    const role = document.getElementById("roleFilter")?.value.toLowerCase() || "";
    const disposition = document.getElementById("dispositionFilter")?.value.toLowerCase() || "";
    const phone = document.getElementById("phoneFilter")?.value.toLowerCase() || "";

    const filtered = logs.filter(log => {
        return (
            (role === "" || log.role.toLowerCase() === role) &&
            (disposition === "" || log.disposition.toLowerCase() === disposition) &&
            (phone === "" || log.phone.includes(phone))
        );
    });
    renderLogs(filtered);
}

// Function for Admin to add a new manager
async function addManager(name, instructions) {
    const newManager = {
        name: name,
        instructions: instructions, // Add this line
        rows: [["", "", "Pending", ""]] 
    };

    try {
        const response = await fetch("http://127.0.0.1:5000/api/add-manager", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newManager)
        });

        if (response.ok) {
            alert("Tracker Sync Successful!");
            location.reload(); // Refresh to update sidebar and grid
        }
    } catch (err) {
        console.error("Failed to add manager:", err);
    }
}

function renderMetricsUI(counts) {
    const container = document.querySelector(".subtitle"); // Label this as "METRICS"
    container.innerHTML = `
        <h3>DISPOSITIONS</h3>
        <ul>
            <li>Dials: ${counts["Number Dials"]}</li>
            <li>Appointments: ${counts["Appointments"]}</li>
            <li>Confirmed: ${counts["Confirmed Preset Appointment"]}</li>
            </ul>
    `;
}

// --- 5. EVENT LISTENERS & DOM READY ---
document.addEventListener("DOMContentLoaded", () => {
    // Initial data load
    fetchLogs();

    // Setup Filter Listeners
    const filters = ["roleFilter", "dispositionFilter", "phoneFilter"];
    filters.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const eventType = id === "phoneFilter" ? "input" : "change";
            el.addEventListener(eventType, filterLogs);
        }
    });

    // Clear Filters Button
    const clearBtn = document.getElementById("clearFilters");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            document.getElementById("roleFilter").value = "";
            document.getElementById("dispositionFilter").value = "";
            document.getElementById("phoneFilter").value = "";
            renderLogs(logs);
        });
    }
    
    // --- NEW: VIEW SWITCHING LOGIC ---
    const menuButtons = document.querySelectorAll('.menu-btn');
    const trackersView = document.getElementById('trackersView');
    const logsView = document.getElementById('logsView'); // Ensure your logs table is inside this ID
    const viewTitle = document.getElementById('viewTitle');

    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');

            // Toggle active button style
            menuButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle Content Views
            if (target === 'trackers') {
                trackersView.style.display = 'block';
                logsView.style.display = 'none';
                viewTitle.innerText = "Manager Trackers";
            } else if (target === 'logs') {
                trackersView.style.display = 'none';
                logsView.style.display = 'block';
                viewTitle.innerText = "System Audit Logs";
            }
        });
    });

    // --- NEW: EXPANDING TRACKER PANEL ---
    const expandAddBtn = document.getElementById('expandAddBtn');
    const trackerExpansionPanel = document.getElementById('trackerExpansionPanel');
    
    if (expandAddBtn) {
        expandAddBtn.onclick = () => {
            trackerExpansionPanel.classList.toggle('active');
            expandAddBtn.innerHTML = trackerExpansionPanel.classList.contains('active') 
                ? "Close Editor" 
                : "+ Add New Manager Tracker";
        };
    }

    // --- NEW: SPREADSHEET MODAL ---
    const sheetOverlay = document.getElementById('spreadsheetOverlay');
    const openSheetBtn = document.getElementById('openSheetBtn');
    const closeSheetBtn = document.getElementById('closeSheetBtn');

    if (openSheetBtn) {
        openSheetBtn.onclick = () => {
            sheetOverlay.style.display = 'flex';
            if (window.initSpreadsheet) window.initSpreadsheet(); 
        };
    }

    if (closeSheetBtn) {
        closeSheetBtn.onclick = () => {
            sheetOverlay.style.display = 'none';
        };
    }

    // --- NEW: FINALIZE & SYNC ---
    const finalizeBtn = document.getElementById('finalizeTrackerBtn');
    if (finalizeBtn) {
        finalizeBtn.onclick = async () => {
            const name = document.getElementById('mgrNameInput').value;
            const instructions = document.getElementById('mgrInstructionsInput').value;

            if (!name) return alert("Manager Name Required");

            // Use your existing addManager function logic
            await addManager(name, instructions); 
        };
    }
    // --- NEW: USER INFO & LOGOUT ---
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerText = `Logged in as: ${currentUser.name} (${currentUser.role})`;
    }

    // Logout Functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});

// Expand Logic
document.getElementById('expandAddBtn').onclick = () => {
    document.getElementById('trackerExpansionPanel').classList.add('active');
};

// Spreadsheet Toggle
const sheetOverlay = document.getElementById('spreadsheetOverlay');
document.getElementById('openSheetBtn').onclick = () => {
    sheetOverlay.style.display = 'flex';
    // Load your spreadsheet module logic
    if (window.initSpreadsheet) window.initSpreadsheet(); 
};

document.getElementById('closeSheetBtn').onclick = () => {
    sheetOverlay.style.display = 'none';
};

// Finalize and Sync to User
document.getElementById('finalizeTrackerBtn').onclick = async () => {
    const data = {
        name: document.getElementById('mgrNameInput').value,
        instructions: document.getElementById('mgrInstructionsInput').value,
        createdAt: new Date().toISOString()
    };

    if (!data.name) return alert("Manager Name Required");

    try {
        await api.addTracker(data); // Sends to app.py/users.json
        alert("Tracker Sync Successful!");
        location.reload(); 
    } catch (err) {
        console.error("Sync Error:", err);
    }
};