/**
 * Teaching Filter and Search Functionality
 */

class TeachingFilter {
  constructor() {
    this.init();
  }

  init() {
    console.log('🔧 TeachingFilter initializing...');
    this.setupElements();
    this.setupEventListeners();
    this.updateCourseCount();
    this.debugInfo();
  }

  debugInfo() {
    console.log('📊 TeachingFilter Debug Info:');
    console.log('Filter buttons found:', this.filterButtons.length);
    console.log('Course rows found:', this.courseRows.length);
    console.log('Search input found:', !!this.searchInput);
    console.log('Table body found:', !!this.tableBody);
    
    // Debug course rows data
    this.courseRows.forEach((row, index) => {
      console.log(`Row ${index}:`, {
        category: row.getAttribute('data-category'),
        semester: row.getAttribute('data-semester'),
        title: row.getAttribute('data-title'),
        visible: row.style.display !== 'none'
      });
    });
  }

  setupElements() {
    // Filter elements
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.filterStatus = document.getElementById('filterStatus');
    this.courseCount = document.getElementById('courseCount');
    
    // Search elements
    this.searchInput = document.getElementById('searchInput');
    
    // Table elements
    this.tableBody = document.getElementById('coursesTableBody');
    this.courseRows = document.querySelectorAll('.course-row');
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
      'all': 'all courses',
      'ba-cs': 'Bachelor courses',
      'master': 'Master courses'
    };

    const statusText = `Showing ${filterNames[this.currentFilter] || 'filtered courses'}`;
    if (this.filterStatus) {
      this.filterStatus.textContent = statusText;
    }
  }

  shouldShowRow(row) {
    const category = row.getAttribute('data-category') || '';
    const semester = row.getAttribute('data-semester') || '';
    
    console.log('🔍 Checking row:', {
      category,
      semester,
      currentFilter: this.currentFilter
    });
    
    // Get text content for search
    const title = row.querySelector('.title-cell')?.textContent?.toLowerCase() || '';
    const instructor = row.querySelector('.instructor-cell')?.textContent?.toLowerCase() || '';
    const room = row.querySelector('.room-cell')?.textContent?.toLowerCase() || '';
    const degree = row.querySelector('.degree-cell')?.textContent?.toLowerCase() || '';
    const searchText = `${title} ${instructor} ${room} ${degree} ${semester}`;

    // Apply category filter
    let categoryMatch = false;
    if (this.currentFilter === 'all') {
      categoryMatch = true;
    } else {
      categoryMatch = category === this.currentFilter;
    }

    // Apply search filter
    const searchMatch = !this.currentSearch || searchText.includes(this.currentSearch);

    const shouldShow = categoryMatch && searchMatch;
    console.log('👀 Should show row:', shouldShow, { categoryMatch, searchMatch });
    
    return shouldShow;
  }

  // FIXED: Removed all filtering animations to prevent table movement
  applyFilters() {
    console.log('🔄 Applying filters. Current filter:', this.currentFilter);
    let visibleCount = 0;
    const rows = Array.from(this.courseRows);

    // FIXED: Apply filters immediately without animations
    rows.forEach((row, index) => {
      const shouldShow = this.shouldShowRow(row);
      
      if (shouldShow) {
        row.style.display = '';
        // REMOVED: All animation classes that were causing table movement
        row.classList.remove('filtering-out', 'filtering-in');
        visibleCount++;
        console.log(`✅ Showing row ${index}`);
      } else {
        row.style.display = 'none';
        // REMOVED: All animation classes that were causing table movement
        row.classList.remove('filtering-out', 'filtering-in');
        console.log(`❌ Hiding row ${index}`);
      }
    });

    console.log(`📊 Filter result: ${visibleCount} rows visible out of ${rows.length}`);
    this.updateCourseCount(visibleCount);
    this.toggleNoResults(visibleCount === 0);
  }

  updateCourseCount(count) {
    if (this.courseCount) {
      this.courseCount.textContent = `(${count})`;
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

  searchCourses(query) {
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
      master: 0
    };

    this.courseRows.forEach(row => {
      const category = row.getAttribute('data-category');
      
      // Count by degree type
      if (stats.hasOwnProperty(category)) {
        stats[category]++;
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
    // Let CSS handle ALL hover effects to prevent layout shifts
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
    const table = document.querySelector('.courses-table');
    if (table) {
      table.setAttribute('role', 'table');
      table.setAttribute('aria-label', 'Teaching courses');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('📋 DOM loaded, initializing TeachingFilter...');
  
  // Initialize teaching filter
  window.teachingFilter = new TeachingFilter();
  
  // Initialize table enhancements
  new TableEnhancements();
  
  console.log('✅ TeachingFilter initialized');
  
  // Handle URL parameters for direct filtering
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');
  if (filterParam && ['all', 'ba-cs', 'master'].includes(filterParam)) {
    console.log('🔗 Applying URL filter:', filterParam);
    window.teachingFilter.filterByCategory(filterParam);
  }
});