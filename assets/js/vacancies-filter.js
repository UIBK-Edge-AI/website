/**
 * Open Positions Filter and Search Functionality
 * Handles filtering by position type and text search
 */

class OpenPositionsFilter {
  constructor() {
    this.init();
  }

  init() {
    console.log('🔧 OpenPositionsFilter initializing...');
    this.setupElements();
    this.setupEventListeners();
    this.sortInitialRows(); // Sort rows on page load
    this.updatePositionCount();
    this.debugInfo();
  }

  debugInfo() {
    console.log('📊 OpenPositionsFilter Debug Info:');
    console.log('Filter buttons found:', this.filterButtons.length);
    console.log('Position rows found:', this.positionRows.length);
    console.log('Search input found:', !!this.searchInput);
    console.log('Table body found:', !!this.tableBody);
    
    // Debug position rows data
    this.positionRows.forEach((row, index) => {
      console.log(`Row ${index}:`, {
        category: row.getAttribute('data-category'),
        status: row.getAttribute('data-status'),
        position: row.getAttribute('data-position'),
        visible: row.style.display !== 'none'
      });
    });
  }

  setupElements() {
    // Filter elements
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.positionCount = document.getElementById('positionCount');
    
    // Search elements
    this.searchInput = document.getElementById('searchInput');
    
    // Table elements
    this.tableBody = document.getElementById('positionsTableBody');
    this.positionRows = document.querySelectorAll('.position-row');
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

  sortInitialRows() {
    console.log('📋 Sorting initial rows by status...');
    const rows = Array.from(this.positionRows);
    const sortedRows = this.sortRowsByStatus(rows);
    
    // Reorder rows in the DOM
    sortedRows.forEach(row => {
      if (this.tableBody) {
        this.tableBody.appendChild(row);
      }
    });
    
    // Update positionRows reference to reflect new order
    this.positionRows = document.querySelectorAll('.position-row');
    console.log('✅ Initial sorting complete');
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
    const position = row.querySelector('.position-cell')?.textContent?.toLowerCase() || '';
    const area = row.querySelector('.area-cell')?.textContent?.toLowerCase() || '';
    const searchText = `${position} ${area}`;

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

  applyFilters() {
    console.log('🔄 Applying filters. Current filter:', this.currentFilter);
    let visibleCount = 0;
    const rows = Array.from(this.positionRows);

    // First, sort rows by status: open > filled > closed > others
    const sortedRows = this.sortRowsByStatus(rows);

    sortedRows.forEach((row, index) => {
      const shouldShow = this.shouldShowRow(row);
      
      if (shouldShow) {
        row.style.display = '';
        row.classList.remove('filtering-out', 'filtering-in');
        visibleCount++;
        console.log(`✅ Showing row ${index}`);
        
        // Reorder in DOM to maintain sort order
        if (this.tableBody) {
          this.tableBody.appendChild(row);
        }
      } else {
        row.style.display = 'none';
        row.classList.remove('filtering-out', 'filtering-in');
        console.log(`❌ Hiding row ${index}`);
      }
    });

    console.log(`📊 Filter result: ${visibleCount} rows visible out of ${rows.length}`);
    this.updatePositionCount(visibleCount);
    this.toggleNoResults(visibleCount === 0);
  }

  sortRowsByStatus(rows) {
    // Define status priority: open (1) > filled (2) > closed (3) > others (4)
    const statusPriority = {
      'open': 1,
      'filled': 2,
      'closed': 3
    };

    return rows.sort((a, b) => {
      const statusA = (a.getAttribute('data-status') || '').toLowerCase();
      const statusB = (b.getAttribute('data-status') || '').toLowerCase();
      
      const priorityA = statusPriority[statusA] || 4;
      const priorityB = statusPriority[statusB] || 4;
      
      // Sort by priority (lower number = higher priority)
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same status, maintain original order or sort by title
      const positionA = a.getAttribute('data-position') || '';
      const positionB = b.getAttribute('data-position') || '';
      return positionA.localeCompare(positionB);
    });
  }

  updatePositionCount(count) {
    if (this.positionCount) {
      this.positionCount.textContent = `(${count})`;
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

  searchPositions(query) {
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
  console.log('📋 DOM loaded, initializing OpenPositionsFilter...');
  
  window.openPositionsFilter = new OpenPositionsFilter();
  
  console.log('✅ OpenPositionsFilter initialized');
  
  // Handle URL parameters for direct filtering
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');
  if (filterParam && ['all', 'postdoc', 'phd'].includes(filterParam)) {
    console.log('🔗 Applying URL filter:', filterParam);
    window.openPositionsFilter.filterByCategory(filterParam);
  }
});
