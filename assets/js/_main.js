/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */


// Complete dropdown functionality for Teaching and Research
(function() {
  'use strict';

  var _dropdownsInitialized = false;

  function initializeDropdowns() {
    if (_dropdownsInitialized) return;
    var dropdownItems = document.querySelectorAll('.masthead__menu-item.dropdown-item');
    if (dropdownItems.length === 0) return;
    _dropdownsInitialized = true;

    dropdownItems.forEach(function(item) {
      var toggle = item.querySelector('.dropdown-toggle');
      var dropdown = item.querySelector('.dropdown-menu');
      if (!toggle || !dropdown) return;

      item.setAttribute('data-dropdown-initialized', 'true');
      var hoverTimeout;

      // Desktop only: open/close on hover
      item.addEventListener('mouseenter', function() {
        if (window.innerWidth <= 767) return;
        clearTimeout(hoverTimeout);
        dropdownItems.forEach(function(other) {
          if (other !== item) other.classList.remove('open');
        });
        item.classList.add('open');
      });

      item.addEventListener('mouseleave', function() {
        if (window.innerWidth <= 767) return;
        hoverTimeout = setTimeout(function() { item.classList.remove('open'); }, 200);
      });

      dropdown.addEventListener('mouseenter', function() {
        if (window.innerWidth <= 767) return;
        clearTimeout(hoverTimeout);
      });

      dropdown.addEventListener('mouseleave', function() {
        if (window.innerWidth <= 767) return;
        hoverTimeout = setTimeout(function() { item.classList.remove('open'); }, 200);
      });

      // Mobile only: tap toggle to expand/collapse inline
      toggle.addEventListener('click', function(e) {
        if (window.innerWidth > 767) return;
        e.preventDefault();
        e.stopPropagation();
        var isOpen = item.classList.contains('open');
        dropdownItems.forEach(function(other) { other.classList.remove('open'); });
        if (!isOpen) item.classList.add('open');
      });

      // Mobile: close nav overlay when a submenu link is followed
      dropdown.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          if (window.innerWidth > 767) return;
          var vl = document.querySelector('.visible-links');
          if (vl) vl.classList.remove('show-mobile-menu');
          document.body.classList.remove('overflow--hidden');
          dropdownItems.forEach(function(d) { d.classList.remove('open'); });
        });
      });
    });

    // Close dropdowns (and mobile overlay) when tapping outside the masthead
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.masthead')) {
        dropdownItems.forEach(function(d) { d.classList.remove('open'); });
        if (window.innerWidth <= 767) {
          var vl = document.querySelector('.visible-links');
          if (vl) vl.classList.remove('show-mobile-menu');
          document.body.classList.remove('overflow--hidden');
        }
      }
    });
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

  // Initialize once after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDropdowns);
  } else {
    initializeDropdowns();
  }

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
        
        if (window.innerWidth <= 767) {
          if (visible_links) {
            var opening = !visible_links.classList.contains('show-mobile-menu');
            visible_links.classList.toggle('show-mobile-menu');
            document.body.classList.toggle('overflow--hidden', opening);
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
