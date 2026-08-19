// NGO Login Page JavaScript - Enhanced with Mobile Menu and Form Validation

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeBackgroundAnimation();
    initializeMobileMenu();
    initializeFormValidation();
    initializeNavbarScroll();
    setupInteractiveElements();
});

// Background Animation System
function initializeBackgroundAnimation() {
    // Create floating background elements if they don't exist
    if (!document.querySelector('.background-elements')) {
        const backgroundElements = document.createElement('div');
        backgroundElements.className = 'background-elements';
        
        // Create 5 floating shapes
        for (let i = 1; i <= 5; i++) {
            const shape = document.createElement('div');
            shape.className = 'floating-shape';
            backgroundElements.appendChild(shape);
        }
        
        document.body.appendChild(backgroundElements);
    }
    
    // Add interactive hover effects to floating shapes
    const shapes = document.querySelectorAll('.floating-shape');
    shapes.forEach((shape, index) => {
        shape.addEventListener('mouseenter', () => {
            shape.style.animationPlayState = 'paused';
            shape.style.transform = `scale(1.2) rotate(${index * 72}deg)`;
            shape.style.opacity = '0.8';
        });
        
        shape.addEventListener('mouseleave', () => {
            shape.style.animationPlayState = 'running';
            shape.style.transform = '';
            shape.style.opacity = '';
        });
    });
}

// Mobile Menu System
function initializeMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (hamburger && navMenu) {
        // Toggle mobile menu
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
        
        // Close menu when clicking on nav links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Enhanced Form Validation System
function initializeFormValidation() {
    const form = document.querySelector('.login-form');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input[required]');
    const submitBtn = document.querySelector('.login-btn');
    
    // Real-time validation for each input
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
    });
    
    // Form submission validation
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            showLoadingState(submitBtn);
            // Simulate form submission
            setTimeout(() => {
                hideLoadingState(submitBtn);
                showSuccessMessage();
            }, 2000);
        } else {
            showValidationError();
        }
    });
}

// Individual field validation
function validateField(input) {
    const value = input.value.trim();
    const fieldType = input.type;
    const fieldName = input.name || input.id;
    
    // Remove existing error
    clearFieldError(input);
    
    // Required field check
    if (!value) {
        showFieldError(input, `${getFieldLabel(input)} is required`);
        return false;
    }
    
    // Type-specific validation
    switch (fieldType) {
        case 'email':
            if (!isValidEmail(value)) {
                showFieldError(input, 'Please enter a valid email address');
                return false;
            }
            break;
            
        case 'password':
            if (value.length < 6) {
                showFieldError(input, 'Password must be at least 6 characters long');
                return false;
            }
            break;
    }
    
    // Organization ID field validation
    if (fieldName === 'organizationId') {
        if (value.includes('@')) {
            // If it looks like an email, validate as email
            if (!isValidEmail(value)) {
                showFieldError(input, 'Please enter a valid email address');
                return false;
            }
        } else {
            // Validate as organization ID
            if (value.length < 4) {
                showFieldError(input, 'Organization ID must be at least 4 characters long');
                return false;
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                showFieldError(input, 'Organization ID can only contain letters, numbers, hyphens, and underscores');
                return false;
            }
        }
    }
    
    return true;
}

// Validation helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Error display functions
function showFieldError(input, message) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    
    // Remove existing error
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error styling
    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
    
    // Create error message
    const errorMessage = document.createElement('span');
    errorMessage.className = 'error-message';
    errorMessage.style.cssText = `
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: block;
    `;
    errorMessage.textContent = message;
    
    formGroup.appendChild(errorMessage);
}

function clearFieldError(input) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    
    // Remove error styling
    input.style.borderColor = '';
    input.style.boxShadow = '';
    
    // Remove error message
    const errorMessage = formGroup.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function getFieldLabel(input) {
    const label = input.closest('.form-group')?.querySelector('label');
    return label ? label.textContent.replace('*', '').trim() : 'This field';
}

// Navbar scroll effect
function initializeNavbarScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Interactive elements setup
function setupInteractiveElements() {
    // Feature items hover effects
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(12px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = '';
        });
    });
    
    // Stat cards animation
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const number = card.querySelector('.stat-number');
            if (number) {
                number.style.transform = 'scale(1.1)';
                number.style.color = 'var(--primary-color)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            const number = card.querySelector('.stat-number');
            if (number) {
                number.style.transform = '';
                number.style.color = '';
            }
        });
    });
    
    // Form inputs focus effects
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            const label = input.closest('.form-group')?.querySelector('label');
            if (label) {
                label.style.color = 'var(--secondary-color)';
                label.style.transform = 'translateY(-2px)';
            }
        });
        
        input.addEventListener('blur', () => {
            const label = input.closest('.form-group')?.querySelector('label');
            if (label) {
                label.style.color = '';
                label.style.transform = '';
            }
        });
    });
    
    // Forgot password link interaction
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('NGO password reset functionality would be implemented here. Please contact NGO support for assistance.', 'info');
        });
    }
    
    // Header icon special animation for NGO
    const headerIcon = document.querySelector('.header-icon');
    if (headerIcon) {
        headerIcon.addEventListener('mouseenter', () => {
            headerIcon.style.transform = 'scale(1.1) rotate(360deg)';
            headerIcon.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
        });
        
        headerIcon.addEventListener('mouseleave', () => {
            headerIcon.style.transform = '';
            headerIcon.style.background = '';
        });
    }
}

// Loading state management
function showLoadingState(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accessing Dashboard...';
    button.disabled = true;
    button.style.opacity = '0.8';
    button.dataset.originalText = originalText;
}

function hideLoadingState(button) {
    button.innerHTML = button.dataset.originalText || 'Access Dashboard';
    button.disabled = false;
    button.style.opacity = '';
}

// Success and error messages
function showSuccessMessage() {
    const message = createNotification('Success! Welcome to your NGO dashboard. Loading your organization data...', 'success');
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
        // Redirect could go here - for now just show another message
        setTimeout(() => {
            showNotification('Redirecting to NGO dashboard...', 'info');
        }, 500);
    }, 3000);
}

function showValidationError(customMessage = 'Please fix the errors above and try again.') {
    const message = createNotification(customMessage, 'error');
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}

function showNotification(text, type) {
    const message = createNotification(text, type);
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 4000);
}

function createNotification(text, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
    `;
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #4ecdc4, #26a69a)';
    }
    
    notification.textContent = text;
    
    return notification;
}

// Enhanced keyboard navigation
document.addEventListener('keydown', function(e) {
    // Enter key on form elements
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'INPUT') {
            const form = activeElement.closest('form');
            if (form) {
                e.preventDefault();
                const submitBtn = form.querySelector('.login-btn');
                if (submitBtn) {
                    submitBtn.click();
                }
            }
        }
    }
    
    // Escape key to close mobile menu
    if (e.key === 'Escape') {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        if (hamburger && navMenu && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// Organization ID helper function
function formatOrganizationId(input) {
    let value = input.value.toUpperCase();
    // Remove any characters that aren't letters, numbers, hyphens, or underscores
    value = value.replace(/[^A-Z0-9_-]/g, '');
    input.value = value;
}

// Add real-time formatting for organization ID
document.addEventListener('DOMContentLoaded', function() {
    const orgIdInput = document.querySelector('input[name="organizationId"]');
    if (orgIdInput) {
        orgIdInput.addEventListener('input', function() {
            // Only format if it doesn't look like an email
            if (!this.value.includes('@')) {
                formatOrganizationId(this);
            }
        });
    }
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);