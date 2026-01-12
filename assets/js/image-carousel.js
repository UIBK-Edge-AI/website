/**
 * Image Carousel for Home Page
 * Automatically inserts carousel after Motivation section and handles sliding functionality
 */

(function() {
  'use strict';

  function initCarousel() {
    // Check if we're on a page with carousel images
    var pageContent = document.querySelector('.page__content');
    if (!pageContent) return;

    // Find the Motivation section
    var motivationSection = document.getElementById('motivation');
    if (!motivationSection) {
      console.log('Motivation section not found - carousel will not be inserted');
      return;
    }

    // Get carousel data from data attribute (will be set by Jekyll)
    var carouselData = window.carouselImages;
    if (!carouselData || !carouselData.length) {
      console.log('No carousel images defined');
      return;
    }

    // Build carousel HTML
    var carouselHTML = buildCarouselHTML(carouselData);

    // Find the paragraph after Motivation heading and insert carousel after it
    var nextElement = motivationSection.nextElementSibling;
    if (nextElement && nextElement.tagName === 'P') {
      var carouselDiv = document.createElement('div');
      carouselDiv.innerHTML = carouselHTML;
      nextElement.parentNode.insertBefore(carouselDiv.firstElementChild, nextElement.nextSibling);

      // Initialize carousel functionality after a short delay
      setTimeout(function() {
        setupCarouselControls();
      }, 10000);
    }
  }

  function buildCarouselHTML(images) {
    var slidesHTML = '';
    images.forEach(function(slide) {
      var captionHTML = slide.caption ? '<div class="carousel-caption">' + slide.caption + '</div>' : '';
      slidesHTML += '<div class="carousel-slide">' +
                    '<img src="' + slide.image + '" alt="' + (slide.caption || 'Slide image') + '">' +
                    captionHTML +
                    '</div>';
    });

    return '<div class="carousel-container" id="carousel">' +
           '<div class="carousel-wrapper">' +
           '<div class="carousel-slides" id="carouselSlides">' +
           slidesHTML +
           '</div>' +
           '</div>' +
           '<button class="carousel-btn carousel-btn-prev" id="carouselPrev" aria-label="Previous slide">‹</button>' +
           '<button class="carousel-btn carousel-btn-next" id="carouselNext" aria-label="Next slide">›</button>' +
           '<div class="carousel-dots" id="carouselDots"></div>' +
           '</div>';
  }

  function setupCarouselControls() {
    var currentSlide = 0;
    var slides = document.querySelectorAll('.carousel-slide');
    var totalSlides = slides.length;
    var slidesContainer = document.getElementById('carouselSlides');
    var dotsContainer = document.getElementById('carouselDots');
    var prevBtn = document.getElementById('carouselPrev');
    var nextBtn = document.getElementById('carouselNext');
    var autoPlayInterval;

    if (!slides.length || !slidesContainer || !dotsContainer) {
      console.error('Carousel elements not found');
      return;
    }

    // Create dots
    dotsContainer.innerHTML = '';
    for (var i = 0; i < totalSlides; i++) {
      var dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.setAttribute('data-slide', i);
      dotsContainer.appendChild(dot);
    }

    var dots = document.querySelectorAll('.carousel-dot');

    function updateSlidePosition() {
      slidesContainer.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';

      // Update dots
      dots.forEach(function(dot, index) {
        if (index === currentSlide) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    function moveSlide(direction) {
      currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
      updateSlidePosition();
      resetAutoPlay();
    }

    function goToSlide(index) {
      currentSlide = index;
      updateSlidePosition();
      resetAutoPlay();
    }

    function autoPlay() {
      autoPlayInterval = setInterval(function() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlidePosition();
      }, 10000);
    }

    function resetAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
      autoPlay();
    }

    // Add button event listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        moveSlide(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        moveSlide(1);
      });
    }

    // Add dot click listeners
    dots.forEach(function(dot) {
      dot.addEventListener('click', function(e) {
        e.preventDefault();
        var slideIndex = parseInt(this.getAttribute('data-slide'), 10);
        goToSlide(slideIndex);
      });
    });

    // Initialize
    updateSlidePosition();
    autoPlay();

    // Pause on hover
    var carousel = document.getElementById('carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', function() {
        if (autoPlayInterval) {
          clearInterval(autoPlayInterval);
        }
      });
      carousel.addEventListener('mouseleave', function() {
        autoPlay();
      });
    }

    console.log('Carousel initialized with ' + totalSlides + ' slides');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousel);
  } else {
    initCarousel();
  }
})();