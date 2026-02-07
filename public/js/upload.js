// Upload Modal Controller
class UploadController {
    constructor() {
        this.modal = document.getElementById('uploadModal');
        this.form = document.getElementById('uploadForm');
        this.fileInput = document.getElementById('fileInput');
        this.progressContainer = document.getElementById('uploadProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.submitBtn = document.getElementById('submitUploadBtn');

        this.init();
    }

    init() {
        // Open modal button
        document.getElementById('uploadBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Close modal buttons
        document.getElementById('closeUploadModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelUploadBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpload();
        });

        // File input change
        this.fileInput.addEventListener('change', () => {
            this.validateFile();
        });
    }

    openModal() {
        this.modal.classList.add('active');
        this.resetForm();
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.resetForm();
    }

    resetForm() {
        this.form.reset();
        this.progressContainer.style.display = 'none';
        this.progressFill.style.width = '0%';
        this.submitBtn.disabled = false;
    }

    validateFile() {
        const file = this.fileInput.files[0];

        if (!file) {
            return false;
        }

        // Check file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            window.app.showToast('Invalid file type. Only PDF, JPG, and PNG are allowed.', 'error');
            this.fileInput.value = '';
            return false;
        }

        // Check file size (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            window.app.showToast('File size exceeds 10MB limit.', 'error');
            this.fileInput.value = '';
            return false;
        }

        return true;
    }

    async handleUpload() {
        if (!this.validateFile()) {
            return;
        }

        const formData = new FormData(this.form);

        try {
            // Disable submit button
            this.submitBtn.disabled = true;

            // Show progress
            this.progressContainer.style.display = 'block';
            this.progressText.textContent = 'Uploading...';

            // Simulate progress (since we can't track real upload progress easily)
            this.simulateProgress();

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Complete progress
                this.progressFill.style.width = '100%';
                this.progressText.textContent = 'Upload complete!';

                // Show success message
                window.app.showToast('Document uploaded successfully!', 'success');

                // Dispatch event
                document.dispatchEvent(new CustomEvent('documentUploaded'));

                // Close modal after short delay
                setTimeout(() => {
                    this.closeModal();
                }, 1000);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            window.app.showToast(error.message || 'Failed to upload document', 'error');

            // Reset progress
            this.progressContainer.style.display = 'none';
            this.submitBtn.disabled = false;
        }
    }

    simulateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) {
                progress = 90;
                clearInterval(interval);
            }
            this.progressFill.style.width = `${progress}%`;
        }, 200);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.uploadController = new UploadController();
});
