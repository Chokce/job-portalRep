// Job details page functionality
import { showError, showSuccess, formatDate, formatSalary } from '../utils/helpers.js';

export class JobDetailsPage {
    constructor(jobService) {
        this.jobService = jobService;
        this.jobId = this.getJobIdFromUrl();
        this.jobData = null;
        this.isJobSaved = false;
        this.hasApplied = false;
        this.init();
    }

    getJobIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async init() {
        if (!this.jobId) {
            showError('No job ID specified');
            window.location.href = '/find-jobs.html';
            return;
        }

        // Check if user is logged in
        if (!window.auth.currentUser) {
            // Store the current URL to redirect back after login
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
        }

        // Initialize UI elements
        this.applyBtn = document.getElementById('apply-now-btn');
        this.saveJobBtn = document.getElementById('save-job-btn');
        this.jobDetails = document.getElementById('job-details');
        this.relatedJobs = document.getElementById('related-jobs');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.errorMessage = document.getElementById('error-message');
        this.shareBtn = document.getElementById('share-job-btn');
        this.reportBtn = document.getElementById('report-job-btn');
        this.loginPrompt = document.getElementById('login-prompt');
        this.employerActions = document.getElementById('employer-actions');

        await this.loadJobDetails();
        this.setupEventListeners();
        this.checkIfJobIsSaved();
        this.checkIfUserHasApplied();
        this.checkIfUserIsEmployer();
    }

    async loadJobDetails() {
        this.showLoading(true);
        
        try {
            const result = await this.jobService.getJobById(this.jobId);
            
            if (result.success) {
                this.jobData = result.data;
                this.displayJobDetails(this.jobData);
                await this.loadRelatedJobs(this.jobData);
                this.updatePageMetadata(this.jobData);
            } else {
                this.showError(result.error || 'Failed to load job details');
            }
        } catch (error) {
            console.error('Error loading job details:', error);
            this.showError('An error occurred while loading job details');
        } finally {
            this.showLoading(false);
        }
    }

    updatePageMetadata(jobData) {
        // Update page title and meta description for SEO
        document.title = `${jobData.title} at ${jobData.company} | JobConnect`;
        
        // Update Open Graph and Twitter card meta tags
        this.updateMetaTag('og:title', `${jobData.title} at ${jobData.company}`);
        this.updateMetaTag('og:description', jobData.description?.substring(0, 160) || '');
        this.updateMetaTag('og:url', window.location.href);
        this.updateMetaTag('og:type', 'article');
        this.updateMetaTag('og:site_name', 'JobConnect');
        
        if (jobData.companyLogo) {
            this.updateMetaTag('og:image', jobData.companyLogo);
            this.updateMetaTag('twitter:image', jobData.companyLogo);
        }
        
        // Update canonical URL
        let link = document.querySelector("link[rel='canonical']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'canonical';
            document.head.appendChild(link);
        }
        link.href = window.location.href;
    }
    
    updateMetaTag(property, content) {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', property);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    }

    async checkIfJobIsSaved() {
        if (!window.auth.currentUser) return;

        try {
            const res = await this.jobService.hasSavedJob(this.jobId, window.auth.currentUser.uid);
            this.isJobSaved = !!(res && res.success && res.exists);
            this.updateSaveButtonState();
        } catch (error) {
            console.error('Error checking if job is saved:', error);
        }
    }

    async checkIfUserHasApplied() {
        if (!window.auth.currentUser) {
            this.updateApplyButtonState(false);
            return;
        }

        try {
            const res = await this.jobService.hasApplied(window.auth.currentUser.uid, this.jobId);
            this.hasApplied = !!(res && res.success && res.exists);
            this.updateApplyButtonState();
        } catch (error) {
            console.error('Error checking if user has applied:', error);
            this.updateApplyButtonState(false);
        }
    }

    async checkIfUserIsEmployer() {
        if (!window.auth.currentUser) {
            if (this.employerActions) this.employerActions.style.display = 'none';
            return;
        }

        try {
            const isEmployer = (this.jobData?.employerId === window.auth.currentUser.uid)
                || (this.jobData?.postedBy === window.auth.currentUser.uid);

            if (this.employerActions) {
                this.employerActions.style.display = isEmployer ? 'block' : 'none';

                if (isEmployer) {
                    const viewApplicantsBtn = document.getElementById('view-applicants-btn');
                    const editJobBtn = document.getElementById('edit-job-btn');
                    const closeJobBtn = document.getElementById('close-job-btn');

                    if (viewApplicantsBtn) {
                        viewApplicantsBtn.href = `/employer/applications.html?jobId=${this.jobId}`;
                    }

                    if (editJobBtn) {
                        editJobBtn.href = `/employer/post-job.html?id=${this.jobId}`;
                    }

                    if (closeJobBtn) {
                        closeJobBtn.addEventListener('click', () => this.handleCloseJob());
                    }
                }
            }
        } catch (error) {
            console.error('Error checking if user is employer:', error);
            if (this.employerActions) this.employerActions.style.display = 'none';
        }
    }

    displayJobDetails(job) {
        if (!this.jobDetails) return;

        // Format dates
        const postedDate = job.createdAt ? new Date(job.createdAt) : new Date();
        const formattedDate = formatDate(postedDate);
        const deadlineDate = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
        const formattedDeadline = deadlineDate ? formatDate(deadlineDate) : 'Not specified';

        // Format salary if needed
        if (!job.salary && (job.salaryMin || job.salaryMax)) {
            job.salary = formatSalary(job.salaryMin, job.salaryMax);
        }

        // Job header with company logo and basic info
        let jobHeader = '';
        if (job.companyLogo) {
            jobHeader += `
                <div class="company-logo">
                    <img src="${job.companyLogo}" alt="${job.company || 'Company'} Logo">
                </div>
            `;
        }

        jobHeader += `
            <div class="job-header-info">
                <h1>${job.title || 'Job Title'}</h1>
                <h2>${job.company || 'Company'}</h2>
                <div class="job-meta">
                    <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.isRemote ? 'Remote' : (job.location || 'Location not specified')}</span>
                    <span class="job-type"><i class="fas fa-briefcase"></i> ${job.jobType || 'Full-time'}</span>
                    ${job.salary ? `<span class="salary"><i class="fas fa-money-bill-wave"></i> ${formatSalary(job.salary)}</span>` : ''}
                </div>
                <div class="job-posted">
                    <span><i class="far fa-clock"></i> Posted on ${formattedDate}</span>
                    ${deadlineDate ? `<span><i class="far fa-calendar-alt"></i> Apply before ${formattedDeadline}</span>` : ''}
                </div>
            </div>
        `;

        // Job details sections
        let jobSections = '';

        // Job description
        if (job.description) {
            jobSections += `
                <section class="job-section">
                    <h3>Job Description</h3>
                    <div class="job-description">${job.description}</div>
                </section>
            `;
        }

        // Requirements
        if (job.requirements && job.requirements.length > 0) {
            jobSections += `
                <section class="job-section">
                    <h3>Requirements</h3>
                    <ul class="requirements-list">
                        ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </section>
            `;
        }

        // Responsibilities
        if (job.responsibilities && job.responsibilities.length > 0) {
            jobSections += `
                <section class="job-section">
                    <h3>Key Responsibilities</h3>
                    <ul class="responsibilities-list">
                        ${job.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                    </ul>
                </section>
            `;
        }

        // Benefits
        if (job.benefits && job.benefits.length > 0) {
            jobSections += `
                <section class="job-section">
                    <h3>Benefits</h3>
                    <div class="benefits-grid">
                        ${job.benefits.map(benefit => `
                            <div class="benefit-item">
                                <i class="fas fa-check-circle"></i>
                                <span>${benefit}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }

        // Company info
        if (job.companyDescription || job.website) {
            jobSections += `
                <section class="job-section company-info">
                    <h3>About ${job.company || 'the Company'}</h3>
                    ${job.companyDescription ? `<p>${job.companyDescription}</p>` : ''}
                    ${job.website ? `<p><strong>Website:</strong> <a href="${job.website.startsWith('http') ? '' : 'https://'}${job.website}" target="_blank" rel="noopener noreferrer">${job.website.replace(/^https?:\/\//, '')}</a></p>` : ''}
                </section>
            `;
        }

        // Application instructions
        if (job.howToApply) {
            jobSections += `
                <section class="job-section application-instructions">
                    <h3>How to Apply</h3>
                    <div class="how-to-apply">${job.howToApply}</div>
                </section>
            `;
        }

        // Build the final HTML
        this.jobDetails.innerHTML = `
            <div class="job-header">
                ${jobHeader}
                <div class="job-actions">
                    ${this.hasApplied ? `
                        <button class="btn btn-success" disabled>
                            <i class="fas fa-check"></i> Applied
                        </button>
                    ` : `
                        <button id="apply-now-btn" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i> Apply Now
                        </button>
                    `}
                    <button id="save-job-btn" class="btn btn-outline">
                        <i class="${this.isJobSaved ? 'fas' : 'far'} fa-bookmark"></i> ${this.isJobSaved ? 'Saved' : 'Save Job'}
                    </button>
                    <div class="share-dropdown">
                        <button class="btn btn-icon" id="share-job-btn" title="Share Job">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <div class="share-dropdown-content">
                            <a href="#" class="share-option" data-share="linkedin">
                                <i class="fab fa-linkedin"></i> LinkedIn
                            </a>
                            <a href="#" class="share-option" data-share="twitter">
                                <i class="fab fa-twitter"></i> Twitter
                            </a>
                            <a href="#" class="share-option" data-share="facebook">
                                <i class="fab fa-facebook"></i> Facebook
                            </a>
                            <a href="#" class="share-option" data-share="email">
                                <i class="fas fa-envelope"></i> Email
                            </a>
                            <a href="#" class="share-option" data-share="link">
                                <i class="fas fa-link"></i> Copy Link
                            </a>
                        </div>
                    </div>
                    ${window.auth.currentUser ? `
                        <button id="report-job-btn" class="btn btn-icon" title="Report Job">
                            <i class="fas fa-flag"></i>
                        </button>
                    ` : ''}
                </div>
                ${!window.auth.currentUser ? `
                    <div class="login-prompt" id="login-prompt">
                        <p><a href="/login.html?redirect=${encodeURIComponent(window.location.href)}">Sign in</a> to apply or save this job</p>
                    </div>
                ` : ''}
                ${job.employerId === window.auth.currentUser?.uid ? `
                    <div class="employer-actions" id="employer-actions">
                        <h4>Employer Actions</h4>
                        <div class="action-buttons">
                            <a href="/employer/applications.html?jobId=${job.id}" id="view-applicants-btn" class="btn btn-outline">
                                <i class="fas fa-users"></i> View Applicants
                            </a>
                            <a href="/employer/post-job.html?id=${job.id}" id="edit-job-btn" class="btn btn-outline">
                                <i class="fas fa-edit"></i> Edit Job
                            </a>
                            <button id="close-job-btn" class="btn btn-outline-danger">
                                <i class="fas fa-times"></i> Close Job
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="job-content">
                ${jobSections}

                <div class="job-footer">
                    <div class="job-tags">
                        ${job.skills && job.skills.length > 0 ? `
                            <div class="skills-tags">
                                ${job.skills.map(skill => `<span class="tag">${skill}</span>`).join('')}
                            </div>
                        ` : ''}

                        <div class="job-categories">
                            ${job.category ? `<span class="category">${job.category}</span>` : ''}
                            ${job.experienceLevel ? `<span class="experience">${job.experienceLevel}</span>` : ''}
                        </div>
                    </div>

                    <div class="similar-jobs">
                        <h3>Similar Jobs</h3>
                        <div id="related-jobs" class="related-jobs">
                            <div class="loading-spinner"></div>
                            <p>Loading similar jobs...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Reinitialize UI elements after rendering
        this.applyBtn = document.getElementById('apply-now-btn');
        this.saveJobBtn = document.getElementById('save-job-btn');
        this.shareBtn = document.getElementById('share-job-btn');
        this.reportBtn = document.getElementById('report-job-btn');
        this.loginPrompt = document.getElementById('login-prompt');
        this.employerActions = document.getElementById('employer-actions');

        // Update button states
        this.updateApplyButtonState();
        this.updateSaveButtonState();

        // Set up event listeners for the newly created elements
        this.setupEventListeners();

        // Initialize tooltips
        this.initializeTooltips();

        // Track job view
        this.trackJobView();

        // Format salary if not already formatted
        if (job.salaryMin || job.salaryMax) {
            job.salary = `${job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : 'N/A'} - ${job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : 'N/A'}`;
        } else if (!job.salary) {
            job.salary = 'Negotiable';
        }

        // Ensure requirements is an array
        if (!Array.isArray(job.requirements)) {
            job.requirements = [];
        }

        // Update the DOM
        this.jobDetails.innerHTML = `
            <div class="job-header">
                <div>
                    <h1>${job.title}</h1>
                    <p class="company">${job.company || 'Company not specified'}</p>
                    <div class="job-meta">
                        <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.location || 'Location not specified'}</span>
                        <span class="job-type ${job.jobType?.toLowerCase() || 'full-time'}">${job.jobType || 'Full-time'}</span>
                        <span class="salary"><i class="fas fa-money-bill-wave"></i> ${job.salary}</span>
                        <span class="posted-date"><i class="far fa-clock"></i> Posted on ${formattedDate}</span>
                    </div>
                </div>
                <div class="job-actions">
                    <button id="apply-now-btn" class="btn btn-primary">Apply Now</button>
                    <button id="save-job-btn" class="btn btn-outline">
                        <i class="far fa-bookmark"></i> Save Job
                    </button>
                </div>
            </div>

            <div class="job-content">
                <section class="job-section">
                    <h2>Job Description</h2>
                    <div class="job-description">
                        ${job.description || '<p>No description available.</p>'}
                    </div>
                </section>

                <section class="job-section">
                    <h2>Requirements</h2>
                    <ul class="requirements-list">
                        ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </section>

                <section class="job-section">
                    <h2>About the Company</h2>
                    <div class="company-info">
                        ${job.companyDescription || '<p>No company information available.</p>'}
                    </div>
                </section>
            </div>
        `;

        // Update the document title
        document.title = `${job.title} at ${job.company || 'Company'} | JobConnect`;
    }

    async loadRelatedJobs(jobData) {
        if (!this.relatedJobs) return;

        try {
            // Show loading state
            this.relatedJobs.innerHTML = '<div class="loading-spinner"></div><p>Loading similar jobs...</p>';

            // In a real app, you would fetch related jobs based on the current job's category, skills, etc.
            // For now, we'll simulate an API call with a timeout
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simulated related jobs data
            const relatedJobs = [
                {
                    id: 'related-1',
                    title: 'Senior Frontend Developer',
                    company: 'Tech Corp',
                    location: 'San Francisco, CA',
                    type: 'Full-time',
                    salary: '$120,000 - $150,000',
                    isRemote: true,
                    posted: '2 days ago'
                },
                {
                    id: 'related-2',
                    title: 'UI/UX Designer',
                    company: 'Design Studio',
                    location: 'New York, NY',
                    type: 'Contract',
                    salary: '$50 - $70/hr',
                    isRemote: true,
                    posted: '1 week ago'
                },
                {
                    id: 'related-3',
                    title: 'Full Stack Developer',
                    company: 'Web Solutions',
                    location: 'Remote',
                    type: 'Full-time',
                    salary: '$100,000 - $130,000',
                    isRemote: true,
                    posted: '3 days ago'
                }
            ];

            // Render related jobs
            if (relatedJobs.length > 0) {
                this.relatedJobs.innerHTML = relatedJobs.map(job => `
                    <div class="job-card">
                        <h3>${job.title}</h3>
                        <p class="company">${job.company}</p>
                        <div class="job-meta">
                            <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.isRemote ? 'Remote' : job.location}</span>
                            <span class="job-type">${job.type}</span>
                            ${job.salary ? `<span class="salary"><i class="fas fa-money-bill-wave"></i> ${job.salary}</span>` : ''}
                        </div>
                        <div class="job-posted">
                            <span><i class="far fa-clock"></i> ${job.posted}</span>
                        </div>
                        <a href="/job-details.html?id=${job.id}" class="btn btn-outline btn-block">View Details</a>
                    </div>
                `).join('');
            } else {
                this.relatedJobs.innerHTML = '<p class="no-results">No similar jobs found.</p>';
            }
        } catch (error) {
            console.error('Error loading related jobs:', error);
            this.relatedJobs.innerHTML = '<p class="error">Failed to load similar jobs. Please try again later.</p>';
        }
    }

    setupEventListeners() {
        // Apply button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#apply-now-btn')) {
                this.handleApplyClick();
            }
        });

        // Save job button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#save-job-btn')) {
                this.handleSaveJob();
            }
        });
    }

    handleApplyClick() {
        // Check if user is logged in
        if (!window.auth.currentUser) {
            window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
            return;
        }

        // Open apply modal or redirect to application page
        window.location.href = `/apply.html?jobId=${this.jobId}`;
    }

    async handleSaveJob() {
        if (!window.auth.currentUser) {
            window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
            return;
        }

        try {
            const saveBtn = document.getElementById('save-job-btn');
            const isSaved = saveBtn.classList.contains('saved') || this.isJobSaved;

            if (isSaved) {
                const res = await this.jobService.removeSavedJobForUser(this.jobId, window.auth.currentUser.uid);
                if (!res.success) throw new Error(res.error || 'Failed to unsave job');
                this.isJobSaved = false;
                saveBtn.innerHTML = '<i class="far fa-bookmark"></i> Save Job';
                saveBtn.classList.remove('saved');
                showSuccess('Job removed from saved jobs');
            } else {
                const res = await this.jobService.saveJobForUser(this.jobId, window.auth.currentUser.uid);
                if (!res.success) throw new Error(res.error || 'Failed to save job');
                this.isJobSaved = true;
                saveBtn.innerHTML = '<i class=\"fas fa-bookmark\"></i> Saved';
                saveBtn.classList.add('saved');
                showSuccess('Job saved successfully');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            showError('Failed to save job. Please try again.');
        }
    }

    showLoading(show) {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = show ? 'flex' : 'none';
        }

        if (this.jobDetails) {
            this.jobDetails.style.opacity = show ? '0.5' : '1';
            this.jobDetails.style.pointerEvents = show ? 'none' : 'auto';
        }
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
            
            // Hide error after 5 seconds
            setTimeout(() => {
                if (this.errorMessage) {
                    this.errorMessage.style.display = 'none';
                }
            }, 5000);
        } else {
            console.error('Error:', message);
        }
    }

    updateApplyButtonState() {
        if (!this.applyBtn) return;

        if (this.hasApplied) {
            this.applyBtn.disabled = true;
            this.applyBtn.innerHTML = '<i class="fas fa-check"></i> Applied';
            this.applyBtn.className = 'btn btn-success';
        } else {
            this.applyBtn.disabled = false;
            this.applyBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Apply Now';
            this.applyBtn.className = 'btn btn-primary';
        }
    }

    updateSaveButtonState() {
        if (!this.saveJobBtn) return;

        if (this.isJobSaved) {
            this.saveJobBtn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
            this.saveJobBtn.classList.add('saved');
        } else {
            this.saveJobBtn.innerHTML = '<i class="far fa-bookmark"></i> Save Job';
            this.saveJobBtn.classList.remove('saved');
        }
    }

    initializeTooltips() {
        // Initialize tooltips using a library like TippY.js or similar
        // For now, we'll just log a message
        console.log('Initializing tooltips...');
    }

    trackJobView() {
        // Track job view using analytics or similar
        // For now, we'll just log a message
        console.log('Tracking job view...');
    }
}

// Initialize job details page when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('job-details')) {
        try {
            const JobServiceModule = await import('../services/job-service.js');
            const JobService = JobServiceModule.default || JobServiceModule.JobService;
            new JobDetailsPage(new JobService());
        } catch (error) {
            console.error('Failed to initialize job details page:', error);
            const errorElement = document.createElement('div');
            errorElement.className = 'alert alert-danger';
            errorElement.textContent = 'Failed to load job details. Please try again later.';
            document.getElementById('job-details')?.appendChild(errorElement);
        }
    }
});
