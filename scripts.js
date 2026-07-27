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
  
  if (introPlayed || !introScreen) {
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

    // Close menu when clicking outside of it
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('open') && 
          !navMenu.contains(e.target) && 
          !mobileMenuBtn.contains(e.target)) {
        navMenu.classList.remove('open');
        mobileMenuBtn.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

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
  const trainingVideo = document.querySelector(".training-hero-video");
  const coachVideo = document.querySelector(".coach-video");
  const motionVideos = document.querySelectorAll(".training-motion-video, .training-motion-video-bg");

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
  setupVideo(trainingVideo);
  setupVideo(coachVideo);
  motionVideos.forEach(video => setupVideo(video));

  tryPlay(heroVideo);
  tryPlay(trainingVideo);
  tryPlay(coachVideo);
  motionVideos.forEach(video => tryPlay(video));

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

  // 9. BOOKING FORM MAILTO FALLBACK & SMOOTH FOCUS SCROLL
  const bookingForm = document.getElementById('booking-request-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('form-name').value;
      const email = document.getElementById('form-email').value;
      const phone = document.getElementById('form-phone').value;
      const path = document.getElementById('form-path').value;
      const goals = document.getElementById('form-msg').value;
      
      const subject = encodeURIComponent('BDD Boxing Training Request');
      
      const bodyText = `BDD Boxing Training Request\n\n` +
                       `Full Name: ${name}\n` +
                       `Email: ${email}\n` +
                       `Phone: ${phone}\n` +
                       `Training Path: ${path}\n\n` +
                       `Goals & Availability:\n${goals}`;
                       
      const body = encodeURIComponent(bodyText);
      
      window.location.href = `mailto:bddboxing@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  const ctaButtons = [document.getElementById('hero-submit-cta'), document.getElementById('final-submit-cta')];
  ctaButtons.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('href').substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => {
            const nameInput = document.getElementById('form-name');
            if (nameInput) nameInput.focus();
          }, 600);
        }
      });
    }
  });

  // 10. VIDEO LIGHTBOX MODAL
  const videoLightbox = document.getElementById('video-lightbox');
  const videoLightboxPlayer = videoLightbox?.querySelector('.video-lightbox-player');
  const videoLightboxClose = videoLightbox?.querySelector('.video-lightbox-close');
  const videoLightboxBackdrop = videoLightbox?.querySelector('.video-lightbox-backdrop');
  
  if (videoLightbox && videoLightboxPlayer) {
    const motionCards = document.querySelectorAll('.training-motion-card');
    
    motionCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const video = card.querySelector('.training-motion-video');
        const source = video?.querySelector('source');
        const videoSrc = source ? source.getAttribute('src') : video?.getAttribute('src');
        
        if (videoSrc) {
          e.stopPropagation();
          videoLightboxPlayer.src = videoSrc;
          videoLightbox.removeAttribute('hidden');
          // Trigger reflow
          videoLightbox.offsetHeight;
          videoLightbox.classList.add('open');
          document.body.style.overflow = 'hidden'; // Lock background scroll
          
          videoLightboxPlayer.play().catch(err => {
            console.log("Auto-playing modal video was blocked: ", err);
          });
        }
      });
    });
    
    const closeVideoLightbox = () => {
      videoLightbox.classList.remove('open');
      document.body.style.overflow = ''; // Restore scroll
      
      videoLightboxPlayer.pause();
      
      // Wait for CSS transition
      setTimeout(() => {
        if (!videoLightbox.classList.contains('open')) {
          videoLightbox.setAttribute('hidden', '');
          videoLightboxPlayer.src = ''; // Clear source
        }
      }, 400);
    };
    
    if (videoLightboxClose) {
      videoLightboxClose.addEventListener('click', closeVideoLightbox);
    }
    
    if (videoLightboxBackdrop) {
      videoLightboxBackdrop.addEventListener('click', closeVideoLightbox);
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && videoLightbox.classList.contains('open')) {
        closeVideoLightbox();
      }
    });
  }

  // 11. HOMEPAGE TESTIMONIAL VIDEO CAROUSEL
  const testimonialContainer = document.querySelector('.testimonials-carousel-container');
  const dotsContainer = document.querySelector('.carousel-dots');
  
  if (testimonialContainer && dotsContainer) {
    const slides = Array.from(testimonialContainer.querySelectorAll('.testimonial-slide'));
    const prevBtn = document.getElementById('testimonial-prev');
    const nextBtn = document.getElementById('testimonial-next');
    
    // Clear any hardcoded indicators
    dotsContainer.innerHTML = '';
    
    // Dynamically generate dot indicators for accessibility and future-proofing
    const dots = slides.map((slide, index) => {
      const dot = document.createElement('button');
      dot.className = index === 0 ? 'carousel-dot active' : 'carousel-dot';
      dot.setAttribute('aria-label', `Go to testimonial slide ${index + 1}`);
      dotsContainer.appendChild(dot);
      return dot;
    });
    
    let currentSlideIndex = 0;
    
    // Auto-load/preload the first testimonial video to guarantee first frame paints on mobile Safari
    const initialVideo = slides[0]?.querySelector('.testimonial-video-main');
    if (initialVideo) {
      initialVideo.setAttribute('preload', 'auto');
      initialVideo.load();
    }
    
    const showSlide = (index) => {
      // Bounds check
      let targetIndex = index;
      if (targetIndex < 0) targetIndex = slides.length - 1;
      if (targetIndex >= slides.length) targetIndex = 0;
      
      // Stop and pause the previous active video player
      const oldActiveSlide = slides[currentSlideIndex];
      const oldMainVideo = oldActiveSlide?.querySelector('.testimonial-video-main');
      if (oldMainVideo) {
        oldMainVideo.pause();
        oldMainVideo.setAttribute('preload', 'metadata');
      }
      
      // Remove active class from old slide and dot
      slides[currentSlideIndex]?.classList.remove('active');
      dots[currentSlideIndex]?.classList.remove('active');
      
      // Update index
      currentSlideIndex = targetIndex;
      
      // Add active class to new slide and dot
      slides[currentSlideIndex]?.classList.add('active');
      dots[currentSlideIndex]?.classList.add('active');
      
      // Preload and initialize the new active video player so it displays correctly on mobile
      const newActiveSlide = slides[currentSlideIndex];
      const newMainVideo = newActiveSlide?.querySelector('.testimonial-video-main');
      if (newMainVideo) {
        newMainVideo.setAttribute('preload', 'auto');
        newMainVideo.load();
      }
    };
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        showSlide(currentSlideIndex - 1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        showSlide(currentSlideIndex + 1);
      });
    }
    
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        showSlide(idx);
      });
    });
  }

  // 12. SUPABASE SESSION SYNC & AVATAR DROPDOWN
  const initSupabaseAuth = async () => {
    const loadSupabase = () => {
      return new Promise((resolve, reject) => {
        if (window.supabase) {
          resolve(window.supabase);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => resolve(window.supabase);
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      });
    };

    try {
      const supabaseModule = await loadSupabase();
      if (!supabaseModule) return;

      const supabaseUrl = 'https://lmrpuxeossmzrnwwpiyc.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcnB1eGVvc3NtenJud3dwaXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjYxMTMsImV4cCI6MjA5OTUwMjExM30.EoUN4M6NBtpi0c6SjJArIL1MMEUjUgjgo8lhnjq8ckc';
      const supabaseClient = supabaseModule.createClient(supabaseUrl, supabaseAnonKey);

      const { data: { session } } = await supabaseClient.auth.getSession();

      if (session) {
        // Fetch user profile info
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const role = profile?.role || 'user';
        const fullName = profile?.full_name || 'Fighter';
        const email = session.user.email;
        
        // Get initials
        let initials = 'U';
        if (fullName) {
          const parts = fullName.trim().split(/\s+/);
          if (parts.length === 1) {
            initials = parts[0].slice(0, 2).toUpperCase();
          } else {
            initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
          }
        }

        const dashboardUrl = role === 'admin' ? 'portal.html#/admin' : 'portal.html#/dashboard';

        let avatarImgHtml = `
          <div class="avatar-circle" style="width: 34px; height: 34px; border-radius: 50%; background-color: #ca3b24; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; box-shadow: 0 0 12px rgba(202, 59, 36, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
            ${initials}
          </div>
        `;

        if (profile?.avatar_url) {
          avatarImgHtml = `
            <div class="avatar-circle" style="width: 34px; height: 34px; border-radius: 50%; background-color: #ca3b24; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; box-shadow: 0 0 12px rgba(202, 59, 36, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
              <img src="${profile.avatar_url}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          `;
        }
        let dashboardLinkHtml = '';
        if (role === 'admin') {
          dashboardLinkHtml = `
            <a href="portal.html#/admin" onmouseenter="this.style.backgroundColor='rgba(255,255,255,0.05)'" onmouseleave="this.style.backgroundColor='transparent'" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; color: #ddd; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px; transition: background-color 0.2s;">
              <svg style="width: 16px; height: 16px; color: #ca3b24;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Admin
            </a>
          `;
        } else {
          dashboardLinkHtml = `
            <a href="portal.html#/dashboard" onmouseenter="this.style.backgroundColor='rgba(255,255,255,0.05)'" onmouseleave="this.style.backgroundColor='transparent'" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; color: #ddd; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px; transition: background-color 0.2s;">
              <svg style="width: 16px; height: 16px; color: #ca3b24;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
              Dashboard
            </a>
          `;
        }

        // Find header login button and replace it with the avatar dropdown
        const loginBtn = document.getElementById('header-login-btn');
        if (loginBtn) {
          const container = document.createElement('div');
          container.className = 'avatar-dropdown-container';
          container.style.cssText = 'position: relative; display: inline-block;';

          container.innerHTML = `
            <button class="avatar-dropdown-btn" style="display: flex; align-items: center; gap: 8px; background: transparent; border: none; cursor: pointer; padding: 0 4px; outline: none; height: 34px;">
              ${avatarImgHtml}
              <svg class="chevron-icon" style="width: 12px; height: 12px; color: #888; transition: transform 0.2s;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="avatar-menu" style="display: none; position: absolute; right: 0; margin-top: 8px; width: 220px; background-color: #121212; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 1000; overflow: hidden; text-align: left;">
              <div style="padding: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <div style="font-weight: 600; color: #fff; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${fullName}
                </div>
                <div style="font-size: 12px; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">
                  ${email}
                </div>
              </div>
              <div style="padding: 4px; display: flex; flex-direction: column;">
                <a href="portal.html#/profile" onmouseenter="this.style.backgroundColor='rgba(255,255,255,0.05)'" onmouseleave="this.style.backgroundColor='transparent'" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; color: #ddd; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px; transition: background-color 0.2s;">
                  <svg style="width: 16px; height: 16px; color: #ca3b24;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Profile
                </a>
                ${dashboardLinkHtml}
                <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.05); margin: 4px 0;" />
                <button class="logout-btn" onmouseenter="this.style.backgroundColor='rgba(202,59,36,0.1)'" onmouseleave="this.style.backgroundColor='transparent'" style="width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; color: #ff8a7a; background: transparent; border: none; text-align: left; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; transition: background-color 0.2s;">
                  <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Log Out
                </button>
              </div>
            </div>
          `;

          loginBtn.parentNode.insertBefore(container, loginBtn);
          loginBtn.parentNode.removeChild(loginBtn);

          // Add toggle event listeners
          const toggleBtn = container.querySelector('.avatar-dropdown-btn');
          const menu = container.querySelector('.avatar-menu');
          const chevron = container.querySelector('.chevron-icon');

          toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
            chevron.style.transform = isVisible ? 'none' : 'rotate(180deg)';
          });

          document.addEventListener('click', () => {
            menu.style.display = 'none';
            chevron.style.transform = 'none';
          });

          menu.addEventListener('click', (e) => {
            e.stopPropagation();
          });

          const logoutBtn = container.querySelector('.logout-btn');
          logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = '/index.html';
          });
        }
      }
    } catch (err) {
      console.error('Failed to sync auth session:', err);
    }
  };

  initSupabaseAuth();
});
