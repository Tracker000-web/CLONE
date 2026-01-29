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

/* ---------- ui.js Addition ---------- */
export const UI = {
    // ... existing showToast ...

    updateConnectionStatus(isOnline) {
        const container = document.getElementById('connection-status');
        const text = container.querySelector('.status-text');
        
        if (isOnline) {
            container.classList.remove('offline');
            container.classList.add('online');
            text.textContent = "Online";
        } else {
            container.classList.remove('online');
            container.classList.add('offline');
            text.textContent = "Offline";
        }
    }
};

/* ---------- ui.js addition ---------- */
export const UI = {
    // ... existing methods ...

    async handleImageUpload(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result); // This is the Base64 string
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }
};