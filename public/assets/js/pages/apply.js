
import { showError, showSuccess, validateEmail } from '../utils/helpers.js';
import JobService from '../services/job-service.js';

class ApplyPage {
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
            const result = await this.jobService.getJob(this.jobId);
            
            if (result.success) {
                jobTitle.textContent = result.job.title;
                companyName.textContent = result.job.company || 'the company';
                this.jobEmployerId = result.job.postedBy || result.job.employerId || null;
                document.title = `Apply for ${result.job.title} at ${result.job.company || 'Company'} | JobConnect`;
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
        if (this.resumeInput && this.resumePreview) {
            this.resumeInput.addEventListener('change', (e) => this.handleResumeUpload(e));
        }

        if (this.applicationForm) {
            this.applicationForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to cancel?')) {
                    window.history.back();
                }
            });
        }
    }

    handleResumeUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            showError('Please upload a valid resume file (PDF, DOC, or DOCX)');
            this.resumeInput.value = '';
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showError('File size should not exceed 5MB');
            this.resumeInput.value = '';
            return;
        }

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
        const requiredFields = ['fullName', 'email', 'phone'];

        requiredFields.forEach(field => {
            if (!formData.get(field)?.trim()) {
                errors.push(`${this.formatFieldName(field)} is required`);
            }
        });

        if (formData.get('email') && !validateEmail(formData.get('email'))) {
            errors.push('Please enter a valid email address');
        }

        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
        if (formData.get('phone') && !phoneRegex.test(formData.get('phone'))) {
            errors.push('Please enter a valid phone number');
        }

        if (!this.resumeInput.files || this.resumeInput.files.length === 0) {
            errors.push('Please upload your resume');
        }

        return errors;
    }

    formatFieldName(field) {
        return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(this.applicationForm);
        const errors = this.validateForm(formData);
        
        if (errors.length > 0) {
            showError(errors.join('<br>'));
            return;
        }

        const submitBtn = this.applicationForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            const applicationData = {
                jobId: this.jobId,
                userId: window.auth.currentUser.uid,
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                coverLetter: formData.get('coverLetter'),
                employerId: this.jobEmployerId
            };

            const res = await this.jobService.applyForJob(applicationData);

            if (res.success) {
                showSuccess('Application submitted successfully!');
                setTimeout(() => {
                    window.location.href = '/dashboard.html?tab=applications';
                }, 2000);
            } else {
                throw new Error(res.message || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            showError(error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('application-form')) {
        new ApplyPage(JobService);
    }
});
