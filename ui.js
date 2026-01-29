/* ---------- ui.js ---------- */
export const UI = {
    // 1. Toast Notification System
    showToast(message, type = 'info') {
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

        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.ontransitionend = () => toast.remove();
        }, 3000);
    },

    // 2. Network Status Indicator
    updateConnectionStatus(isOnline) {
        const container = document.getElementById('connection-status');
        if (!container) return; // Guard clause if element doesn't exist yet
        
        const text = container.querySelector('.status-text');
        
        if (isOnline) {
            container.classList.replace('offline', 'online') || container.classList.add('online');
            text.textContent = "Online";
        } else {
            container.classList.replace('online', 'offline') || container.classList.add('offline');
            text.textContent = "Offline";
        }
    },

    // 3. Image Processing (Base64)
    async handleImageUpload(file) {
        // Validation: Limit to 2MB to keep MySQL LONGTEXT performance snappy
        const MAX_SIZE = 2 * 1024 * 1024; 
        if (file.size > MAX_SIZE) {
            this.showToast("File too large! Max 2MB allowed.", "error");
            throw new Error("File size limit exceeded");
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result); 
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }
};