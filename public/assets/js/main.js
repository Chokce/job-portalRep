// Main JavaScript file for JobConnect
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    import('./firebase-app.js').then(({ app, auth, db }) => {
        // Initialize auth state
        import('./auth-state.js').then(({ setupAuthState, handleLogout }) => {
            setupAuthState();
            
            // Make auth and db available globally for debugging
            window.auth = auth;
            window.db = db;
            
            // Initialize services
            Promise.all([
                import('./services/auth-service.js'),
                import('./services/job-service.js')
            ]).then(([AuthService, JobService]) => {
                // Make services available globally for debugging
                window.AuthService = AuthService.default;
                window.JobService = JobService.default;
                
                // Initialize page functionality
                initPage(AuthService.default, JobService.default);
            });
        });
    });
});

// Initialize page-specific functionality
function initPage(AuthService, JobService) {
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

    // Job application form handling
    const applyForm = document.getElementById('apply-form');
    if (applyForm) {
        applyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            try {
                const response = await fetch('/jobs/apply', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Application submitted successfully!');
                    document.getElementById('apply-modal').style.display = 'none';
                    this.reset();
                } else {
                    alert(result.message || 'Failed to submit application. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    }

    // Modal handling
    const closeModal = document.getElementById('close-modal');
    const applyModal = document.getElementById('apply-modal');
    
    if (closeModal && applyModal) {
        closeModal.addEventListener('click', function() {
            applyModal.style.display = 'none';
        });

        window.addEventListener('click', function(e) {
            if (e.target === applyModal) {
                applyModal.style.display = 'none';
            }
        });
    }

    // Apply buttons
    document.querySelectorAll('.job-card .btn-primary').forEach(button => {
        button.addEventListener('click', function() {
            const jobTitle = this.closest('.job-card').querySelector('.job-title').textContent;
            const jobId = this.dataset.jobId;
            
            if (applyModal) {
                document.getElementById('apply-job-title').textContent = jobTitle;
                document.getElementById('job-id').value = jobId;
                applyModal.style.display = 'flex';
            }
        });
    });
});
