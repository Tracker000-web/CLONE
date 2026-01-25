/* 1. ELEMENTS & DATA INITIALIZATION */
document.body.style.backgroundImage = "none";

// UI Containers (Moved to top-level for global access)
const loginSection = document.getElementById('login-section');
const rememberMeCheckbox = document.getElementById('rememberMe');
const forgotLink = document.querySelector('.forgot-link');
const forgotModal = document.getElementById('forgot-modal');
const modalCancel = document.getElementById('modal-cancel');
const modalOk = document.getElementById('modal-ok');
const resetEmailInput = document.getElementById('reset-email-input');
const signupSection = document.getElementById('signup-section');
const app = document.getElementById("app");

// Auth Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById("signup-form"); 
const toSignupLink = document.getElementById('to-signup');
const toLoginLink = document.getElementById('to-login');

// Form Inputs
const passwordInput = document.querySelector('#password');
const emailInput = document.getElementById('email');

// Sidebar & Settings
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const managerList = document.getElementById("managerList");
const managerSearch = document.getElementById("managerSearch");
const addManagerBtn = document.getElementById("addManagerBtn");
const sheetContainer = document.getElementById("sheetContainer");
const sheetTitle = document.getElementById("sheetTitle");
const notifyToggle = document.getElementById("notifyToggle");

const spreadsheetTemplate = ["Phone numbers", "Task", "Status", "Remarks"];

let isLoggedIn = false;
let currentUser = null; 
let currentActiveManager = null;

/* 2. BACKEND API FUNCTIONS */

async function checkSession() {
    try {
        const res = await fetch("http://127.0.0.1:5000/api/me");
        if (!res.ok) throw new Error("Not logged in");
        currentUser = await res.json();
        
        if (currentUser && currentUser.role === "admin") {
            document.querySelectorAll(".admin-only").forEach(el => {
                el.style.setProperty('display', 'block', 'important');
            });
        }
    } catch (err) {
        console.warn("Backend offline or Session missing. Features restricted.");
    }
}

async function addUserToDatabase(name, email, password) {
    const userData = { username: name, email: email, password: password };
    try {
        const response = await fetch('http://127.0.0.1:5000/add-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const result = await response.json();
        console.log("User Saved:", result);
    } catch (error) {
        console.error("Connection failed. User saved locally only.");
        const localUsers = JSON.parse(localStorage.getItem("localUsers") || "[]");
        localUsers.push(userData);
        localStorage.setItem("localUsers", JSON.stringify(localUsers));
    }
}

async function saveCellToBackend(managerId, row, col, value) {
    if (!currentUser) return;
    try {
        await fetch("http://127.0.0.1:5000/api/save-cell", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Role": currentUser.role
            },
            body: JSON.stringify({
                manager_id: managerId,
                row: row,
                col: col,
                value: value
            })
        });
    } catch (error) {
        console.error("Failed to sync with MySQL:", error);
    }
}

/* 3. CORE UTILITY FUNCTIONS */

let managers = JSON.parse(localStorage.getItem("managerData")) || [
    { id: 1, name: "Manager A", rows: [["", "", "Pending", ""]], notes: [""], timestamps: [[]], logs: [] }
];

let settings = JSON.parse(localStorage.getItem("dashboardSettings")) || {
    theme: "dark", notifications: true, sideMenu: "left"
};

function saveData() { localStorage.setItem("managerData", JSON.stringify(managers)); }
function saveSettings() { localStorage.setItem("dashboardSettings", JSON.stringify(settings)); }

function applySettings() {
    document.body.className = `theme-${settings.theme}`;
    notifyToggle.checked = settings.notifications;
    sideMenu.classList.toggle("right", settings.sideMenu === "right");
    
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = (settings.theme === 'dark') ? "#121212" : "#f4f7f6";
}

/* 4. SPREADSHEET LOGIC */

function getColumnLabel(index) {
    let label = "";
    while (index >= 0) {
        label = String.fromCharCode((index % 26) + 65) + label;
        index = Math.floor(index / 26) - 1;
    }
    return label;
}

function loadSpreadsheet(manager) {
    if (!manager) return;
    currentActiveManager = manager; 
    localStorage.setItem("activeManagerId", manager.id);
    
    sheetTitle.textContent = `${manager.name} — Activity Log`;
    sheetContainer.innerHTML = "";
    
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const totalCols = manager.rows[0] ? manager.rows[0].length : 4;

    for (let i = 0; i < totalCols; i++) {
        const th = document.createElement("th");
        th.textContent = getColumnLabel(i);
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    manager.rows.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");
        row.forEach((cell, colIndex) => {
            const td = document.createElement("td");
            td.textContent = cell;
            td.contentEditable = true;
            
            td.onblur = () => {
                if (td.textContent !== row[colIndex]) {
                    row[colIndex] = td.textContent;
                    saveData();
                    if (currentUser && currentUser.role === "admin") {
                        saveCellToBackend(manager.id, rowIndex, colIndex, td.textContent);
                    }
                }
            };
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    sheetContainer.appendChild(table);
}

function renderManagers(filter = "") {
    managerList.innerHTML = "";
    managers.filter(m => m.name.toLowerCase().includes(filter.toLowerCase())).forEach(m => {
        const div = document.createElement("div");
        div.className = "manager-item";
        div.innerHTML = `<span>${m.name}</span>`;
        div.onclick = () => { loadSpreadsheet(m); overlay.click(); };
        managerList.appendChild(div);
    });
}

/* 5. INITIALIZATION & EVENTS */

/* 5. INITIALIZATION & EVENTS */

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    applySettings();
    renderManagers();

    const lastId = localStorage.getItem("activeManagerId");
    const lastManager = managers.find(m => m.id == lastId);
    if (lastManager) loadSpreadsheet(lastManager);

    // Switch to Sign Up view
    if (toSignupLink) {
        toSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.style.display = 'none';
            signupSection.style.display = 'block';
        });
    }

    // Switch to Login view
    if (toLoginLink) {
        toLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupSection.style.display = 'none';
            loginSection.style.display = 'block';
        });
    }

    // Check for remembered credentials
    const savedEmail = localStorage.getItem('rememberedEmail');
    const wasChecked = localStorage.getItem('rememberMeChecked');

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }
    
    if (wasChecked === 'true' && rememberMeCheckbox) {
        rememberMeCheckbox.checked = true;
    }
});

// --- AUTH SUBMISSIONS ---

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (rememberMeCheckbox && rememberMeCheckbox.checked) {
            localStorage.setItem('rememberedEmail', emailInput.value);
            localStorage.setItem('rememberMeChecked', 'true');
        } else {
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberMeChecked');
        }

        isLoggedIn = true;
        loginSection.style.display = "none";
        app.style.display = "block";
        applySettings();
    });
}

// --- FORGOT PASSWORD MODAL LOGIC ---
forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    console.log("Modal should show now");
    forgotModal.style.setProperty('display', 'flex', 'important');
});

if (modalOk) {
    modalOk.onclick = async () => {
        const email = resetEmailInput.value;
        if (email) {
            forgotModal.style.display = 'none';
            resetEmailInput.value = '';

            try {
                const response = await fetch('http://127.0.0.1:5000/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });
                const result = await response.json();
                alert(result.message || "Reset link sent!");
            } catch (err) {
                alert("Backend offline. Could not send reset email.");
            }
        } else {
            alert("Please enter a valid email address.");
        }
    };
}

if (modalCancel) {
    modalCancel.onclick = () => {
        forgotModal.style.display = 'none';
        resetEmailInput.value = '';
    };
}

// --- SIGNUP SUBMISSION ---

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Fixed: IDs match your HTML now (reg-name-input, etc.)
        const name = document.getElementById('reg-name-input').value;
        const email = document.getElementById('reg-email-input').value;
        const pass = document.getElementById('reg-password-input').value;

        await addUserToDatabase(name, email, pass);
        alert("Registration Successful! Please Sign In.");
        
        signupSection.style.display = 'none';
        loginSection.style.display = 'block';
    });
}

// --- UI CONTROLS ---

menuBtn.onclick = () => { sideMenu.classList.add("open"); overlay.classList.add("active"); };
overlay.onclick = () => { sideMenu.classList.remove("open"); overlay.classList.remove("active"); };
settingsBtn.onclick = () => { settingsPanel.style.display = settingsPanel.style.display === "block" ? "none" : "block"; };
managerSearch.oninput = () => renderManagers(managerSearch.value);

document.querySelectorAll(".themeBtn").forEach(btn => {
    btn.onclick = () => { 
        settings.theme = btn.dataset.theme; 
        applySettings(); 
        saveSettings(); 
    };
});

if (document.getElementById("addRowBtn")) {
    document.getElementById("addRowBtn").onclick = () => {
        if (!currentActiveManager) return;
        currentActiveManager.rows.push(["", "", "", ""]);
        saveData();
        loadSpreadsheet(currentActiveManager);
    };
}