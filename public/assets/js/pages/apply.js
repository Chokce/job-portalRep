// Job application page functionality
import { showError, showSuccess, validateEmail } from '../utils/helpers.js';

export class ApplyPage {
    constructor(jobService) {
        this.jobService = jobService;
        this.jobId = this.getJobIdFromUrl();
        this.applicationForm = document.getElementById('application-form');
        this.resumeInput = document.getElementById('resume');
        this.resumePreview = document.getElementById('resume-preview');
        this.init();
    }

    getJobIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('jobId');
    }

    async init() {
        if (!this.jobId) {
            showError('No job specified for application');
            window.location.href = '/find-jobs.html';
            return;
        }

        // Check if user is logged in
        if (!window.auth.currentUser) {
            window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
            return;
        }

        this.setupEventListeners();
        await this.loadJobDetails();
    }

    async loadJobDetails() {
        const jobTitle = document.getElementById('job-title');
        const companyName = document.getElementById('company-name');
        
        if (!jobTitle || !companyName) return;

        try {
            const result = await this.jobService.getJobById(this.jobId);
            
            if (result.success) {
                jobTitle.textContent = result.data.title;
                companyName.textContent = result.data.company || 'the company';
                // keep employer id for apply
                this.jobEmployerId = result.data.postedBy || result.data.employerId || null;
                
                // Update page title
                document.title = `Apply for ${result.data.title} at ${result.data.company || 'Company'} | JobConnect`;
            } else {
                showError('Failed to load job details');
                window.location.href = '/find-jobs.html';
            }
        } catch (error) {
            console.error('Error loading job details:', error);
            showError('An error occurred while loading job details');
        }
    }

    setupEventListeners() {
        // Resume upload preview
        if (this.resumeInput && this.resumePreview) {
            this.resumeInput.addEventListener('change', (e) => this.handleResumeUpload(e));
        }

        // Form submission
        if (this.applicationForm) {
            this.applicationForm.addEventListener('submit', (e) => this.handleSubmit(e));
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
    }

    handleResumeUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Check file type (PDF, DOC, DOCX)
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            showError('Please upload a valid resume file (PDF, DOC, or DOCX)');
            this.resumeInput.value = '';
            return;
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showError('File size should not exceed 5MB');
            this.resumeInput.value = '';
            return;
        }

        // Display file info
        this.resumePreview.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-alt"></i>
                <div>
                    <p class="file-name">${file.name}</p>
                    <p class="file-size">${this.formatFileSize(file.size)}</p>
                </div>
            </div>
            <button type="button" class="btn-remove" id="remove-resume">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add event listener for remove button
        const removeBtn = this.resumePreview.querySelector('#remove-resume');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeResume());
        }
    }

    removeResume() {
        this.resumeInput.value = '';
        this.resumePreview.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Drag & drop your resume here or <span>browse</span></p>
            <p class="hint">Supports: PDF, DOC, DOCX (Max 5MB)</p>
        `;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    validateForm(formData) {
        const errors = [];
        
        // Required fields
        const requiredFields = ['fullName', 'email', 'phone'];
        requiredFields.forEach(field => {
            if (!formData.get(field)?.trim()) {
                errors.push(`${this.formatFieldName(field)} is required`);
            }
        });

        // Email validation
        if (formData.get('email') && !validateEmail(formData.get('email'))) {
            errors.push('Please enter a valid email address');
        }

        // Phone validation (simple check)
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
        if (formData.get('phone') && !phoneRegex.test(formData.get('phone'))) {
            errors.push('Please enter a valid phone number');
        }

        // Resume file check
        if (!this.resumeInput.files || this.resumeInput.files.length === 0) {
            errors.push('Please upload your resume');
        }

        return errors;
    }

    formatFieldName(field) {
        return field
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(this.applicationForm);
        const errors = this.validateForm(formData);
        
        if (errors.length > 0) {
            showError(errors.join('<br>'));
            return;
        }

        // Show loading state
        const submitBtn = this.applicationForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            // Create application document in Firestore
            const applicant = {
                uid: window.auth.currentUser.uid,
                email: window.auth.currentUser.email || null,
                employerId: this.jobEmployerId || null
            };
            const res = await this.jobService.applyToJob(this.jobId, applicant);
            if (!res.success) throw new Error(res.error || 'Failed to submit application');
            
            // Show success message
            showSuccess('Application submitted successfully!');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = '/dashboard.html?tab=applications';
            }, 2000);
            
        } catch (error) {
            console.error('Error submitting application:', error);
            showError('Failed to submit application. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Initialize apply page when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('application-form')) {
        const JobServiceModule = await import('../services/job-service.js');
        const JobService = JobServiceModule.default || JobServiceModule.JobService;
        new ApplyPage(new JobService());
    }
});
