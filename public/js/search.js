// Search Controller
class SearchController {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.clearBtn = document.getElementById('clearSearchBtn');
        this.debounceTimer = null;
        this.debounceDelay = 500; // 500ms delay

        this.init();
    }

    init() {
        // Search input with debounce
        this.searchInput.addEventListener('input', () => {
            this.handleSearch();
        });

        // Clear search button
        this.clearBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // Enter key to search immediately
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(this.debounceTimer);
                this.performSearch();
            }
        });
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.trim();

        // Show/hide clear button
        if (searchTerm) {
            this.clearBtn.style.display = 'block';
        } else {
            this.clearBtn.style.display = 'none';
        }

        // Debounce search
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.performSearch();
        }, this.debounceDelay);
    }

    performSearch() {
        const searchTerm = this.searchInput.value.trim();

        if (window.app) {
            window.app.updateSearchFilter(searchTerm);
        }
    }

    clearSearch() {
        this.searchInput.value = '';
        this.clearBtn.style.display = 'none';
        this.performSearch();
        this.searchInput.focus();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.searchController = new SearchController();
});
