let currentSlide = 0;
const slides = document.querySelectorAll('.testimonial');

// Function to display the current slide and hide others
function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');  // Remove active class from all slides
        slide.style.display = 'none';      // Hide all slides
    });
    slides[index].classList.add('active'); // Add active class to the current slide
    slides[index].style.display = 'block'; // Show the current slide
}

// Function to automatically change slides every 3 seconds
function autoSlide() {
    currentSlide++;
    if (currentSlide >= slides.length) {
        currentSlide = 0;
    }
    showSlide(currentSlide);
}

// Initialize by showing the first slide
showSlide(currentSlide);

// Start auto-slide transition every 3 seconds
setInterval(autoSlide, 3000);
