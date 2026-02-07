// Main Application State and Controller
class DocumentOrganizer {
    constructor() {
        this.documents = [];
        this.currentFilter = { category: 'all', search: '' };
        this.apiBase = '/api/documents';

        this.init();
    }

    init() {
        this.loadDocuments();
        this.loadStats();
        this.setupCategoryFilter();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Refresh documents when upload/edit/delete happens
        document.addEventListener('documentUploaded', () => {
            this.loadDocuments();
            this.loadStats();
        });

        document.addEventListener('documentUpdated', () => {
            this.loadDocuments();
        });

        document.addEventListener('documentDeleted', () => {
            this.loadDocuments();
            this.loadStats();
        });
    }

    setupCategoryFilter() {
        const pills = document.querySelectorAll('.pill');

        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                // Remove active class from all pills
                pills.forEach(p => p.classList.remove('active'));

                // Add active class to clicked pill
                pill.classList.add('active');

                // Update filter
                const category = pill.dataset.category;
                this.currentFilter.category = category;

                // Reload documents
                this.loadDocuments();
            });
        });
    }

    async loadDocuments() {
        try {
            this.showLoading();

            const params = new URLSearchParams();

            if (this.currentFilter.category && this.currentFilter.category !== 'all') {
                params.append('category', this.currentFilter.category);
            }

            if (this.currentFilter.search) {
                params.append('search', this.currentFilter.search);
            }

            const response = await fetch(`${this.apiBase}?${params}`);
            const result = await response.json();

            if (result.success) {
                this.documents = result.data;
                this.renderDocuments();
            } else {
                this.showToast('Failed to load documents', 'error');
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            this.showToast('Failed to load documents', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats/overview`);
            const result = await response.json();

            if (result.success) {
                const stats = result.data;
                document.getElementById('totalDocs').textContent = stats.total_documents;

                const sizeMB = (stats.total_size_bytes / (1024 * 1024)).toFixed(2);
                document.getElementById('totalSize').textContent = `${sizeMB} MB`;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderDocuments() {
        const grid = document.getElementById('documentsGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.documents.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        grid.innerHTML = this.documents.map(doc => this.createDocumentCard(doc)).join('');

        // Add click handlers
        grid.querySelectorAll('.document-card').forEach(card => {
            card.addEventListener('click', () => {
                const docId = parseInt(card.dataset.id);
                const document = this.documents.find(d => d.id === docId);
                if (document) {
                    window.documentViewer.openDocument(document);
                }
            });
        });
    }

    createDocumentCard(doc) {
        const icon = this.getFileIcon(doc.file_type);
        const date = new Date(doc.upload_date).toLocaleDateString();
        const sizeKB = (doc.file_size / 1024).toFixed(1);
        const categoryName = this.getCategoryName(doc.category);

        return `
            <div class="document-card" data-id="${doc.id}">
                <div class="document-icon">${icon}</div>
                <div class="document-name">${this.escapeHtml(doc.original_filename)}</div>
                <div class="document-meta">
                    ${date} • ${sizeKB} KB
                </div>
                ${doc.description ? `<div class="document-description">${this.escapeHtml(doc.description)}</div>` : ''}
                ${doc.document_number ? `<div class="document-meta">📋 ${this.escapeHtml(doc.document_number)}</div>` : ''}
                <div class="document-category-badge">${categoryName}</div>
            </div>
        `;
    }

    getFileIcon(fileType) {
        const icons = {
            'pdf': '📄',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️'
        };

        return icons[fileType.toLowerCase()] || '📄';
    }

    getCategoryName(category) {
        const names = {
            'personal-ids': 'Personal IDs',
            'educational-docs': 'Educational',
            'work-experience': 'Work',
            'resumes': 'Resumes',
            'invoices': 'Invoices',
            'insurance': 'Insurance',
            'bank-statements': 'Bank',
            'others': 'Others'
        };

        return names[category] || category;
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('documentsGrid').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('documentsGrid').style.display = 'grid';
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateSearchFilter(searchTerm) {
        this.currentFilter.search = searchTerm;
        this.loadDocuments();
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DocumentOrganizer();
});
