// Document Viewer Controller
class DocumentViewer {
    constructor() {
        this.currentDocument = null;

        // Viewer modal
        this.viewerModal = document.getElementById('viewerModal');
        this.viewerTitle = document.getElementById('viewerTitle');
        this.documentInfo = document.getElementById('documentInfo');
        this.documentDisplay = document.getElementById('documentDisplay');

        // Edit modal
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editForm');

        // Delete modal
        this.deleteModal = document.getElementById('deleteModal');

        this.init();
    }

    init() {
        this.setupViewerModal();
        this.setupEditModal();
        this.setupDeleteModal();
    }

    setupViewerModal() {
        // Close button
        document.getElementById('closeViewerModal').addEventListener('click', () => {
            this.closeViewerModal();
        });

        // Backdrop click
        this.viewerModal.addEventListener('click', (e) => {
            if (e.target === this.viewerModal) {
                this.closeViewerModal();
            }
        });

        // Action buttons
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadDocument();
        });

        document.getElementById('editBtn').addEventListener('click', () => {
            this.openEditModal();
        });

        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.openDeleteModal();
        });
    }

    setupEditModal() {
        // Close buttons
        document.getElementById('closeEditModal').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.closeEditModal();
        });

        // Backdrop click
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });

        // Form submission
        this.editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpdate();
        });
    }

    setupDeleteModal() {
        // Close buttons
        document.getElementById('closeDeleteModal').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        // Backdrop click
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) {
                this.closeDeleteModal();
            }
        });

        // Confirm delete
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.handleDelete();
        });
    }

    openDocument(document) {
        this.currentDocument = document;
        this.viewerTitle.textContent = document.original_filename;

        // Display document info
        const date = new Date(document.upload_date).toLocaleDateString();
        const sizeKB = (document.file_size / 1024).toFixed(1);

        this.documentInfo.innerHTML = `
            <div style="display: grid; gap: 0.5rem;">
                <div><strong>Category:</strong> ${this.getCategoryName(document.category)}</div>
                <div><strong>Uploaded:</strong> ${date}</div>
                <div><strong>Size:</strong> ${sizeKB} KB</div>
                ${document.document_number ? `<div><strong>Document Number:</strong> ${this.escapeHtml(document.document_number)}</div>` : ''}
                ${document.description ? `<div><strong>Description:</strong> ${this.escapeHtml(document.description)}</div>` : ''}
            </div>
        `;

        // Display document
        this.displayDocument(document);

        // Open modal
        this.viewerModal.classList.add('active');
    }

    displayDocument(document) {
        const fileType = document.file_type.toLowerCase();

        if (fileType === 'pdf') {
            // Display PDF in iframe
            this.documentDisplay.innerHTML = `
                <iframe src="/api/documents/${document.id}/download" frameborder="0"></iframe>
            `;
        } else {
            // Display image
            this.documentDisplay.innerHTML = `
                <img src="/api/documents/${document.id}/download" alt="${this.escapeHtml(document.original_filename)}">
            `;
        }
    }

    closeViewerModal() {
        this.viewerModal.classList.remove('active');
        this.currentDocument = null;
    }

    openEditModal() {
        if (!this.currentDocument) return;

        // Populate form
        document.getElementById('editDocumentId').value = this.currentDocument.id;
        document.getElementById('editCategorySelect').value = this.currentDocument.category;
        document.getElementById('editDescriptionInput').value = this.currentDocument.description || '';
        document.getElementById('editDocumentNumberInput').value = this.currentDocument.document_number || '';

        // Open modal
        this.editModal.classList.add('active');
    }

    closeEditModal() {
        this.editModal.classList.remove('active');
        this.editForm.reset();
    }

    async handleUpdate() {
        const docId = document.getElementById('editDocumentId').value;
        const formData = {
            category: document.getElementById('editCategorySelect').value,
            description: document.getElementById('editDescriptionInput').value,
            document_number: document.getElementById('editDocumentNumberInput').value
        };

        try {
            const response = await fetch(`/api/documents/${docId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                window.app.showToast('Document updated successfully!', 'success');

                // Update current document
                this.currentDocument = result.data;

                // Dispatch event
                document.dispatchEvent(new CustomEvent('documentUpdated'));

                // Close modals
                this.closeEditModal();
                this.closeViewerModal();
            } else {
                throw new Error(result.error || 'Update failed');
            }
        } catch (error) {
            console.error('Update error:', error);
            window.app.showToast(error.message || 'Failed to update document', 'error');
        }
    }

    openDeleteModal() {
        if (!this.currentDocument) return;

        document.getElementById('deleteDocumentName').textContent = this.currentDocument.original_filename;
        this.deleteModal.classList.add('active');
    }

    closeDeleteModal() {
        this.deleteModal.classList.remove('active');
    }

    async handleDelete() {
        if (!this.currentDocument) return;

        try {
            const response = await fetch(`/api/documents/${this.currentDocument.id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                window.app.showToast('Document deleted successfully!', 'success');

                // Dispatch event
                document.dispatchEvent(new CustomEvent('documentDeleted'));

                // Close all modals
                this.closeDeleteModal();
                this.closeViewerModal();
            } else {
                throw new Error(result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            window.app.showToast(error.message || 'Failed to delete document', 'error');
        }
    }

    downloadDocument() {
        if (!this.currentDocument) return;

        // Create temporary link to trigger download
        const link = document.createElement('a');
        link.href = `/api/documents/${this.currentDocument.id}/download`;
        link.download = this.currentDocument.original_filename;
        link.click();
    }

    getCategoryName(category) {
        const names = {
            'personal-ids': 'Personal IDs',
            'educational-docs': 'Educational Docs',
            'work-experience': 'Work Experience Letters',
            'resumes': 'Resumes',
            'invoices': 'Online Purchase Invoices',
            'insurance': 'Insurance Docs',
            'bank-statements': 'Bank Statements',
            'others': 'Others'
        };

        return names[category] || category;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.documentViewer = new DocumentViewer();
});
