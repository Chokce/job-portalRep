
import JobService from '../services/job-service.js';

document.addEventListener('DOMContentLoaded', function() {
    const jobsGrid = document.getElementById('jobs-grid');
    const loadingMessage = document.getElementById('loading-message');
    const noJobsMessage = document.getElementById('no-jobs-message');
    const jobCount = document.getElementById('job-count');
    const searchButton = document.querySelector('.search-button');
    const keywordInput = document.getElementById('keyword');
    const locationInput = document.getElementById('location');
    const jobTypeFilter = document.getElementById('job-type');
    const salaryFilter = document.getElementById('salary-range');

    // Function to render jobs in the grid
    function renderJobs(jobs) {
        if (!jobs || jobs.length === 0) {
            jobsGrid.innerHTML = '';
            noJobsMessage.style.display = 'block';
            jobCount.textContent = 0;
            return;
        }
        
        noJobsMessage.style.display = 'none';
        jobCount.textContent = jobs.length;

        const jobsHTML = jobs.map(job => {
            const companyInitials = (job.company || 'NA').split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
            const postedDate = getTimeAgo(job.createdAt);
            const jobTypeClass = (job.jobType || 'other').toLowerCase().replace(' ', '-');
            
            return `
                <div class="job-card">
                    <div class="job-card-header">
                        <div class="company-info">
                            <div class="company-logo">${companyInitials}</div>
                            <div class="company-details">
                                <h4 class="company-name">${job.company || 'Not Available'}</h4>
                                <p class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location || 'Not Specified'}</p>
                            </div>
                        </div>
                        <button class="save-job" title="Save Job"><i class="far fa-heart"></i></button>
                    </div>
                    <div class="job-content">
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-description">${(job.description || '').substring(0, 150)}${job.description && job.description.length > 150 ? '...' : ''}</p>
                    </div>
                    <div class="job-details">
                        <div class="job-info">
                             <span class="salary">${job.salaryMin ? `ZMW ${job.salaryMin} - ${job.salaryMax}` : 'Salary not specified'}</span>
                            <span class="job-type"><i class="fas fa-clock"></i> ${job.jobType || 'N/A'}</span>
                        </div>
                        <div class="job-meta">
                            <span class="posted-date">${postedDate}</span>
                        </div>
                    </div>
                    <div class="job-footer">
                        <span class="job-type-badge ${jobTypeClass}">${job.jobType || 'N/A'}</span>
                        <a href="job-details.html?id=${job.id}" class="btn btn-primary">View Details</a>
                    </div>
                </div>
            `;
        }).join('');
        
        jobsGrid.innerHTML = jobsHTML;
    }

    // Utility to calculate time ago
    function getTimeAgo(date) {
        if (!date) return 'Date not available';

        let dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj)) return 'Invalid date';

        const now = new Date();
        const diffTime = Math.abs(now - dateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Posted 1 day ago';
        if (diffDays < 7) return `Posted ${diffDays} days ago`;
        if (diffDays < 30) return `Posted ${Math.ceil(diffDays / 7)} weeks ago`;
        return `Posted ${Math.ceil(diffDays / 30)} months ago`;
    }

    // Main function to perform job search
    async function performSearch() {
        loadingMessage.style.display = 'block';
        jobsGrid.innerHTML = '';
        noJobsMessage.style.display = 'none';

        const searchParams = {
            keyword: keywordInput.value,
            location: locationInput.value,
            jobType: jobTypeFilter.value,
            salaryRange: salaryFilter.value
        };

        const result = await JobService.searchJobs(searchParams);
        
        loadingMessage.style.display = 'none';

        if (result.success && result.jobs) {
            renderJobs(result.jobs);
        } else {
            console.error(result.message);
            noJobsMessage.style.display = 'block';
            jobCount.textContent = 0;
        }
    }
    
    // ---- EVENT LISTENERS ----
    if(searchButton) {
        searchButton.addEventListener('click', performSearch);
    } else {
        console.error('Search button not found!');
    }
    
    if (jobTypeFilter) {
        jobTypeFilter.addEventListener('change', performSearch);
    }

    if (salaryFilter) {
        salaryFilter.addEventListener('change', performSearch);
    }

    // ---- INITIALIZATION ----
    function initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const keyword = urlParams.get('keyword');
        const location = urlParams.get('location');

        if (keyword) {
            keywordInput.value = keyword;
        }
        if (location) {
            locationInput.value = location;
        }

        // Automatically perform a search when the page loads
        performSearch();
    }

    initialize();
});
