import { requireAdmin, getUser } from "./auth.js";

requireAdmin(); // Block non-admins
const currentUser = getUser(); // Get the logged-in user

// 1. Initialize logs with dummy data (ONLY DECLARE ONCE)
let logs = [
  { user: "John Doe", role: "user", phone: "09123456789", disposition: "Completed", history: "Submitted form", timestamp: "2026-01-27 10:00" },
  { user: "Jane Admin", role: "admin", phone: "09234567890", disposition: "Pending", history: "Edited manager", timestamp: "2026-01-27 11:00" },
  { user: "Alice", role: "user", phone: "09345678901", disposition: "Failed", history: "Attempted edit", timestamp: "2026-01-27 12:30" },
  { user: "Bob", role: "user", phone: "09123456789", disposition: "Pending", history: "Created record", timestamp: "2026-01-27 13:15" },
];

// 2. Fetch logic
async function fetchLogs() {
    try {
        const res = await fetch("/api/logs");
        if (!res.ok) throw new Error("Failed to fetch logs");
        logs = await res.json();
        renderLogs(logs);
    } catch (err) {
        console.error("Error loading logs:", err);
        renderLogs(logs); // Fallback to dummy data if server is down
    }
}

// 3. Render logic
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

// 4. Filter logic
function filterLogs() {
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

// 5. Initialize listeners
document.addEventListener("DOMContentLoaded", () => {
    fetchLogs();

    const roleFilter = document.getElementById("roleFilter");
    const dispositionFilter = document.getElementById("dispositionFilter");
    const phoneFilter = document.getElementById("phoneFilter");
    const clearFilters = document.getElementById("clearFilters");

    if (roleFilter) roleFilter.addEventListener("change", filterLogs);
    if (dispositionFilter) dispositionFilter.addEventListener("change", filterLogs);
    if (phoneFilter) phoneFilter.addEventListener("input", filterLogs);
    
    if (clearFilters) {
        clearFilters.addEventListener("click", () => {
            roleFilter.value = "";
            dispositionFilter.value = "";
            phoneFilter.value = "";
            renderLogs(logs);
        });
    }
});