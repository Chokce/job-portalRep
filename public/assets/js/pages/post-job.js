// Job posting page functionality
import { showError, showSuccess, validateEmail, validateURL } from '../utils/helpers.js';

export class PostJobPage {
    constructor(jobService) {
        this.jobService = jobService;
        this.jobId = new URLSearchParams(window.location.search).get('id');
        this.isEditMode = !!this.jobId;
        this.init();
    }

    async init() {
        // Check if user is logged in and is an employer
        if (!window.auth.currentUser) {
            window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
            return;
        }

        // In a real app, you would check if the user has employer role
        // For now, we'll assume the user is an employer
        
        this.setupEventListeners();
        
        if (this.isEditMode) {
            await this.loadJobData();
        } else {
            this.setupNewJobForm();
        }
        
        this.setupFormValidation();
    }

    async loadJobData() {
        try {
            const result = await this.jobService.getJobById(this.jobId);
            
            if (result.success) {
                this.populateForm(result.data);
                document.title = `Edit ${result.data.title} | Post Job | JobConnect`;
            } else {
                showError('Failed to load job details');
                window.location.href = '/employer/dashboard.html';
            }
        } catch (error) {
            console.error('Error loading job data:', error);
            showError('An error occurred while loading job details');
        }
    }

    populateForm(jobData) {
        // Basic job info
        if (jobData.title) document.getElementById('job-title').value = jobData.title;
        if (jobData.company) document.getElementById('company-name').value = jobData.company;
        if (jobData.location) document.getElementById('location').value = jobData.location;
        if (jobData.jobType) document.getElementById('job-type').value = jobData.jobType;
        if (jobData.salary) document.getElementById('salary').value = jobData.salary;
        if (jobData.category) document.getElementById('category').value = jobData.category;
        if (jobData.experienceLevel) document.getElementById('experience-level').value = jobData.experienceLevel;
        if (jobData.educationLevel) document.getElementById('education-level').value = jobData.educationLevel;
        
        // Job description
        if (jobData.description) {
            const descriptionEditor = document.getElementById('job-description');
            if (descriptionEditor) descriptionEditor.innerHTML = jobData.description;
        }
        
        // Requirements
        if (jobData.requirements && Array.isArray(jobData.requirements)) {
            const requirementsContainer = document.getElementById('requirements-container');
            if (requirementsContainer) {
                requirementsContainer.innerHTML = '';
                jobData.requirements.forEach(req => this.addRequirement(req));
            }
        }
        
        // Responsibilities
        if (jobData.responsibilities && Array.isArray(jobData.responsibilities)) {
            const responsibilitiesContainer = document.getElementById('responsibilities-container');
            if (responsibilitiesContainer) {
                responsibilitiesContainer.innerHTML = '';
                jobData.responsibilities.forEach(resp => this.addResponsibility(resp));
            }
        }
        
        // Application details
        if (jobData.applicationEmail) document.getElementById('application-email').value = jobData.applicationEmail;
        if (jobData.applicationUrl) document.getElementById('application-url').value = jobData.applicationUrl;
        
        // Job meta
        if (jobData.isRemote !== undefined) {
            document.getElementById('is-remote').checked = jobData.isRemote;
            this.toggleLocationField(!jobData.isRemote);
        }
        
        if (jobData.isFeatured !== undefined) {
            document.getElementById('is-featured').checked = jobData.isFeatured;
        }
        
        // Update UI for edit mode
        const pageTitle = document.querySelector('.page-title');
        const submitBtn = document.querySelector('button[type="submit"]');
        
        if (pageTitle) pageTitle.textContent = 'Edit Job Posting';
        if (submitBtn) submitBtn.textContent = 'Update Job';
    }

    setupNewJobForm() {
        // Set default values for new job
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('posting-date').value = today;
        
        // Set default expiry date to 30 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        document.getElementById('application-deadline').value = expiryDate.toISOString().split('T')[0];
        
        // Add empty requirement and responsibility fields
        this.addRequirement();
        this.addResponsibility();
    }

    setupEventListeners() {
        // Form submission
        const jobForm = document.getElementById('job-post-form');
        if (jobForm) {
            jobForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Add requirement button
        const addRequirementBtn = document.getElementById('add-requirement');
        if (addRequirementBtn) {
            addRequirementBtn.addEventListener('click', () => this.addRequirement());
        }
        
        // Add responsibility button
        const addResponsibilityBtn = document.getElementById('add-responsibility');
        if (addResponsibilityBtn) {
            addResponsibilityBtn.addEventListener('click', () => this.addResponsibility());
        }
        
        // Remote work toggle
        const isRemoteCheckbox = document.getElementById('is-remote');
        if (isRemoteCheckbox) {
            isRemoteCheckbox.addEventListener('change', (e) => {
                this.toggleLocationField(!e.target.checked);
            });
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.history.back();
                }
            });
        }
        
        // Preview button
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.previewJob();
            });
        }
    }

    setupFormValidation() {
        // Client-side validation
        const jobForm = document.getElementById('job-post-form');
        if (!jobForm) return;
        
        jobForm.addEventListener('submit', (e) => {
            const errors = [];
            
            // Required fields
            const requiredFields = [
                'job-title', 'company-name', 'job-type', 'category',
                'experience-level', 'job-description'
            ];
            
            requiredFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field && !field.value.trim()) {
                    errors.push(`${this.formatFieldName(fieldId)} is required`);
                    field.classList.add('is-invalid');
                } else if (field) {
                    field.classList.remove('is-invalid');
                }
            });
            
            // Location validation (if not remote)
            const isRemote = document.getElementById('is-remote').checked;
            if (!isRemote && !document.getElementById('location').value.trim()) {
                errors.push('Location is required for non-remote positions');
                document.getElementById('location').classList.add('is-invalid');
            } else {
                document.getElementById('location').classList.remove('is-invalid');
            }
            
            // Application email/URL validation
            const applicationEmail = document.getElementById('application-email').value.trim();
            const applicationUrl = document.getElementById('application-url').value.trim();
            
            if (!applicationEmail && !applicationUrl) {
                errors.push('Either application email or application URL is required');
                document.getElementById('application-email').classList.add('is-invalid');
                document.getElementById('application-url').classList.add('is-invalid');
            } else {
                if (applicationEmail && !validateEmail(applicationEmail)) {
                    errors.push('Please enter a valid email address');
                    document.getElementById('application-email').classList.add('is-invalid');
                } else {
                    document.getElementById('application-email').classList.remove('is-invalid');
                }
                
                if (applicationUrl && !validateURL(applicationUrl)) {
                    errors.push('Please enter a valid URL');
                    document.getElementById('application-url').classList.add('is-invalid');
                } else {
                    document.getElementById('application-url').classList.remove('is-invalid');
                }
            }
            
            // Requirements validation
            const requirementInputs = document.querySelectorAll('.requirement-input');
            if (requirementInputs.length === 0) {
                errors.push('At least one requirement is required');
            } else {
                let hasValidRequirement = false;
                requirementInputs.forEach(input => {
                    if (input.value.trim()) {
                        hasValidRequirement = true;
                        input.classList.remove('is-invalid');
                    } else {
                        input.classList.add('is-invalid');
                    }
                });
                
                if (!hasValidRequirement) {
                    errors.push('At least one valid requirement is required');
                }
            }
            
            // If there are validation errors, prevent form submission
            if (errors.length > 0) {
                e.preventDefault();
                showError(`<strong>Please fix the following errors:</strong><br>${errors.join('<br>')}`);
                
                // Scroll to first error
                const firstError = document.querySelector('.is-invalid');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }
        });
    }

    addRequirement(initialValue = '') {
        const container = document.getElementById('requirements-container');
        if (!container) return;
        
        const requirementId = `requirement-${Date.now()}`;
        const requirementEl = document.createElement('div');
        requirementEl.className = 'form-group requirement-group';
        requirementEl.innerHTML = `
            <div class="input-group">
                <input type="text" 
                       id="${requirementId}" 
                       class="form-control requirement-input" 
                       placeholder="Enter a requirement (e.g., 3+ years of experience)" 
                       value="${initialValue}">
                <div class="input-group-append">
                    <button class="btn btn-outline-danger remove-requirement" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(requirementEl);
        
        // Add event listener for remove button
        const removeBtn = requirementEl.querySelector('.remove-requirement');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                const requirementGroups = container.querySelectorAll('.requirement-group');
                if (requirementGroups.length > 1) {
                    container.removeChild(requirementEl);
                } else {
                    // Don't remove the last requirement, just clear it
                    const input = requirementEl.querySelector('input');
                    if (input) input.value = '';
                }
            });
        }
        
        // Focus the new input
        const input = document.getElementById(requirementId);
        if (input) input.focus();
    }

    addResponsibility(initialValue = '') {
        const container = document.getElementById('responsibilities-container');
        if (!container) return;
        
        const responsibilityId = `responsibility-${Date.now()}`;
        const responsibilityEl = document.createElement('div');
        responsibilityEl.className = 'form-group responsibility-group';
        responsibilityEl.innerHTML = `
            <div class="input-group">
                <input type="text" 
                       id="${responsibilityId}" 
                       class="form-control responsibility-input" 
                       placeholder="Enter a responsibility (e.g., Develop new features)" 
                       value="${initialValue}">
                <div class="input-group-append">
                    <button class="btn btn-outline-danger remove-responsibility" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(responsibilityEl);
        
        // Add event listener for remove button
        const removeBtn = responsibilityEl.querySelector('.remove-responsibility');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                const responsibilityGroups = container.querySelectorAll('.responsibility-group');
                if (responsibilityGroups.length > 1) {
                    container.removeChild(responsibilityEl);
                } else {
                    // Don't remove the last responsibility, just clear it
                    const input = responsibilityEl.querySelector('input');
                    if (input) input.value = '';
                }
            });
        }
        
        // Focus the new input
        const input = document.getElementById(responsibilityId);
        if (input) input.focus();
    }

    toggleLocationField(show) {
        const locationField = document.getElementById('location-field');
        const locationInput = document.getElementById('location');
        
        if (locationField) {
            locationField.style.display = show ? 'block' : 'none';
        }
        
        if (locationInput) {
            if (show) {
                locationInput.removeAttribute('disabled');
            } else {
                locationInput.setAttribute('disabled', 'disabled');
                locationInput.value = 'Remote';
            }
        }
    }

    formatFieldName(fieldId) {
        return fieldId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        // Get form data
        const formData = {
            title: document.getElementById('job-title').value.trim(),
            company: document.getElementById('company-name').value.trim(),
            location: document.getElementById('location').value.trim(),
            jobType: document.getElementById('job-type').value,
            salary: document.getElementById('salary').value.trim(),
            category: document.getElementById('category').value,
            experienceLevel: document.getElementById('experience-level').value,
            educationLevel: document.getElementById('education-level').value,
            description: document.getElementById('job-description').innerHTML,
            requirements: Array.from(document.querySelectorAll('.requirement-input'))
                .map(input => input.value.trim())
                .filter(Boolean),
            responsibilities: Array.from(document.querySelectorAll('.responsibility-input'))
                .map(input => input.value.trim())
                .filter(Boolean),
            applicationEmail: document.getElementById('application-email').value.trim(),
            applicationUrl: document.getElementById('application-url').value.trim(),
            isRemote: document.getElementById('is-remote').checked,
            isFeatured: document.getElementById('is-featured').checked,
            postingDate: document.getElementById('posting-date').value,
            applicationDeadline: document.getElementById('application-deadline').value,
            employerId: window.auth.currentUser.uid,
            status: 'active', // or 'draft', 'closed', etc.
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + 
            (this.isEditMode ? 'Updating...' : 'Posting...');
        
        try {
            let result;
            
            if (this.isEditMode) {
                // Update existing job
                result = await this.jobService.updateJob(this.jobId, formData);
            } else {
                // Create new job
                result = await this.jobService.createJob(formData);
            }
            
            if (result.success) {
                showSuccess(
                    this.isEditMode 
                        ? 'Job updated successfully!' 
                        : 'Job posted successfully!'
                );
                
                // Redirect to job details or dashboard after a short delay
                setTimeout(() => {
                    window.location.href = this.isEditMode 
                        ? `/job-details.html?id=${this.jobId}`
                        : '/employer/dashboard.html';
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to process job');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            showError(
                error.message || 
                `Failed to ${this.isEditMode ? 'update' : 'post'} job. Please try again.`
            );
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    previewJob() {
        // In a real app, you would open a modal or new tab with the job preview
        // For now, we'll just show an alert with the form data
        const formData = new FormData(document.getElementById('job-post-form'));
        const previewData = {};
        
        for (let [key, value] of formData.entries()) {
            previewData[key] = value;
        }
        
        // Add requirements and responsibilities
        previewData.requirements = Array.from(document.querySelectorAll('.requirement-input'))
            .map(input => input.value.trim())
            .filter(Boolean);
            
        previewData.responsibilities = Array.from(document.querySelectorAll('.responsibility-input'))
            .map(input => input.value.trim())
            .filter(Boolean);
        
        console.log('Job Preview:', previewData);
        
        // In a real app, you would open a preview modal or page here
        alert('Preview functionality will be implemented here. Check the console for the form data.');
    }
}

// Initialize post job page when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('job-post-form')) {
        const JobServiceModule = await import('../services/job-service.js');
        const JobService = JobServiceModule.default || JobServiceModule.JobService;
        new PostJobPage(new JobService());
    }
});
