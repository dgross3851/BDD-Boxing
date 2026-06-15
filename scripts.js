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
    }, 2100); // 2.1 seconds total duration before start of fade-out (0.5s fade-in + 1.6s hold)
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

    // Close menu when clicking on nav link or mobile menu CTA button
    const closeLinks = document.querySelectorAll('.nav-link, .mobile-menu-cta');
    closeLinks.forEach(link => {
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

  // 7. VIDEO AUTOPLAY FALLBACK & COMPATIBILITY
  const heroVideo = document.querySelector(".hero-video");
  const coachVideo = document.querySelector(".coach-video");

  const setupVideo = (video) => {
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false;

    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("preload", "auto");
    video.removeAttribute("controls");
  };

  const tryPlay = async (video) => {
    if (!video) return false;

    setupVideo(video);

    try {
      await video.play();
      video.closest(".video-wrapper")?.classList.add("video-playing");
      video.closest(".video-wrapper")?.classList.remove("video-autoplay-failed");
      return true;
    } catch (error) {
      video.closest(".video-wrapper")?.classList.add("video-autoplay-failed");
      return false;
    }
  };

  setupVideo(heroVideo);
  setupVideo(coachVideo);

  tryPlay(heroVideo);
  tryPlay(coachVideo);

  const retryCoachVideo = () => {
    setupVideo(coachVideo);
    tryPlay(coachVideo);
  };

  ["touchstart", "click", "pointerdown", "scroll"].forEach((eventName) => {
    document.addEventListener(eventName, retryCoachVideo, { once: true, passive: true });
  });

  if (coachVideo && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          retryCoachVideo();
        }
      });
    }, { threshold: [0.3] });

    observer.observe(coachVideo);
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
