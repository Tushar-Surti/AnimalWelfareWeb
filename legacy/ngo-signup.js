// NGO Signup Page JavaScript - Enhanced with Mobile Menu and Form Validation

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeBackgroundAnimation();
    initializeMobileMenu();
    initializeFormValidation();
    initializeNavbarScroll();
    initializePasswordStrength();
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
    const form = document.querySelector('.signup-form');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input[required]');
    const submitBtn = document.querySelector('.signup-btn');
    
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
        
        // Additional validation checks
        if (!validatePasswordConfirmation()) isValid = false;
        if (!validateTermsAcceptance()) isValid = false;
        if (!validateSpecialFields()) isValid = false;
        
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
            
        case 'tel':
            if (!isValidPhone(value)) {
                showFieldError(input, 'Please enter a valid phone number');
                return false;
            }
            break;
            
        case 'url':
            if (!isValidURL(value)) {
                showFieldError(input, 'Please enter a valid website URL');
                return false;
            }
            break;
            
        case 'password':
            if (!isValidPassword(value)) {
                showFieldError(input, 'Password must be at least 8 characters with letters and numbers');
                return false;
            }
            break;
    }
    
    // Field-specific validation
    if (fieldName === 'registrationNumber' && !isValidRegistrationNumber(value)) {
        showFieldError(input, 'Please enter a valid registration number');
        return false;
    }
    
    if (fieldName === 'postalCode' && !isValidPostalCode(value)) {
        showFieldError(input, 'Please enter a valid postal code');
        return false;
    }
    
    return true;
}

// Validation helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function isValidPassword(password) {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function isValidRegistrationNumber(regNum) {
    // Basic validation for registration number (adjust based on local requirements)
    return regNum.length >= 6 && /^[A-Z0-9]+$/i.test(regNum);
}

function isValidPostalCode(postalCode) {
    // Basic validation for postal code
    return /^[A-Z0-9\s\-]{3,10}$/i.test(postalCode);
}

// Password confirmation validation
function validatePasswordConfirmation() {
    const password = document.querySelector('input[name="password"]');
    const confirmPassword = document.querySelector('input[name="confirmPassword"]');
    
    if (password && confirmPassword) {
        if (password.value !== confirmPassword.value) {
            showFieldError(confirmPassword, 'Passwords do not match');
            return false;
        }
    }
    return true;
}

// Terms acceptance validation
function validateTermsAcceptance() {
    const termsCheckbox = document.querySelector('input[name="terms"]');
    if (termsCheckbox && !termsCheckbox.checked) {
        showValidationError('Please accept the terms and conditions');
        return false;
    }
    return true;
}

// Special fields validation
function validateSpecialFields() {
    const organizationName = document.querySelector('input[name="organizationName"]');
    const registrationNumber = document.querySelector('input[name="registrationNumber"]');
    
    if (organizationName && organizationName.value.trim().length < 3) {
        showFieldError(organizationName, 'Organization name must be at least 3 characters');
        return false;
    }
    
    return true;
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

// Password strength indicator
function initializePasswordStrength() {
    const passwordInput = document.querySelector('input[name="password"]');
    const strengthIndicator = document.querySelector('.strength-indicator');
    
    if (!passwordInput || !strengthIndicator) return;
    
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = calculatePasswordStrength(password);
        
        strengthIndicator.style.width = `${strength.percentage}%`;
        strengthIndicator.style.background = strength.color;
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    
    // Character type checks
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    
    // Color based on strength
    let color;
    if (score < 40) color = '#ef4444';
    else if (score < 70) color = '#f59e0b';
    else color = '#10b981';
    
    return { percentage: Math.min(score, 100), color };
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
                number.style.color = 'var(--secondary-color)';
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
                label.style.color = 'var(--primary-color)';
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
}

// Loading state management
function showLoadingState(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    button.disabled = true;
    button.style.opacity = '0.8';
    button.dataset.originalText = originalText;
}

function hideLoadingState(button) {
    button.innerHTML = button.dataset.originalText || 'Create Account';
    button.disabled = false;
    button.style.opacity = '';
}

// Success and error messages
function showSuccessMessage() {
    const message = createNotification('Success! Your NGO account has been created. Please check your email for verification.', 'success');
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
        // Redirect could go here
    }, 3000);
}

function showValidationError(customMessage = 'Please fix the errors above and try again.') {
    const message = createNotification(customMessage, 'error');
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
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
    } else {
        notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    }
    
    notification.textContent = text;
    
    return notification;
}

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