import { requireAdmin, getUser } from "./auth.js";
requireAdmin(); // Block non-admins
let logs = []; // Global store for audit logs
// Simulate logs from backend
let logs = [
  { user: "John Doe", role: "user", phone: "09123456789", disposition: "Completed", history: "Submitted form", timestamp: "2026-01-27 10:00" },
  { user: "Jane Admin", role: "admin", phone: "09234567890", disposition: "Pending", history: "Edited manager", timestamp: "2026-01-27 11:00" },
  { user: "Alice", role: "user", phone: "09345678901", disposition: "Failed", history: "Attempted edit", timestamp: "2026-01-27 12:30" },
  { user: "Bob", role: "user", phone: "09123456789", disposition: "Pending", history: "Created record", timestamp: "2026-01-27 13:15" },
];

const tableBody = document.querySelector("#logsTable tbody");
const roleFilter = document.getElementById("roleFilter");
const dispositionFilter = document.getElementById("dispositionFilter");
const phoneFilter = document.getElementById("phoneFilter");
const clearFilters = document.getElementById("clearFilters");

function renderLogs(logsToRender) {
  tableBody.innerHTML = "";
  logsToRender.forEach(log => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.user}</td>
      <td>${log.role}</td>
      <td>${log.phone}</td>
      <td>${log.disposition}</td>
      <td>${log.history}</td>
      <td>${log.timestamp}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// Fetch logs from the backend
async function fetchLogs() {
    try {
        const res = await fetch("/api/logs");
        if (!res.ok) throw new Error("Failed to fetch logs");
        logs = await res.json();
        renderLogs(logs);
    } catch (err) {
        console.error("Error loading logs:", err);
    }
}

// Post a new log entry whenever an action occurs
async function postLog(disposition, history) {
    if (!currentUser) return;
    
    const logEntry = {
        user: currentUser.username || currentUser.name,
        role: currentUser.role,
        phone: currentUser.phone || "N/A",
        disposition: disposition,
        history: history,
        timestamp: new Date().toISOString()
    };

    try {
        await fetch("/api/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(logEntry)
        });
        fetchLogs(); // Refresh the list after posting
    } catch (err) {
        console.error("Logging failed:", err);
    }
}

// Initial render
renderLogs(logs);

// Filter function
function filterLogs() {
  const role = roleFilter.value.toLowerCase();
  const disposition = dispositionFilter.value.toLowerCase();
  const phone = phoneFilter.value.toLowerCase();

  const filtered = logs.filter(log => {
    return (
      (role === "" || log.role.toLowerCase() === role) &&
      (disposition === "" || log.disposition.toLowerCase() === disposition) &&
      (phone === "" || log.phone.includes(phone))
    );
  });
  renderLogs(filtered);
}

// Event listeners
roleFilter.addEventListener("change", filterLogs);
dispositionFilter.addEventListener("change", filterLogs);
phoneFilter.addEventListener("input", filterLogs);
clearFilters.addEventListener("click", () => {
  roleFilter.value = "";
  dispositionFilter.value = "";
  phoneFilter.value = "";
  renderLogs(logs);
});

fetch("/api/logs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    user: currentUser.name,
    role: currentUser.role,
    phone: currentUser.phone,
    disposition: actionDisposition,
    history: actionDescription,
    timestamp: new Date().toISOString()
  })
});


async function fetchLogs() {
  const res = await fetch("/api/logs");
  logs = await res.json();
  renderLogs(logs);
}

fetchLogs();

/* ---------- LOG MANAGEMENT ---------- */

function renderLogs(logsToRender) {
    const tableBody = document.querySelector("#logsTable tbody");
    if (!tableBody) return; 

    tableBody.innerHTML = "";
    logsToRender.forEach(log => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${log.user}</td>
            <td>${log.role}</td>
            <td>${log.phone}</td>
            <td>${log.disposition}</td>
            <td>${log.history}</td>
            <td>${log.timestamp}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function filterLogs() {
    // Safety check: ensure elements exist before accessing .value
    const roleEl = document.getElementById("roleFilter");
    const dispEl = document.getElementById("dispositionFilter");
    const phoneEl = document.getElementById("phoneFilter");

    if (!roleEl || !dispEl || !phoneEl) return;

    const role = roleEl.value.toLowerCase();
    const disposition = dispEl.value.toLowerCase();
    const phone = phoneEl.value.toLowerCase();

    const filtered = logs.filter(log => {
        return (
            (role === "" || log.role.toLowerCase() === role) &&
            (disposition === "" || log.disposition.toLowerCase() === disposition) &&
            (phone === "" || log.phone.includes(phone))
        );
    });
    renderLogs(filtered);
}
