Router.js
export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // run on load
}

function handleRoute() {
    const hash = location.hash;

    // Example: #/trackers/12
    const trackerMatch = hash.match(/^#\/trackers\/(\d+)/);

    if (trackerMatch) {
        const managerId = trackerMatch[1];
        loadTrackerPage(managerId);
        return;
    }

    if (hash === '#/trackers') {
        showTrackersHome();
        return;
    }

    // default
    showDashboard();
}
