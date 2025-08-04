/**
 * Research Filter and Search Functionality
 * Handles filtering by project type and text search
 */

class ResearchFilter {
  constructor() {
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.updateProjectCount();
  }

  setupElements() {
    // Filter elements
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.filterStatus = document.getElementById('filterStatus');
    this.projectCount = document.getElementById('projectCount');
    
    // Search elements
    this.searchInput = document.getElementById('searchInput');
    
    // Table elements
    this.tableBody = document.getElementById('projectsTableBody');
    this.projectRows = document.querySelectorAll('.project-row');
    this.noResults = document.getElementById('noResults');
    
    // Current state
    this.currentFilter = 'all';
    this.currentSearch = '';
  }

  setupEventListeners() {
    // Filter button listeners
    this.filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event bubbling
        const filter = e.currentTarget.getAttribute('data-filter');
        this.setActiveFilter(filter);
        this.applyFilters();
      });
    });

    // Search input listener with debounce
    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.debounce((e) => {
        this.currentSearch = e.target.value.toLowerCase().trim();
        this.applyFilters();
      }, 300));

      // Clear search on escape key
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.clearSearch();
        }
      });
    }
  }

  setActiveFilter(filter) {
    // Update button states
    this.filterButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-filter') === filter) {
        btn.classList.add('active');
      }
    });

    this.currentFilter = filter;
    this.updateFilterStatus();
  }

  updateFilterStatus() {
    const filterNames = {
      'all': 'all research projects',
      'bachelor': 'Bachelor thesis projects',
      'master': 'Master thesis projects', 
      'praktikum': 'Internship (Praktikum) projects',
      'open': 'open topics'
    };

    const statusText = `Showing ${filterNames[this.currentFilter] || 'filtered projects'}`;
    if (this.filterStatus) {
      this.filterStatus.textContent = statusText;
    }
  }

  shouldShowRow(row) {
    const category = row.getAttribute('data-category') || '';
    const status = row.getAttribute('data-status') || '';
    
    // Get text content for search
    const title = row.querySelector('.title-cell')?.textContent?.toLowerCase() || '';
    const student = row.querySelector('.student-cell')?.textContent?.toLowerCase() || '';
    const supervisor = row.querySelector('.supervisor-cell')?.textContent?.toLowerCase() || '';
    const searchText = `${title} ${student} ${supervisor}`;

    // Apply category filter
    let categoryMatch = false;
    if (this.currentFilter === 'all') {
      categoryMatch = true;
    } else if (this.currentFilter === 'open') {
      categoryMatch = status === 'open';
    } else {
      categoryMatch = category === this.currentFilter;
    }

    // Apply search filter
    const searchMatch = !this.currentSearch || searchText.includes(this.currentSearch);

    return categoryMatch && searchMatch;
  }

  // FIXED: Removed all filtering animations to prevent cell popup
  applyFilters() {
    let visibleCount = 0;
    const rows = Array.from(this.projectRows);

    // FIXED: Apply filters immediately without animations
    rows.forEach(row => {
      const shouldShow = this.shouldShowRow(row);
      
      if (shouldShow) {
        row.style.display = '';
        // REMOVED: All animation classes that were causing issues
        row.classList.remove('filtering-out', 'filtering-in');
        visibleCount++;
      } else {
        row.style.display = 'none';
        // REMOVED: All animation classes that were causing issues
        row.classList.remove('filtering-out', 'filtering-in');
      }
    });

    this.updateProjectCount(visibleCount);
    this.toggleNoResults(visibleCount === 0);
  }

  updateProjectCount(count) {
    if (this.projectCount) {
      this.projectCount.textContent = `(${count})`;
    }
  }

  toggleNoResults(show) {
    if (this.noResults) {
      this.noResults.style.display = show ? 'block' : 'none';
    }
    
    if (this.tableBody && this.tableBody.parentElement) {
      this.tableBody.parentElement.style.display = show ? 'none' : 'block';
    }
  }

  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.currentSearch = '';
      this.applyFilters();
      this.searchInput.blur();
    }
  }

  // Utility function for debouncing search input
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Public methods for external control
  filterByCategory(category) {
    this.setActiveFilter(category);
    this.applyFilters();
  }

  searchProjects(query) {
    if (this.searchInput) {
      this.searchInput.value = query;
      this.currentSearch = query.toLowerCase().trim();
      this.applyFilters();
    }
  }

  resetFilters() {
    this.setActiveFilter('all');
    this.clearSearch();
  }

  // Get current filter statistics
  getFilterStats() {
    const stats = {
      all: 0,
      bachelor: 0,
      master: 0,
      praktikum: 0,
      open: 0
    };

    this.projectRows.forEach(row => {
      const category = row.getAttribute('data-category');
      const status = row.getAttribute('data-status');
      
      // Count by degree type
      if (stats.hasOwnProperty(category)) {
        stats[category]++;
      }
      
      // Count open projects
      if (status === 'open') {
        stats.open++;
      }
      
      stats.all++;
    });

    return stats;
  }
}

// Enhanced table interactions WITHOUT problematic transforms
class TableEnhancements {
  constructor() {
    this.init();
  }

  init() {
    // Let CSS handle hover effects instead of JavaScript
    this.setupKeyboardNavigation();
    this.setupAccessibility();
  }

  setupKeyboardNavigation() {
    // Add keyboard navigation for filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach((button, index) => {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const nextIndex = e.key === 'ArrowRight' 
            ? (index + 1) % filterButtons.length
            : (index - 1 + filterButtons.length) % filterButtons.length;
          filterButtons[nextIndex].focus();
        }
      });
    });
  }

  setupAccessibility() {
    // Add ARIA labels and descriptions
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
      const filter = button.getAttribute('data-filter');
      button.setAttribute('aria-label', `Filter by ${filter}`);
    });

    // Add table accessibility
    const table = document.querySelector('.research-table');
    if (table) {
      table.setAttribute('role', 'table');
      table.setAttribute('aria-label', 'Research projects and student theses');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize research filter
  window.researchFilter = new ResearchFilter();
  
  // Initialize table enhancements
  new TableEnhancements();
  
  // Handle URL parameters for direct filtering
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');
  if (filterParam && ['all', 'bachelor', 'master', 'praktikum', 'open'].includes(filterParam)) {
    window.researchFilter.filterByCategory(filterParam);
  }
});