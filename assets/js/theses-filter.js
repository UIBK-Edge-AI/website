/**
 * Theses Filter and Search Functionality - DEBUG VERSION
 * Handles filtering by project type and text search
 */

class ThesesFilter {
  constructor() {
    this.init();
  }

  init() {
    console.log('🔧 ThesesFilter initializing...');
    this.setupElements();
    this.setupEventListeners();
    this.updateProjectCount();
    this.debugInfo();
  }

  debugInfo() {
    console.log('📊 ThesesFilter Debug Info:');
    console.log('Filter buttons found:', this.filterButtons.length);
    console.log('Project rows found:', this.projectRows.length);
    console.log('Search input found:', !!this.searchInput);
    console.log('Table body found:', !!this.tableBody);
    
    // Debug project rows data
    this.projectRows.forEach((row, index) => {
      console.log(`Row ${index}:`, {
        category: row.getAttribute('data-category'),
        status: row.getAttribute('data-status'),
        title: row.getAttribute('data-title'),
        visible: row.style.display !== 'none'
      });
    });
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
        e.preventDefault();
        e.stopPropagation();
        const filter = e.currentTarget.getAttribute('data-filter');
        console.log('🔘 Filter button clicked:', filter);
        this.setActiveFilter(filter);
        this.applyFilters();
      });
    });

    // Search input listener with debounce
    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.debounce((e) => {
        this.currentSearch = e.target.value.toLowerCase().trim();
        console.log('🔍 Search input changed:', this.currentSearch);
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
    console.log('🎯 Setting active filter:', filter);
    
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
      'all': 'all theses projects',
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
    
    console.log('🔍 Checking row:', {
      category,
      status,
      currentFilter: this.currentFilter
    });
    
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

    const shouldShow = categoryMatch && searchMatch;
    console.log('👀 Should show row:', shouldShow, { categoryMatch, searchMatch });
    
    return shouldShow;
  }

  applyFilters() {
    console.log('🔄 Applying filters. Current filter:', this.currentFilter);
    let visibleCount = 0;
    const rows = Array.from(this.projectRows);

    rows.forEach((row, index) => {
      const shouldShow = this.shouldShowRow(row);
      
      if (shouldShow) {
        row.style.display = '';
        row.classList.remove('filtering-out', 'filtering-in');
        visibleCount++;
        console.log(`✅ Showing row ${index}`);
      } else {
        row.style.display = 'none';
        row.classList.remove('filtering-out', 'filtering-in');
        console.log(`❌ Hiding row ${index}`);
      }
    });

    console.log(`📊 Filter result: ${visibleCount} rows visible out of ${rows.length}`);
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
    console.log('🎯 External filter request:', category);
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('📋 DOM loaded, initializing ThesesFilter...');
  
  // Create the correct global variable
  window.thesesFilter = new ThesesFilter();
  
  // Also create researchFilter alias for compatibility (if needed by other code)
  window.researchFilter = window.thesesFilter;
  
  console.log('✅ ThesesFilter initialized');
  
  // Handle URL parameters for direct filtering
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');
  if (filterParam && ['all', 'bachelor', 'master', 'praktikum', 'open'].includes(filterParam)) {
    console.log('🔗 Applying URL filter:', filterParam);
    window.thesesFilter.filterByCategory(filterParam);
  }
});