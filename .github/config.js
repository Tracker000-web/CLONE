export let state = {
    isLoggedIn: false,
    currentUser: null,
    currentActiveManager: null,
    managers: JSON.parse(localStorage.getItem("managerData")) || [
        { id: 1, name: "Manager A", rows: [["", "", "Pending", ""]], notes: [""], timestamps: [[]], logs: [] }
    ],
    settings: JSON.parse(localStorage.getItem("dashboardSettings")) || {
        theme: "dark", notifications: true, sideMenu: "left"
    }
};

export const spreadsheetTemplate = ["Phone numbers", "Task", "Status", "Remarks"];

export function saveData() { localStorage.setItem("managerData", JSON.stringify(state.managers)); }
export function saveSettings() { localStorage.setItem("dashboardSettings", JSON.stringify(state.settings)); }