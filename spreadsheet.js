/* ---------- spreadsheet.js ---------- */
import { State } from './state.js';
import { API } from './api.js';

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
        const colCount = manager.rows[0]?.length || 4;
        for (let i = 0; i < colCount; i++) {
            const th = document.createElement("th");
            th.textContent = this.getColumnLabel(i);
            headerRow.appendChild(th);
        }
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

                td.onblur = () => {
                    if (td.textContent !== row[colIndex]) {
                        row[colIndex] = td.textContent;
                        State.saveToLocal();
                        if (isAdmin) {
                            API.saveCell(manager.id, rowIndex, colIndex, td.textContent, State.currentUser.role);
                        }
                    }
                    if (isAdmin) {
                        API.saveCell(manager.id, rowIndex, colIndex, td.textContent, State.currentUser.role)
                        .then(() => UI.showToast("Cell synced to cloud", "success"))
                          .catch(() => UI.showToast("Sync failed - saved locally", "info"));
                    }
                };
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    },

    getColumnLabel(index) {
        let label = "";
        while (index >= 0) {
            label = String.fromCharCode((index % 26) + 65) + label;
            index = Math.floor(index / 26) - 1;
        }
        return label;
    }
};