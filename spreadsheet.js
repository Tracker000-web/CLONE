/* ---------- spreadsheet.js ---------- */
import { State } from './state.js';
import { api } from './api.js';
import { UI } from './ui.js';

export const Spreadsheet = {
    renderManagers(filter = "") {
        const list = document.getElementById("managerList");
        list.innerHTML = "";
        
        State.managers
            .filter(m => m.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(m => {
                const div = document.createElement("div");
                div.className = "manager-item";
                div.innerHTML = `<span>${m.name}</span>`;
                div.onclick = () => {
                    this.loadSpreadsheet(m);
                    document.getElementById("overlay").click();
                };
                list.appendChild(div);
            });
    },

    loadSpreadsheet(manager) {
        if (!manager) return;
        State.currentActiveManager = manager;
        localStorage.setItem("activeManagerId", manager.id);

        const container = document.getElementById("sheetContainer");
        document.getElementById("sheetTitle").textContent = `${manager.name} — Activity Log`;
        container.innerHTML = "";

        const table = document.createElement("table");
        const isAdmin = State.currentUser?.role === 'admin';

        // Build Table Header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const headers = ["Phone numbers", "Task", "Status", "Remarks"];
        
        headers.forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Build Table Body
        const tbody = document.createElement("tbody");
        manager.rows.forEach((row, rowIndex) => {
            const tr = document.createElement("tr");
            row.forEach((cellValue, colIndex) => {
                const td = document.createElement("td");
                td.textContent = cellValue;
                td.contentEditable = isAdmin;

                td.onblur = async () => {
                    if (td.textContent !== row[colIndex]) {
                        const oldValue = row[colIndex];
                        row[colIndex] = td.textContent;
                        State.saveToLocal();

                        if (isAdmin) {
                            try {
                                await API.saveCell(manager.id, rowIndex, colIndex, td.textContent, State.currentUser.role);
                                UI.showToast("Cell synced to cloud", "success");
                            } catch (err) {
                                // Handled by API module's internal queueing, 
                                // but we notify the user here.
                                UI.showToast("Offline: Saved locally", "info");
                            }
                        }
                    }
                };
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    },

    updateDispositionsMetrics(rows) {
        const counts = {
            "No Answer": 0, 
            "Voicemail": 0, 
            "Not in Service": 0, 
            "Left Message": 0,
            "Call Backs": 0, 
            "Appointments": 0, 
            "Preset Appointment": 0,
            "Confirmed Preset Appointment": 0, "Number Dials": rows.length
        };

        rows.forEach(row => {
            const disposition = row[2]; 
            if (counts.hasOwnProperty(disposition)) counts[disposition]++;
        });

        this.renderMetricsUI(counts);
    },

    renderMetricsUI(counts) {
        const container = document.querySelector(".subtitle");
        if (!container) return; // Safety check to prevent app.js:63 errors
        container.innerHTML = `
            <h3>DISPOSITIONS</h3>
            <ul>
                <li>Dials: ${counts["Number Dials"]}</li>
                <li>Appointments: ${counts["Appointments"]}</li>
                <li>Confirmed: ${counts["Confirmed Preset Appointment"]}</li>
            </ul>
        `;
    },

    downloadCSV() {
        if (!State.currentActiveManager) return;
        
        const manager = State.currentActiveManager;
        const headers = ["Phone numbers", "Task", "Status", "Remarks"];
        
        const csvContent = [
            headers.join(","), 
            ...manager.rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        link.setAttribute("href", url);
        link.setAttribute("download", `${manager.name}_export.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        UI.showToast("CSV Exported!", "success");
    }
};