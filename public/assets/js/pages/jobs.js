// Job search and listing functionality
import { showError, showSuccess } from '../utils/helpers.js';

export class JobsPage {
    constructor(jobService) {
        this.jobService = jobService;
        this.lastVisible = null;
        this.loading = false;
        this.filters = {};
        this.init();
    }

    async init() {
        this.jobListings = document.getElementById('job-listings');
        this.searchForm = document.getElementById('search-jobs-form');
        this.loadMoreBtn = document.getElementById('load-more-jobs');
        
        // Initialize event listeners
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }
        
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => this.loadMoreJobs());
        }
        
        // Load initial jobs
        await this.loadJobs();
        
        // Set up infinite scroll
        this.setupInfiniteScroll();
    }
    
    async handleSearch(e) {
        if (e) e.preventDefault();
        
        // Get filters from form
        const formData = new FormData(this.searchForm);
        this.filters = {
            title: formData.get('keywords') || '',
            location: formData.get('location') || '',
            jobType: formData.get('jobType') || '',
            salaryMin: formData.get('salaryMin') || ''
        };
        
        // Reset pagination
        this.lastVisible = null;
        this.jobListings.innerHTML = '';
        
        // Load jobs with new filters
        await this.loadJobs();
    }
    
    async loadJobs() {
        if (this.loading) return;
        this.loading = true;
        
        // Show loading state
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'spinner';
        this.jobListings.appendChild(loadingIndicator);
        
        try {
            const result = await this.jobService.searchJobs(
                this.filters, 
                10, 
                this.lastVisible
            );
            
            if (result.success) {
                if (result.data.length === 0 && this.lastVisible === null) {
                    this.jobListings.innerHTML = '<p class="no-results">No jobs found matching your criteria.</p>';
                } else {
                    result.data.forEach(job => {
                        const jobElement = this.createJobElement(job);
                        this.jobListings.appendChild(jobElement);
                    });
                    this.lastVisible = result.lastVisible;
                    
                    // Show/hide load more button
                    if (this.loadMoreBtn) {
                        this.loadMoreBtn.style.display = result.data.length === 10 ? 'block' : 'none';
                    }
                }
            } else {
                showError(result.error || 'Failed to load jobs. Please try again.');
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
            showError('An error occurred while loading jobs. Please try again.');
        } finally {
            // Remove loading indicator
            if (this.jobListings.contains(loadingIndicator)) {
                this.jobListings.removeChild(loadingIndicator);
            }
            this.loading = false;
        }
    }
    
    async loadMoreJobs() {
        await this.loadJobs();
        
        // Scroll to show newly loaded jobs
        if (this.lastVisible) {
            const jobCards = this.jobListings.querySelectorAll('.job-card');
            if (jobCards.length > 0) {
                jobCards[jobCards.length - 1].scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
    
    createJobElement(job) {
        const jobElement = document.createElement('div');
        jobElement.className = 'job-card';
        jobElement.innerHTML = `
            <div class="job-header">
                <h3 class="job-title">${job.title}</h3>
                <span class="job-type ${job.jobType?.toLowerCase() || 'full-time'}">
                    ${job.jobType || 'Full-time'}
                </span>
            </div>
            <p class="company">${job.company || 'Company not specified'}</p>
            <p class="location">
                <i class="fas fa-map-marker-alt"></i> 
                ${job.location || 'Location not specified'}
            </p>
            <p class="salary">
                <i class="fas fa-money-bill-wave"></i> 
                ${job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : 'N/A'} - 
                ${job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : 'N/A'}
            </p>
            <p class="posted-date">
                <i class="far fa-clock"></i> 
                Posted ${this.formatDate(job.createdAt || new Date().toISOString())}
            </p>
            <div class="job-actions">
                <a href="job-details.html?id=${job.id}" class="btn btn-outline">View Details</a>
                <button class="btn btn-primary apply-now" data-job-id="${job.id}">
                    Apply Now
                </button>
            </div>
        `;
        
        // Add event listener for apply button
        const applyBtn = jobElement.querySelector('.apply-now');
        if (applyBtn) {
            applyBtn.addEventListener('click', (e) => this.handleApplyClick(e, job));
        }
        
        return jobElement;
    }
    
    handleApplyClick(e, job) {
        e.preventDefault();
        
        // Check if user is logged in
        if (!window.auth.currentUser) {
            window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
        }
        
        // Open apply modal or redirect to application page
        const applyModal = document.getElementById('apply-modal');
        if (applyModal) {
            const titleElement = applyModal.querySelector('#apply-job-title');
            const jobIdInput = applyModal.querySelector('#job-id');
            
            if (titleElement) titleElement.textContent = job.title;
            if (jobIdInput) jobIdInput.value = job.id;
            
            applyModal.style.display = 'flex';
        } else {
            // Fallback to application page
            window.location.href = `/apply.html?jobId=${job.id}`;
        }
    }
    
    setupInfiniteScroll() {
        window.addEventListener('scroll', () => {
            if (this.loading || !this.lastVisible) return;
            
            const scrollPosition = window.innerHeight + window.scrollY;
            const pageHeight = document.documentElement.offsetHeight - 500; // Load more when 500px from bottom
            
            if (scrollPosition >= pageHeight) {
                this.loadMoreJobs();
            }
        });
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'today';
        if (diffInDays === 1) return 'yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize jobs page when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('job-listings')) {
        const JobServiceModule = await import('../services/job-service.js');
        const JobService = JobServiceModule.default || JobServiceModule.JobService;
        new JobsPage(new JobService());
    }
});
