/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */


// Complete dropdown functionality for Teaching and Research
(function() {
  'use strict';

  function initializeDropdowns() {
    console.log('🔧 Initializing dropdowns...');
    const dropdownItems = document.querySelectorAll('.masthead__menu-item.dropdown-item');
    console.log('📍 Found dropdown items:', dropdownItems.length);
    
    if (dropdownItems.length === 0) {
      console.warn('⚠️ No dropdown items found!');
      return;
    }
    
    dropdownItems.forEach(function(item, index) {
      const toggle = item.querySelector('.dropdown-toggle');
      const dropdown = item.querySelector('.dropdown-menu');
      const title = toggle ? toggle.textContent.trim() : 'Unknown';
      
      console.log(`🎯 Dropdown ${index} (${title}):`, {
        item: item,
        toggle: toggle,
        dropdown: dropdown,
        hasPersistClass: item.classList.contains('persist'),
        isVisible: item.offsetParent !== null
      });
      
      if (toggle && dropdown) {
        let hoverTimeout;

        // Add debugging attributes
        item.setAttribute('data-dropdown-initialized', 'true');
        item.setAttribute('data-dropdown-title', title);
        console.log(`✅ Setting up ${title} dropdown`);

        // Show dropdown on mouseenter
        item.addEventListener('mouseenter', function(e) {
          console.log(`🖱️ Mouse ENTER on ${title} dropdown`);
          clearTimeout(hoverTimeout);
          
          // Close other dropdowns
          dropdownItems.forEach(function(otherItem) {
            if (otherItem !== item) {
              otherItem.classList.remove('open');
            }
          });
          
          // Open current dropdown
          item.classList.add('open');
          console.log(`✨ Added OPEN class to ${title} dropdown`);
          
          // Force visibility (override any CSS conflicts)
          dropdown.style.display = 'block !important';
          dropdown.style.opacity = '1 !important';
          dropdown.style.visibility = 'visible !important';
          dropdown.style.transform = 'translateY(0) !important';
          dropdown.style.pointerEvents = 'auto !important';
          dropdown.style.zIndex = '9999 !important';
          console.log(`🎨 Applied inline styles to ${title} dropdown`);
        });
        
        // Hide dropdown on mouseleave
        item.addEventListener('mouseleave', function(e) {
          console.log(`🖱️ Mouse LEAVE on ${title} dropdown`);
          hoverTimeout = setTimeout(function() {
            item.classList.remove('open');
            console.log(`❌ Removed OPEN class from ${title} dropdown`);
            
            // Reset inline styles
            dropdown.style.display = '';
            dropdown.style.opacity = '';
            dropdown.style.visibility = '';
            dropdown.style.transform = '';
            dropdown.style.pointerEvents = '';
            dropdown.style.zIndex = '';
          }, 300);
        });

        // Keep dropdown open when hovering over dropdown menu
        dropdown.addEventListener('mouseenter', function(e) {
          console.log(`🖱️ Mouse ENTER on ${title} dropdown MENU`);
          clearTimeout(hoverTimeout);
          item.classList.add('open');
        });

        dropdown.addEventListener('mouseleave', function(e) {
          console.log(`🖱️ Mouse LEAVE on ${title} dropdown MENU`);
          hoverTimeout = setTimeout(function() {
            item.classList.remove('open');
            dropdown.style.display = '';
            dropdown.style.opacity = '';
            dropdown.style.visibility = '';
            dropdown.style.transform = '';
            dropdown.style.pointerEvents = '';
            dropdown.style.zIndex = '';
          }, 300);
        });

        console.log(`🎉 ${title} dropdown initialized successfully!`);
      } else {
        console.warn(`⚠️ ${title} dropdown missing elements:`, {
          hasToggle: !!toggle,
          hasDropdown: !!dropdown
        });
      }
    });
    
    console.log('🏁 All dropdowns initialization complete!');
  }


  // Enhanced dropdown navigation handler
  window.handleDropdownNavigation = function(filter, event) {
    console.log('🔄 Handling dropdown navigation:', filter);
    const currentPath = window.location.pathname;
    const targetUrl = event.target.href || event.target.closest('a')?.href;
    
    console.log('📍 Current path:', currentPath);
    console.log('🎯 Target URL:', targetUrl);
    
    // Allow normal navigation to specific pages (courses and theses)
    if (targetUrl && (
      targetUrl.includes('/theses') || 
      targetUrl.includes('theses') ||
      targetUrl.includes('/courses') ||
      targetUrl.includes('courses')
    )) {
      console.log('📚 Navigating to specific page - allowing normal navigation');
      return true; // Allow normal navigation
    }
    
    // Only apply filtering logic if it's actually a filter (not a page navigation)
    if (currentPath.includes('/teaching/') && 
        !targetUrl?.includes('/theses') && 
        !targetUrl?.includes('/courses') &&
        filter && 
        ['all', 'bachelor', 'master'].includes(filter)) {
      console.log('🎓 Teaching page - applying filter');
      event.preventDefault();
      
      if (window.teachingFilter) {
        window.teachingFilter.filterByCategory(filter);
      } else {
        console.warn('⚠️ teachingFilter not found, trying alternative method');
        // Alternative: trigger filter buttons
        const filterBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (filterBtn) {
          filterBtn.click();
        }
      }
      
      // Close dropdown
      document.querySelectorAll('.dropdown-item').forEach(function(item) {
        item.classList.remove('open');
      });
      
      const newUrl = `/teaching/${filter !== 'all' ? '?filter=' + filter : ''}`;
      window.history.pushState({filter: filter}, '', newUrl);
      
      return false;
    }
    
    // For all other cases, allow normal navigation
    console.log('🔗 Normal navigation to:', targetUrl);
    return true;
  };

  // Initialize dropdowns with multiple fallback methods
  console.log('🚀 Starting dropdown system...');
  console.log('📊 DOM ready state:', document.readyState);
  
  // Method 1: Immediate if DOM is ready
  if (document.readyState !== 'loading') {
    console.log('📋 DOM ready - initializing immediately');
    setTimeout(initializeDropdowns, 100);
  }
  
  // Method 2: DOM Content Loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM Content Loaded event');
    setTimeout(initializeDropdowns, 200);
  });

  // Method 3: Window Load (complete fallback)
  window.addEventListener('load', function() {
    console.log('🔄 Window loaded event');
    setTimeout(initializeDropdowns, 300);
  });

  // Method 4: Ultimate fallback with multiple retries
  let retryCount = 0;
  const maxRetries = 5;
  
  function retryInitialization() {
    retryCount++;
    console.log(`⏰ Retry attempt ${retryCount}/${maxRetries}`);
    
    const dropdownItems = document.querySelectorAll('.masthead__menu-item.dropdown-item');
    if (dropdownItems.length > 0) {
      console.log('✅ Found dropdown items, initializing...');
      initializeDropdowns();
    } else if (retryCount < maxRetries) {
      console.log('⏳ No dropdown items found, retrying in 1 second...');
      setTimeout(retryInitialization, 1000);
    } else {
      console.error('❌ Failed to find dropdown items after all retries');
    }
  }
  
  // Start retry sequence after 2 seconds
  setTimeout(retryInitialization, 2000);

})();


$(document).ready(function () {
  // detect OS/browser preference
  const browserPref = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

  // Function to update logo with fade effect
  function updateLogo(isDark) {
    const logo = document.getElementById("site-logo");
    if (logo && logo.dataset.light && logo.dataset.dark) {
      logo.classList.add("fade-out");
      setTimeout(() => {
        logo.src = isDark ? logo.dataset.dark : logo.dataset.light;
        logo.classList.remove("fade-out");
      }, 150);
    }
  }

  // Set the theme on page load or when explicitly called
  var setTheme = function (theme) {
    const use_theme =
      theme ||
      localStorage.getItem("theme") ||
      $("html").attr("data-theme") ||
      browserPref;

    if (use_theme === "dark") {
      $("html").attr("data-theme", "dark");
      $("#theme-icon").removeClass("fa-sun").addClass("fa-moon");
      updateLogo(true);
    } else if (use_theme === "light") {
      $("html").removeAttr("data-theme");
      $("#theme-icon").removeClass("fa-moon").addClass("fa-sun");
      updateLogo(false);
    }
  };

  
  setTheme();

  // if user hasn't chosen a theme, follow OS changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    });

  // Toggle the theme manually
  var toggleTheme = function () {
    const current_theme = $("html").attr("data-theme");
    const new_theme = current_theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", new_theme);
    setTheme(new_theme);
  };

  $('#theme-toggle').on('click', toggleTheme);

  // These should be the same as the settings in _variables.scss
  const scssLarge = 925; // pixels

  // Sticky footer
  var bumpIt = function () {
    $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
  },
    didResize = false;

  bumpIt();

  $(window).resize(function () {
    didResize = true;
  });
  setInterval(function () {
    if (didResize) {
      didResize = false;
      bumpIt();
    }
  }, 250);

  // FitVids init
  fitvids();

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function () {
    $(".author__urls").fadeToggle("fast", function () { });
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // Restore the follow menu if toggled on a window resize
  jQuery(window).on('resize', function () {
    if ($('.author__urls.social-icons').css('display') == 'none' && $(window).width() >= scssLarge) {
      $(".author__urls").css('display', 'block')
    }
  });

  // init smooth scroll, this needs to be slightly more than then fixed masthead height
  $("a").smoothScroll({ 
    offset: -75, // needs to match $masthead-height
    preventDefault: false,
  }); 

  // add lightbox class to all image links
  $("a[href$='.jpg'],\
  a[href$='.jpeg'],\
  a[href$='.JPG'],\
  a[href$='.png'],\
  a[href$='.gif'],\
  a[href$='.webp']")
      .not(':has(img)')
      .addClass("image-popup");

  // Wrap images in lightbox links
  $('p > img').not('.emoji').each(function() {
    var $img = $(this);
    if ( ! $img.parent().is('a.image-popup') ) {
      $('<a>')
        .addClass('image-popup')
        .attr('href', $img.attr('src'))
        .insertBefore($img)
        .append($img);
    }
  });

  // Magnific-Popup options
  $(".image-popup").magnificPopup({
    type: 'image',
    tLoading: 'Loading image #%curr%...',
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0, 1]
    },
    image: {
      tError: '<a href="%url%">Image #%curr%</a> could not be loaded.',
    },
    removalDelay: 500,
    mainClass: 'mfp-zoom-in',
    callbacks: {
      beforeOpen: function() {
        this.st.image.markup = this.st.image.markup.replace('mfp-figure', 'mfp-figure mfp-with-anim');
      }
    },
    closeOnContentClick: true,
    midClick: true
  });

});

document.addEventListener('DOMContentLoaded', function() {
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const visibleLinks = document.querySelector('.visible-links');
  
  if (mobileToggle && visibleLinks) {
    mobileToggle.addEventListener('click', function() {
      visibleLinks.classList.toggle('show-mobile-menu');
    });
  }
});

// Mobile Menu Toggle Fix
// Add this to your site's JavaScript or in a <script> tag

document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Mobile menu fix initializing...');
  
  // Force show masthead elements on mobile
  function forceMobileDisplay() {
    const masthead = document.querySelector('.masthead');
    const greedy_nav = document.querySelector('.greedy-nav');
    const visible_links = document.querySelector('.visible-links');
    const nav_button = document.querySelector('#site-nav button');
    
    if (window.innerWidth <= 767) {
      // Force display critical navigation elements
      if (masthead) {
        masthead.style.display = 'block';
        masthead.style.visibility = 'visible';
      }
      if (greedy_nav) {
        greedy_nav.style.display = 'flex';
        greedy_nav.style.visibility = 'visible';
      }
      if (visible_links) {
        visible_links.style.display = 'flex';
        visible_links.style.visibility = 'visible';
      }
      if (nav_button) {
        nav_button.style.display = 'block';
        nav_button.style.visibility = 'visible';
      }
    }
  }
  
  // Handle mobile menu toggle for very small screens
  function handleMobileMenuToggle() {
    const nav_button = document.querySelector('#site-nav button');
    const visible_links = document.querySelector('.visible-links');
    const hidden_links = document.querySelector('.hidden-links');
    
    if (nav_button) {
      nav_button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔘 Mobile menu toggle clicked');
        
        if (window.innerWidth <= 480) {
          // Toggle mobile menu on very small screens
          if (visible_links) {
            visible_links.classList.toggle('show-mobile-menu');
          }
          if (hidden_links) {
            hidden_links.classList.toggle('hidden');
          }
          this.classList.toggle('close');
        }
      });
    }
  }
  
  // Override the greedy navigation behavior on mobile
  function overrideGreedyNav() {
    // Disable greedy nav on mobile
    if (window.innerWidth <= 767) {
      const updateNav = window.updateNav;
      if (typeof updateNav === 'function') {
        // Override the updateNav function to prevent hiding on mobile
        window.updateNav = function() {
          if (window.innerWidth > 767) {
            // Only run original updateNav on desktop
            updateNav.call(this);
          } else {
            // On mobile, ensure elements stay visible
            forceMobileDisplay();
          }
        };
      }
    }
  }
  
  // Initialize fixes
  forceMobileDisplay();
  handleMobileMenuToggle();
  overrideGreedyNav();
  
  // Re-apply fixes on resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      forceMobileDisplay();
      overrideGreedyNav();
    }, 100);
  });
  
  // Re-apply fixes on orientation change
  if (screen.orientation) {
    screen.orientation.addEventListener('change', function() {
      setTimeout(function() {
        forceMobileDisplay();
      }, 300);
    });
  }
  
  console.log('✅ Mobile menu fix initialized');
});
