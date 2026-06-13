/*
  BDD Boxing Brand - Interactive Logic
  Handles: Intro Screen, FAQ Accordions, Scroll Effects, Mobile Sticky CTA, Mobile Menu
*/

document.addEventListener('DOMContentLoaded', () => {
  // 1. INTRO EXPERIENCE CONTROLLER
  const introScreen = document.getElementById('intro-screen');
  const mainContent = document.getElementById('main-content');
  
  // Premium detail: Skip intro if already seen in current session
  const introPlayed = sessionStorage.getItem('bdd_intro_played');
  
  if (introPlayed) {
    // Skip intro and show main site immediately
    if (introScreen) introScreen.style.display = 'none';
    if (mainContent) mainContent.classList.add('visible');
  } else {
    // Run full intro sequence
    setTimeout(() => {
      if (introScreen) {
        introScreen.classList.add('intro-hidden');
      }
      if (mainContent) {
        mainContent.classList.add('visible');
      }
      
      // Fully clean up intro screen from DOM layout after transition completes
      setTimeout(() => {
        if (introScreen) introScreen.style.display = 'none';
        sessionStorage.setItem('bdd_intro_played', 'true');
      }, 800);
    }, 1900); // 1.9 seconds total duration before start of fade-out (0.5s fade-in + 1.4s hold)
  }

  // 2. HEADER SCROLL EFFECT
  const header = document.querySelector('header');
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check on load

  // 3. MOBILE MENU TOGGLE
  const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileMenuBtn.classList.toggle('open', isOpen);
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when clicking on nav link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileMenuBtn.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // 4. ACTIVE NAV LINK ON SCROLL (Intersection Observer)
  const sections = document.querySelectorAll('section[id], header, div.hero-section');
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px', // focused in the upper-middle of viewport
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (id && link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => navObserver.observe(section));

  // 5. FAQ ACCORDION LOGIC
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const faqHeader = item.querySelector('.faq-header');
    const faqBody = item.querySelector('.faq-body');

    if (faqHeader && faqBody) {
      faqHeader.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other accordions first (exclusive accordion mode)
        faqItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
            const otherBody = otherItem.querySelector('.faq-body');
            if (otherBody) otherBody.style.maxHeight = null;
          }
        });

        // Toggle clicked accordion
        item.classList.toggle('active');
        if (!isActive) {
          // Set max height dynamically to animate open
          faqBody.style.maxHeight = faqBody.scrollHeight + "px";
        } else {
          // Reset to 0 to animate closed
          faqBody.style.maxHeight = null;
        }
      });
    }
  });

  // 6. STICKY MOBILE CTA CONTROLLER
  const stickyCta = document.getElementById('sticky-mobile-cta');
  const heroSection = document.querySelector('.hero-section');

  if (stickyCta) {
    const handleCtaVisibility = () => {
      // Only trigger on mobile viewports (<= 768px)
      if (window.innerWidth <= 768) {
        const heroHeight = heroSection ? heroSection.offsetHeight : 500;
        if (window.scrollY > (heroHeight - 100)) {
          stickyCta.classList.add('visible');
        } else {
          stickyCta.classList.remove('visible');
        }
      } else {
        stickyCta.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', handleCtaVisibility);
    window.addEventListener('resize', handleCtaVisibility);
    handleCtaVisibility(); // Initial check
  }

  // 7. SCROLL-REVEAL FOR MOBILE GALLERY (Intersection Observer)
  // On mobile screens, trigger image details and color transition as user scrolls them into focus
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  if (galleryItems.length > 0) {
    const galleryOptions = {
      root: null,
      rootMargin: '-15% 0px -15% 0px', // middle 70% of screen
      threshold: 0.35 // 35% of item visible
    };

    const galleryObserver = new IntersectionObserver((entries) => {
      if (window.innerWidth <= 768) { // Only run scroll-reveal active state on touch/mobile devices
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          } else {
            entry.target.classList.remove('active');
          }
        });
      } else {
        // Clear active classes if window gets resized back to desktop
        entries.forEach(entry => {
          entry.target.classList.remove('active');
        });
      }
    }, galleryOptions);

    galleryItems.forEach(item => galleryObserver.observe(item));
    
    // Clear styles on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        galleryItems.forEach(item => item.classList.remove('active'));
      }
    });
  }

  // 8. GALLERY LIGHTBOX MODAL
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.querySelector('.lightbox-close');
  
  if (lightbox && lightboxImg) {
    const galleryImages = document.querySelectorAll('.gallery-item img');
    
    galleryImages.forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.style.display = 'flex';
        // Trigger reflow to ensure transition works
        lightbox.offsetHeight;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden'; // Lock background scroll
      });
    });
    
    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = ''; // Restore scroll
      
      // Wait for CSS transition to finish before hiding display
      setTimeout(() => {
        if (!lightbox.classList.contains('open')) {
          lightbox.style.display = 'none';
          lightboxImg.src = ''; // Clear source
        }
      }, 400); // matches transition duration
    };
    
    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }
    
    // Close on click outside the image
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === lightboxClose) {
        closeLightbox();
      }
    });
    
    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) {
        closeLightbox();
      }
    });
  }
});
