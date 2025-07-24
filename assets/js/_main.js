/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */

// THEME TOGGLE SYSTEM - Define globally first (pure JavaScript, no jQuery)
window.updateLogo = function(isDark) {
  const logo = document.getElementById("site-logo");
  console.log('updateLogo called with isDark:', isDark);
  console.log('Logo element found:', !!logo);
  
  if (logo && logo.dataset && logo.dataset.light && logo.dataset.dark) {
    console.log('Logo datasets:', {
      light: logo.dataset.light,
      dark: logo.dataset.dark,
      currentSrc: logo.src
    });
    
    const newSrc = isDark ? logo.dataset.dark : logo.dataset.light;
    console.log('Switching logo to:', newSrc);
    
    // Add fade effect
    logo.classList.add("fade-out");
    setTimeout(() => {
      logo.src = newSrc;
      logo.classList.remove("fade-out");
      console.log('Logo switched to:', logo.src);
    }, 150);
  } else {
    console.error('Logo element or datasets missing!', {
      logo: !!logo,
      datasets: logo ? {
        light: logo.dataset.light,
        dark: logo.dataset.dark
      } : 'Logo not found'
    });
  }
};

window.setTheme = function(theme) {
  const browserPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const savedTheme = localStorage.getItem("theme");
  const currentTheme = document.documentElement.getAttribute("data-theme");
  
  // Determine which theme to use
  const use_theme = theme || savedTheme || currentTheme || browserPref;
  
  console.log('setTheme called:', {
    requested: theme,
    saved: savedTheme,
    current: currentTheme,
    browser: browserPref,
    using: use_theme
  });

  if (use_theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    const icon = document.getElementById("theme-icon");
    if (icon) {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }
    window.updateLogo(true);
  } else {
    document.documentElement.removeAttribute("data-theme");
    const icon = document.getElementById("theme-icon");
    if (icon) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    }
    window.updateLogo(false);
  }
};

window.toggleTheme = function() {
  const current_theme = document.documentElement.getAttribute("data-theme");
  const new_theme = current_theme === "dark" ? "light" : "dark";
  
  console.log('toggleTheme: switching from', current_theme, 'to', new_theme);
  
  localStorage.setItem("theme", new_theme);
  window.setTheme(new_theme);
  return new_theme;
};

window.testThemeToggle = function() {
  console.log('=== Manual Theme Toggle Test ===');
  console.log('Current theme before:', document.documentElement.getAttribute("data-theme"));
  const result = window.toggleTheme();
  console.log('Theme after toggle:', result);
  return result;
};

// IMMEDIATE INITIALIZATION (pure JavaScript)
(function() {
  console.log('=== IMMEDIATE THEME INITIALIZATION ===');
  
  // Initialize theme immediately when script loads
  setTimeout(() => {
    window.setTheme();
  }, 50);
  
  // Also initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(() => {
        console.log('DOM ready - reinitializing theme');
        window.setTheme();
      }, 100);
    });
  }
})();

// Bind events when page loads (pure JavaScript)
window.addEventListener('load', function() {
  setTimeout(() => {
    console.log('=== BINDING THEME TOGGLE EVENTS ===');
    
    // Get all possible theme toggle elements
    const toggleElements = document.querySelectorAll('#theme-toggle, #theme-icon, #theme-toggle a');
    
    console.log('Found toggle elements:', toggleElements.length);
    
    // Bind click event to each element
    toggleElements.forEach((element, index) => {
      console.log(`Binding to element ${index + 1}:`, element.id || element.tagName);
      element.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Theme toggle clicked on:', this.id || this.tagName);
        window.toggleTheme();
      });
    });
    
    // Also use event delegation as backup
    document.addEventListener('click', function(e) {
      if (e.target.matches('#theme-toggle, #theme-icon, #theme-toggle a')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Theme toggle clicked via delegation!');
        window.toggleTheme();
      }
    });
    
    console.log('Theme toggle binding complete');
  }, 200);
});

// OS preference change listener
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem("theme")) {
    window.setTheme(e.matches ? 'dark' : 'light');
  }
});

// Now start jQuery code
$(document).ready(function () {

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
  if (typeof fitvids === 'function') {
    fitvids();
  }

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
    if ( ! $img.parent().is('a.image-pool') ) {
      $('<a>')
        .addClass('image-popup')
        .attr('href', $img.attr('src'))
        .insertBefore($img)
        .append($img);
    }
  });

  // Magnific-Popup options (only if plugin is loaded)
  if ($.fn.magnificPopup) {
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
  }

  // Additional jQuery binding for theme toggle (backup)
  setTimeout(() => {
    console.log('=== JQUERY BACKUP BINDING ===');
    $('#theme-toggle, #theme-toggle a, #theme-icon').off('click.themeBackup').on('click.themeBackup', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Theme toggle clicked (jQuery backup)!');
      window.toggleTheme();
    });
    
    console.log('jQuery backup binding complete');
  }, 400);

  // Debug info
  setTimeout(() => {
    console.log('=== THEME SYSTEM DEBUG ===');
    console.log('Theme toggle element found:', $('#theme-toggle').length);
    console.log('Theme icon element found:', $('#theme-icon').length);
    console.log('Current theme:', document.documentElement.getAttribute("data-theme"));
    console.log('Current logo src:', document.getElementById('site-logo') ? document.getElementById('site-logo').src : 'Logo not found');
    console.log('Test with: toggleTheme() or testThemeToggle()');
  }, 500);

});