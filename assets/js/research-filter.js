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
        const filter = e.currentTarget.getAttribute('data-filter');
        this.setActiveFilter(filter);
        this.applyFilters();
      });
    });

    // Search input listener with debounce
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
      'praktikum': 'Internship (Praktikum) projects'
    };

    const statusText = `Showing ${filterNames[this.currentFilter] || 'filtered projects'}`;
    this.filterStatus.textContent = statusText;
  }

  applyFilters() {
    let visibleCount = 0;
    const rows = Array.from(this.projectRows);

    // First, hide all rows with animation
    rows.forEach(row => {
      row.classList.add('filtering-out');
    });

    setTimeout(() => {
      rows.forEach(row => {
        const shouldShow = this.shouldShowRow(row);
        
        if (shouldShow) {
          row.style.display = '';
          row.classList.remove('filtering-out');
          row.classList.add('filtering-in');
          visibleCount++;
          
          // Remove animation class after animation completes
          setTimeout(() => {
            row.classList.remove('filtering-in');
          }, 400);
        } else {
          row.style.display = 'none';
          row.classList.remove('filtering-out', 'filtering-in');
        }
      });

      this.updateProjectCount(visibleCount);
      this.toggleNoResults(visibleCount === 0);
    }, 150);
  }

  shouldShowRow(row) {
    const category = row.getAttribute('data-category');
    const title = row.getAttribute('data-title') || '';
    const student = row.getAttribute('data-student') || '';
    const supervisor = row.getAttribute('data-supervisor') || '';

    // Check category filter
    const categoryMatch = this.currentFilter === 'all' || category === this.currentFilter;

    // Check search filter
    const searchMatch = !this.currentSearch || 
      title.includes(this.currentSearch) ||
      student.includes(this.currentSearch) ||
      supervisor.includes(this.currentSearch);

    return categoryMatch && searchMatch;
  }

  updateProjectCount(count = null) {
    if (count === null) {
      count = Array.from(this.projectRows).filter(row => 
        row.style.display !== 'none'
      ).length;
    }

    if (count === 0) {
      this.projectCount.textContent = 'No projects found';
    } else if (count === 1) {
      this.projectCount.textContent = '1 project';
    } else {
      this.projectCount.textContent = `${count} projects`;
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
    this.searchInput.value = '';
    this.currentSearch = '';
    this.applyFilters();
    this.searchInput.blur();
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
    this.searchInput.value = query;
    this.currentSearch = query.toLowerCase().trim();
    this.applyFilters();
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
      praktikum: 0
    };

    this.projectRows.forEach(row => {
      const category = row.getAttribute('data-category');
      if (stats.hasOwnProperty(category)) {
        stats[category]++;
      }
      stats.all++;
    });

    return stats;
  }
}

// Enhanced table interactions
class TableEnhancements {
  constructor() {
    this.init();
  }

  init() {
    this.setupRowHoverEffects();
    this.setupKeyboardNavigation();
    this.setupAccessibility();
  }

  setupRowHoverEffects() {
    const rows = document.querySelectorAll('.project-row');
    
    rows.forEach(row => {
      // Add smooth hover animations
      row.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });

      // Handle click to navigate (for mobile)
      row.addEventListener('click', function(e) {
        // Only if not clicking on a link
        if (!e.target.closest('a')) {
          const link = this.querySelector('.project-link');
          if (link) {
            window.location.href = link.href;
          }
        }
      });
    });
  }

  setupKeyboardNavigation() {
    const table = document.querySelector('.research-table');
    if (!table) return;

    // Make table rows focusable
    const rows = table.querySelectorAll('.project-row');
    rows.forEach((row, index) => {
      row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'button');
      
      row.addEventListener('keydown', (e) => {
        switch(e.key) {
          case 'Enter':
          case ' ':
            e.preventDefault();
            const link = row.querySelector('.project-link');
            if (link) link.click();
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.focusRow(index + 1, rows);
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.focusRow(index - 1, rows);
            break;
        }
      });
    });
  }

  focusRow(index, rows) {
    const visibleRows = Array.from(rows).filter(row => 
      row.style.display !== 'none'
    );
    
    if (index >= 0 && index < visibleRows.length) {
      visibleRows[index].focus();
    }
  }

  setupAccessibility() {
    // Add ARIA labels and descriptions
    const table = document.querySelector('.research-table');
    if (table) {
      table.setAttribute('role', 'table');
      table.setAttribute('aria-label', 'Research projects and student theses');
    }

    // Add sort indicators to headers (for future sorting functionality)
    const headers = document.querySelectorAll('.research-table th');
    headers.forEach(header => {
      header.setAttribute('role', 'columnheader');
      header.setAttribute('scope', 'col');
    });
  }
}

// Animation utilities
class AnimationUtils {
  static fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      if (progress < 1) {
        element.style.opacity = progress;
        requestAnimationFrame(animate);
      } else {
        element.style.opacity = '1';
      }
    }
    
    requestAnimationFrame(animate);
  }

  static slideDown(element, duration = 300) {
    element.style.maxHeight = '0';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    const height = element.scrollHeight;
    let start = null;
    
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      if (progress < 1) {
        element.style.maxHeight = (height * progress) + 'px';
        requestAnimationFrame(animate);
      } else {
        element.style.maxHeight = 'none';
        element.style.overflow = 'visible';
      }
    }
    
    requestAnimationFrame(animate);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize filter system
  window.researchFilter = new ResearchFilter();
  
  // Initialize table enhancements
  window.tableEnhancements = new TableEnhancements();
  
  // Add some useful global functions
  window.filterResearch = function(category) {
    window.researchFilter.filterByCategory(category);
  };
  
  window.searchResearch = function(query) {
    window.researchFilter.searchProjects(query);
  };
  
  window.resetResearchFilters = function() {
    window.researchFilter.resetFilters();
  };
  
  // Performance optimization: Use Intersection Observer for lazy loading
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
    
    // Observe project rows for animation
    document.querySelectorAll('.project-row').forEach(row => {
      observer.observe(row);
    });
  }
  
  // Add smooth scrolling to anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  console.log('Research filter system initialized successfully');
});