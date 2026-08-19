// Enhanced signup page functionality
class SignupApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPasswordStrength();
        this.setupFormValidation();
        this.setupFloatingShapes();
        this.setupMobileMenu();
    }

    setupEventListeners() {
        // Password visibility toggle (if we add one later)
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });
        });

        // Smooth form animations
        const formInputs = document.querySelectorAll('.form-group input');
        formInputs.forEach(input => {
            input.addEventListener('focus', this.handleInputFocus);
            input.addEventListener('blur', this.handleInputBlur);
        });

        // Form submission
        const form = document.querySelector('.signup-form');
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
    }

    setupPasswordStrength() {
        const passwordInput = document.querySelector('#password');
        const strengthIndicator = document.querySelector('.strength-indicator');
        
        if (passwordInput && strengthIndicator) {
            passwordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                const strength = this.calculatePasswordStrength(password);
                
                strengthIndicator.style.width = `${strength.percentage}%`;
                strengthIndicator.style.background = strength.color;
            });
        }
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) score += 25;
        else feedback.push('At least 8 characters');

        // Uppercase check
        if (/[A-Z]/.test(password)) score += 25;
        else feedback.push('One uppercase letter');

        // Lowercase check
        if (/[a-z]/.test(password)) score += 25;
        else feedback.push('One lowercase letter');

        // Number or special character check
        if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 25;
        else feedback.push('One number or special character');

        let color;
        if (score < 50) color = '#ef4444';
        else if (score < 75) color = '#f59e0b';
        else color = '#10b981';

        return {
            percentage: score,
            color: color,
            feedback: feedback
        };
    }

    setupFormValidation() {
        const confirmPasswordInput = document.querySelector('#confirm-password');
        const passwordInput = document.querySelector('#password');
        
        if (confirmPasswordInput && passwordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                if (confirmPasswordInput.value !== passwordInput.value) {
                    confirmPasswordInput.setCustomValidity('Passwords do not match');
                } else {
                    confirmPasswordInput.setCustomValidity('');
                }
            });
        }
    }

    handleInputFocus(e) {
        e.target.parentElement.classList.add('focused');
    }

    handleInputBlur(e) {
        if (!e.target.value) {
            e.target.parentElement.classList.remove('focused');
        }
    }

    handleFormSubmit(e) {
        // Add loading state to button
        const submitBtn = document.querySelector('.signup-btn');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;
        }
    }

    setupFloatingShapes() {
        const shapes = document.querySelectorAll('.floating-shape');
        
        // Add mouse interaction to floating shapes
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            shapes.forEach((shape, index) => {
                const speed = (index + 1) * 0.5;
                const x = (mouseX - 0.5) * speed;
                const y = (mouseY - 0.5) * speed;
                
                shape.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }

    setupMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close menu when clicking on a nav link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignupApp();
});

// Add some smooth animations for form elements
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe form elements for animation
    const animatedElements = document.querySelectorAll('.signup-card, .welcome-section, .form-group');
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        observer.observe(el);
    });
});