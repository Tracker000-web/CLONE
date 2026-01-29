/* ---------- ui.js ---------- */
export const UI = {
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Animate out and remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.ontransitionend = () => toast.remove();
        }, 3000);
    }
};