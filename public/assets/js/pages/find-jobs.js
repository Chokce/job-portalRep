
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

    function renderJobs(jobs) {
        if (jobs.length === 0) {
            jobsGrid.innerHTML = '';
            noJobsMessage.style.display = 'block';
            jobCount.textContent = 0;
            return;
        }
        
        noJobsMessage.style.display = 'none';
        jobCount.textContent = jobs.length;

        const jobsHTML = jobs.map(job => {
            const companyInitials = job.company.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
            const postedDate = getTimeAgo(job.createdAt);
            const jobTypeClass = job.jobType.toLowerCase().replace(' ', '-');
            
            return `
                <div class="job-card">
                    <div class="job-card-header">
                        <div class="company-info">
                            <div class="company-logo">${companyInitials}</div>
                            <div class="company-details">
                                <h4 class="company-name">${job.company}</h4>
                                <p class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location}</p>
                            </div>
                        </div>
                        <div class="job-actions">
                            <button class="save-job" title="Save Job"><i class="far fa-heart"></i></button>
                        </div>
                    </div>
                    <div class="job-content">
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-description">${job.description.substring(0, 150)}${job.description.length > 150 ? '...' : ''}</p>
                    </div>
                    <div class="job-details">
                        <div class="job-info">
                            <span class="salary"><i class="fas fa-dollar-sign"></i> ${job.salaryMin} - ${job.salaryMax}</span>
                            <span class="job-type"><i class="fas fa-clock"></i> ${job.jobType}</span>
                        </div>
                        <div class="job-meta">
                            <span class="posted-date">${postedDate}</span>
                        </div>
                    </div>
                    <div class="job-footer">
                        <span class="job-type-badge ${jobTypeClass}">${jobTypeClass}</span>
                        <a href="job-details.html?id=${job.id}" class="btn btn-primary">View Details</a>
                    </div>
                </div>
            `;
        }).join('');
        
        jobsGrid.innerHTML = jobsHTML;
    }

    function getTimeAgo(date) {
        if (!date) return 'Date not available';

        let dateObj;
        if (date && date._seconds) {
            dateObj = new Date(date._seconds * 1000);
        } else if (date && typeof date.toDate === 'function') {
            dateObj = date.toDate();
        } else if (date instanceof Date) {
            dateObj = date;
        } else {
            dateObj = new Date(date);
            if (isNaN(dateObj)) {
                return 'Invalid date';
            }
        }

        const now = new Date();
        const diffTime = Math.abs(now - dateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Posted 1 day ago';
        if (diffDays < 7) return `Posted ${diffDays} days ago`;
        if (diffDays < 30) return `Posted ${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
        return `Posted ${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) > 1 ? 's' : ''} ago`;
    }

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

        if (result.success) {
            renderJobs(result.jobs);
        } else {
            console.error(result.message);
            noJobsMessage.style.display = 'block';
            jobCount.textContent = 0;
        }
    }
    
    if(searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    jobTypeFilter.addEventListener('change', performSearch);
    salaryFilter.addEventListener('change', performSearch);

    function initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const keyword = urlParams.get('keyword');
        const location = urlParams.get('location');

        if (keyword || location) {
            keywordInput.value = keyword || '';
            locationInput.value = location || '';
        }

        performSearch();
    }

    initialize();
});
