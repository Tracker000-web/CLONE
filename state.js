/* ---------- state.js ---------- */
export const state = {
    isLoggedIn: false,
    currentUser: null,
    currentActiveManager: null,
    
    // Persistence Layer
    managers: JSON.parse(localStorage.getItem("managerData")) || [
        { id: 1, name: "Manager A", rows: [["", "", "Pending", ""]], notes: [""] }
    ],
    
    settings: JSON.parse(localStorage.getItem("dashboardSettings")) || {
        theme: "dark", 
        notifications: true, 
        sideMenu: "left"
    },

    saveToLocal() {
        localStorage.setItem("managerData", JSON.stringify(this.managers));
        localStorage.setItem("dashboardSettings", JSON.stringify(this.settings));
    }
};

export const State = {
    currentUser: null,
    currentActiveManager: null,
    managers: JSON.parse(localStorage.getItem("managerData")) || [
        { id: 1, name: "Manager A", rows: [["", "", "Pending", ""]], notes: [""], logs: [] }
    ],
    settings: JSON.parse(localStorage.getItem("dashboardSettings")) || {
        theme: "dark", notifications: true, sideMenu: "left"
    }
};

export function saveData() { localStorage.setItem("managerData", JSON.stringify(state.managers)); }

export const globalstate = {
    currentUser: null,
    settings: { theme: 'light', notifications: true },
    managers: [],
    syncQueue: []
};
