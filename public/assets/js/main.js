// Main JavaScript file for JobConnect
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }

    // Search functionality
    const searchButton = document.querySelector('.search-box button');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const keyword = document.querySelector('.search-box input:first-of-type').value;
            const location = document.querySelector('.search-box input:nth-of-type(2)').value;
            
            if (keyword || location) {
                window.location.href = `/jobs?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
            } else {
                alert('Please enter a job title, keyword, or location to search.');
            }
        });
    }
});
