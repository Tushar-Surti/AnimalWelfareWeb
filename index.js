// Enhanced Modern JavaScript for Animal Welfare Website
class AnimalWelfareApp {
    constructor() {
        this.currentSlide = 0;
        this.slides = [];
        this.indicators = [];
        this.isAutoPlaying = true;
        this.slideInterval = null;
        this.isInitialized = false;
        this.isMobile = window.innerWidth <= 768;
        this.lastWidth = window.innerWidth;
        
        // Debounced functions
        this.debouncedHandleResize = this.debounce(this.handleResize.bind(this), 150);
        this.debouncedHandleScroll = this.debounce(this.handleScroll.bind(this), 10);
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        try {
            this.setupEventListeners();
            this.initializeCarousel();
            this.initializeAnimations();
            this.initializeNavigation();
            this.initializeFAB();
            this.initializeBackToTop();
            this.initializeProgressBar();
            this.initializeLoadingScreen();
            this.addLoadingStates();
            this.isInitialized = true;
            
            // Start auto-slide after everything is loaded
            setTimeout(() => this.startAutoSlide(), 1000);
            
            console.log('Animal Welfare App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

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

    setupEventListeners() {
        // Carousel controls with null checks and throttling
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        let isTransitioning = false;
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!isTransitioning) {
                    isTransitioning = true;
                    this.previousSlide();
                    setTimeout(() => { isTransitioning = false; }, 600);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!isTransitioning) {
                    isTransitioning = true;
                    this.nextSlide();
                    setTimeout(() => { isTransitioning = false; }, 600);
                }
            });
        }

        // Indicator clicks with delegation and throttling
        const indicatorContainer = document.querySelector('.carousel-indicators');
        if (indicatorContainer) {
            indicatorContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('indicator') && !isTransitioning) {
                    const slideIndex = parseInt(e.target.dataset.slide);
                    if (!isNaN(slideIndex) && slideIndex !== this.currentSlide) {
                        isTransitioning = true;
                        this.goToSlide(slideIndex);
                        setTimeout(() => { isTransitioning = false; }, 600);
                    }
                }
            });
        }

        // Improved carousel hover behavior
        const carousel = document.querySelector('.testimonial-carousel');
        if (carousel) {
            let hoverTimeout;
            
            carousel.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                this.pauseAutoSlide();
            });
            
            carousel.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    this.resumeAutoSlide();
                }, 500);
            });
        }

        // Enhanced smooth scrolling
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#"]');
            if (anchor) {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                    const targetPosition = targetElement.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });

        // Optimized scroll handler
        window.addEventListener('scroll', this.debouncedHandleScroll, { passive: true });
        
        // Improved resize handler
        window.addEventListener('resize', this.debouncedHandleResize);

        // Touch events for mobile carousel
        if ('ontouchstart' in window) {
            this.setupTouchEvents();
        }

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    setupTouchEvents() {
        const carousel = document.querySelector('.testimonial-carousel');
        if (!carousel) return;

        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        let isScrolling = false;

        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isScrolling = false;
            this.pauseAutoSlide();
        }, { passive: true });

        carousel.addEventListener('touchmove', (e) => {
            if (!isScrolling) {
                endX = e.touches[0].clientX;
                endY = e.touches[0].clientY;
                
                // Determine if user is scrolling vertically
                if (Math.abs(endY - startY) > Math.abs(endX - startX)) {
                    isScrolling = true;
                }
            }
        }, { passive: true });

        carousel.addEventListener('touchend', () => {
            if (!isScrolling) {
                const diffX = startX - endX;
                const threshold = 50;

                if (Math.abs(diffX) > threshold) {
                    if (diffX > 0) {
                        this.nextSlide();
                    } else {
                        this.previousSlide();
                    }
                }
            }
            
            setTimeout(() => this.resumeAutoSlide(), 1000);
        }, { passive: true });
    }

    initializeCarousel() {
        this.slides = document.querySelectorAll('.testimonial');
        this.indicators = document.querySelectorAll('.indicator');
        
        if (this.slides.length === 0) {
            console.warn('No testimonial slides found');
            return;
        }
        
        // Initialize slides with proper positioning
        this.slides.forEach((slide, index) => {
            slide.classList.remove('active', 'slide-out-left', 'slide-in-right');
            slide.setAttribute('data-slide-index', index);
            
            if (index === 0) {
                slide.classList.add('active');
            }
        });
        
        console.log(`Carousel initialized with ${this.slides.length} slides`);
    }

    showSlide(index) {
        if (index < 0 || index >= this.slides.length || index === this.currentSlide) return;
        
        const currentSlide = this.slides[this.currentSlide];
        const nextSlide = this.slides[index];
        
        // Remove all transition classes
        this.slides.forEach(slide => {
            slide.classList.remove('active', 'slide-out-left', 'slide-in-right');
        });
        
        // Animate out current slide
        if (currentSlide) {
            currentSlide.classList.add('slide-out-left');
        }
        
        // Animate in new slide
        nextSlide.classList.add('active');
        
        // Update indicators
        this.indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
            indicator.setAttribute('aria-pressed', i === index);
        });
        
        this.currentSlide = index;
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.showSlide(nextIndex);
    }

    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.showSlide(prevIndex);
    }

    goToSlide(index) {
        this.showSlide(index);
        this.resetAutoSlide();
    }

    startAutoSlide() {
        if (this.slides.length <= 1 || this.slideInterval) return;
        
        this.slideInterval = setInterval(() => {
            if (this.isAutoPlaying && !document.hidden) {
                this.nextSlide();
            }
        }, 5000);
    }

    pauseAutoSlide() {
        this.isAutoPlaying = false;
    }

    resumeAutoSlide() {
        this.isAutoPlaying = true;
    }

    resetAutoSlide() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
        setTimeout(() => this.startAutoSlide(), 1000);
    }

    initializeAnimations() {
        // Enhanced Intersection Observer
        const observerOptions = {
            threshold: [0.1, 0.5],
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Add base animation class
                    element.classList.add('animate-in');
                    
                    // Staggered animations for feature cards
                    if (element.classList.contains('feature-card')) {
                        const allCards = document.querySelectorAll('.feature-card');
                        const cardIndex = Array.from(allCards).indexOf(element);
                        element.style.animationDelay = `${cardIndex * 0.15}s`;
                    }
                    
                    // Unobserve after animation
                    observer.unobserve(element);
                }
            });
        }, observerOptions);

        // Observe elements
        const animatedElements = document.querySelectorAll('.feature-card, .hero-text, .section-header, .testimonial-container');
        animatedElements.forEach(el => {
            el.classList.add('animate-ready');
            observer.observe(el);
        });

        this.animateFloatingShapes();
    }

    animateFloatingShapes() {
        const shapes = document.querySelectorAll('.shape');
        const hero = document.querySelector('.hero');
        
        if (!hero) return;
        
        // Enhanced shape animations with mouse interaction
        shapes.forEach((shape, index) => {
            shape.style.animationDelay = `${index * 0.8}s`;
            shape.style.animationDuration = `${6 + (index * 0.5)}s`;
        });

        // Add mouse parallax effect to shapes
        let mouseX = 0;
        let mouseY = 0;
        let ticking = false;

        const updateShapePositions = () => {
            const heroRect = hero.getBoundingClientRect();
            const centerX = heroRect.width / 2;
            const centerY = heroRect.height / 2;
            
            shapes.forEach((shape, index) => {
                const factor = (index + 1) * 0.02; // Different movement intensity per shape
                const offsetX = (mouseX - centerX) * factor;
                const offsetY = (mouseY - centerY) * factor;
                
                shape.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            });
            
            ticking = false;
        };

        const handleMouseMove = (e) => {
            const heroRect = hero.getBoundingClientRect();
            mouseX = e.clientX - heroRect.left;
            mouseY = e.clientY - heroRect.top;
            
            if (!ticking) {
                requestAnimationFrame(updateShapePositions);
                ticking = true;
            }
        };

        // Add mouse move listener only for desktop
        if (!this.isMobile) {
            hero.addEventListener('mousemove', this.debounce(handleMouseMove, 16));
        }
    }

    initializeNavigation() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        if (!hamburger || !navMenu) return;
        
        // Toggle mobile menu
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = hamburger.classList.contains('active');
            
            if (isActive) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        });

        // Close menu when clicking nav links
        navMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                this.closeMobileMenu();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    openMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        hamburger?.classList.add('active');
        navMenu?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');
        document.body.style.overflow = '';
    }

    initializeFAB() {
        const fab = document.getElementById('helpFab');
        if (!fab) return;

        fab.addEventListener('click', () => this.showHelpTooltip());

        // Show/hide FAB based on scroll
        let fabVisible = false;
        
        const toggleFAB = () => {
            const scrollPosition = window.pageYOffset;
            const shouldShow = scrollPosition > 300;
            
            if (shouldShow !== fabVisible) {
                fabVisible = shouldShow;
                fab.style.transform = shouldShow ? 'scale(1)' : 'scale(0)';
                fab.style.opacity = shouldShow ? '1' : '0';
            }
        };

        window.addEventListener('scroll', this.debounce(toggleFAB, 100), { passive: true });
    }

    initializeBackToTop() {
        const backToTop = document.getElementById('backToTop');
        if (!backToTop) return;

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        let backToTopVisible = false;
        
        const toggleBackToTop = () => {
            const scrollPosition = window.pageYOffset;
            const shouldShow = scrollPosition > 500;
            
            if (shouldShow !== backToTopVisible) {
                backToTopVisible = shouldShow;
                backToTop.classList.toggle('visible', shouldShow);
            }
        };

        window.addEventListener('scroll', this.debounce(toggleBackToTop, 100), { passive: true });
    }

    initializeProgressBar() {
        const progressBar = document.getElementById('progressBar');
        if (!progressBar) return;

        const updateProgress = () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            
            const progressFill = progressBar.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = `${Math.min(scrollPercent, 100)}%`;
            }
            
            progressBar.classList.toggle('visible', scrollTop > 100);
        };

        window.addEventListener('scroll', this.debounce(updateProgress, 10), { passive: true });
    }

    initializeLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (!loadingScreen) return;

        // Simulate loading time
        const minLoadingTime = 1500;
        const startTime = Date.now();

        const hideLoadingScreen = () => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
            
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                document.body.classList.add('loaded');
                
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, remainingTime);
        };

        // Hide loading screen when everything is loaded
        if (document.readyState === 'complete') {
            hideLoadingScreen();
        } else {
            window.addEventListener('load', hideLoadingScreen);
        }
    }

    showHelpTooltip() {
        // Remove existing tooltip
        const existingTooltip = document.getElementById('helpTooltip');
        if (existingTooltip) {
            existingTooltip.remove();
            return;
        }

        const tooltip = document.createElement('div');
        tooltip.id = 'helpTooltip';
        tooltip.innerHTML = `
            <div class="help-tooltip">
                <button class="tooltip-close" onclick="document.getElementById('helpTooltip').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="tooltip-content">
                    <h4><i class="fas fa-heart text-primary"></i> Need Help?</h4>
                    <p>Contact us for assistance with finding animal shelters or registering your NGO.</p>
                    <div class="tooltip-actions">
                        <a href="mailto:help@awwhelpers.com" class="tooltip-btn primary">
                            <i class="fas fa-envelope"></i> Email Us
                        </a>
                        <a href="tel:+1234567890" class="tooltip-btn">
                            <i class="fas fa-phone"></i> Call
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Animate in
        requestAnimationFrame(() => {
            const tooltipEl = tooltip.querySelector('.help-tooltip');
            if (tooltipEl) {
                tooltipEl.classList.add('show');
            }
        });

        // Auto remove after 8 seconds
        setTimeout(() => {
            const tooltipEl = tooltip.querySelector('.help-tooltip');
            if (tooltipEl) {
                tooltipEl.classList.remove('show');
                setTimeout(() => {
                    if (document.getElementById('helpTooltip')) {
                        tooltip.remove();
                    }
                }, 300);
            }
        }, 8000);
    }

    addLoadingStates() {
        // Add loading class to images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.complete) {
                img.classList.add('loading');
                img.addEventListener('load', () => {
                    img.classList.remove('loading');
                    img.classList.add('loaded');
                }, { once: true });
            }
        });
    }

    handleScroll() {
        const header = document.querySelector('header');
        const scrollPosition = window.pageYOffset;
        
        if (header) {
            const headerHeight = header.offsetHeight;
            
            if (scrollPosition > headerHeight) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // Enhanced scroll optimization - prevent any transform issues
        // Ensure sections maintain proper stacking order during scroll
        const sections = document.querySelectorAll('section');
        sections.forEach((section, index) => {
            if (!section.classList.contains('hero')) {
                section.style.position = 'relative';
                section.style.zIndex = '10';
            }
        });
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        // Reset mobile menu if switching to desktop
        if (wasMobile && !this.isMobile) {
            this.closeMobileMenu();
        }
        
        // Reinitialize carousel on significant resize
        if (Math.abs(window.innerWidth - this.lastWidth) > 100) {
            this.lastWidth = window.innerWidth;
            if (this.slides.length > 0) {
                this.showSlide(this.currentSlide);
            }
        }
    }

    handleKeyboard(e) {
        // Only handle keyboard events when carousel is focused
        const carousel = document.querySelector('.testimonial-carousel');
        if (!carousel || !carousel.contains(document.activeElement)) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.slides.length - 1);
                break;
        }
    }

    // Public methods for external access
    destroy() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
        }
        
        // Remove event listeners
        window.removeEventListener('scroll', this.debouncedHandleScroll);
        window.removeEventListener('resize', this.debouncedHandleResize);
        
        console.log('Animal Welfare App destroyed');
    }
}

// Initialize app
let app = null;

const initApp = () => {
    if (app) {
        app.destroy();
    }
    app = new AnimalWelfareApp();
    window.animalWelfareApp = app;
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (app) {
        if (document.hidden) {
            app.pauseAutoSlide();
        } else {
            app.resumeAutoSlide();
        }
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});