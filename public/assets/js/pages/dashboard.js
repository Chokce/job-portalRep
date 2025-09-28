// User dashboard functionality
import { showError, showSuccess } from '../utils/helpers.js';

export class DashboardPage {
    constructor(jobService) {
        this.jobService = jobService;
        this.currentTab = this.getCurrentTab();
        this.init();
    }

    getCurrentTab() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'overview';
        return ['overview', 'applications', 'saved-jobs', 'profile'].includes(tab) ? tab : 'overview';
    }

    async init() {
        // Check if user is logged in
        if (!window.auth.currentUser) {
            window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
            return;
        }

        this.setupUI();
        this.setupEventListeners();
        await this.loadUserData();
        this.loadTabContent();
    }

    setupUI() {
        // Set active tab
        const tabLinks = document.querySelectorAll('.dashboard-nav a');
        tabLinks.forEach(link => {
            if (link.getAttribute('href').includes(this.currentTab)) {
                link.classList.add('active');
                // Update page title based on tab
                const tabName = link.textContent.trim();
                document.title = `${tabName} | Dashboard | JobConnect`;
            } else {
                link.classList.remove('active');
            }
        });

        // Show loading state
        this.showLoading(true);
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.dashboard-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.currentTarget.getAttribute('href').split('=')[1];
                this.switchTab(tab);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }
    }

    async loadUserData() {
        try {
            // In a real app, you would fetch user data from your backend
            // For now, we'll use a timeout to simulate loading
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Simulated user data
            this.userData = {
                displayName: window.auth.currentUser.displayName || 'User',
                email: window.auth.currentUser.email,
                photoURL: window.auth.currentUser.photoURL || 'https://via.placeholder.com/150',
                userType: 'candidate', // or 'employer'
                joinedDate: new Date(window.auth.currentUser.metadata.creationTime).toLocaleDateString(),
                lastLogin: new Date(window.auth.currentUser.metadata.lastSignInTime).toLocaleString(),
                applications: [],
                savedJobs: []
            };
            
            // Update UI with user data
            this.updateUserInfo();
            
        } catch (error) {
            console.error('Error loading user data:', error);
            showError('Failed to load user data. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    updateUserInfo() {
        // Update welcome message and profile info
        const welcomeMsg = document.getElementById('welcome-msg');
        const userAvatar = document.getElementById('user-avatar');
        const userEmail = document.getElementById('user-email');
        const memberSince = document.getElementById('member-since');
        
        if (welcomeMsg) welcomeMsg.textContent = `Welcome back, ${this.userData.displayName}!`;
        if (userAvatar) userAvatar.src = this.userData.photoURL;
        if (userEmail) userEmail.textContent = this.userData.email;
        if (memberSince) memberSince.textContent = `Member since ${this.userData.joinedDate}`;
        
        // Update profile form if it exists
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.elements['fullName'].value = this.userData.displayName;
            profileForm.elements['email'].value = this.userData.email;
            // Add more fields as needed
        }
    }

    async loadTabContent() {
        const contentArea = document.querySelector('.dashboard-content');
        if (!contentArea) return;

        this.showLoading(true);
        
        try {
            let content = '';
            
            switch (this.currentTab) {
                case 'overview':
                    content = await this.getOverviewContent();
                    break;
                case 'applications':
                    content = await this.getApplicationsContent();
                    break;
                case 'saved-jobs':
                    content = await this.getSavedJobsContent();
                    break;
                case 'profile':
                    content = this.getProfileContent();
                    break;
                default:
                    content = await this.getOverviewContent();
            }
            
            contentArea.innerHTML = content;
            this.setupTabSpecificHandlers();
            
        } catch (error) {
            console.error(`Error loading ${this.currentTab} content:`, error);
            contentArea.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load ${this.currentTab} content. Please try again later.</p>
                </div>
            `;
        } finally {
            this.showLoading(false);
        }
    }

    async getOverviewContent() {
        // In a real app, you would fetch this data from your backend
        const stats = {
            applications: 12,
            savedJobs: 5,
            interviews: 3,
            profileStrength: 75
        };
        
        const recentApplications = [
            { id: 1, jobTitle: 'Senior Frontend Developer', company: 'Tech Corp', status: 'In Review', date: '2023-06-15' },
            { id: 2, jobTitle: 'UX Designer', company: 'Design Hub', status: 'Interview', date: '2023-06-10' },
            { id: 3, jobTitle: 'Product Manager', company: 'Product Labs', status: 'Applied', date: '2023-06-05' }
        ];
        
        const recommendedJobs = [
            { id: 101, title: 'Full Stack Developer', company: 'Web Solutions Inc', location: 'Remote', type: 'Full-time' },
            { id: 102, title: 'UI/UX Designer', company: 'Creative Minds', location: 'New York, NY', type: 'Contract' },
            { id: 103, title: 'DevOps Engineer', company: 'Cloud Systems', location: 'San Francisco, CA', type: 'Full-time' }
        ];
        
        return `
            <div class="dashboard-overview">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-file-alt"></i></div>
                        <div class="stat-details">
                            <h3>${stats.applications}</h3>
                            <p>Applications</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-bookmark"></i></div>
                        <div class="stat-details">
                            <h3>${stats.savedJobs}</h3>
                            <p>Saved Jobs</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                        <div class="stat-details">
                            <h3>${stats.interviews}</h3>
                            <p>Interviews</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                        <div class="stat-details">
                            <h3>${stats.profileStrength}%</h3>
                            <p>Profile Strength</p>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-section">
                    <div class="section-header">
                        <h2>Recent Applications</h2>
                        <a href="?tab=applications" class="view-all">View All</a>
                    </div>
                    <div class="applications-list">
                        ${recentApplications.length > 0 ? 
                            recentApplications.map(app => `
                                <div class="application-item">
                                    <div class="application-details">
                                        <h3>${app.jobTitle}</h3>
                                        <p class="company">${app.company}</p>
                                        <span class="status ${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span>
                                    </div>
                                    <div class="application-date">
                                        ${new Date(app.date).toLocaleDateString()}
                                    </div>
                                </div>
                            `).join('') : 
                            '<p class="no-data">No recent applications found.</p>'
                        }
                    </div>
                </div>
                
                <div class="dashboard-section">
                    <div class="section-header">
                        <h2>Recommended Jobs</h2>
                    </div>
                    <div class="jobs-grid">
                        ${recommendedJobs.length > 0 ? 
                            recommendedJobs.map(job => `
                                <div class="job-card">
                                    <h3>${job.title}</h3>
                                    <p class="company">${job.company}</p>
                                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${job.location}</p>
                                    <span class="job-type">${job.type}</span>
                                    <div class="job-actions">
                                        <a href="/job-details.html?id=${job.id}" class="btn btn-outline">View Details</a>
                                        <button class="btn btn-primary apply-now" data-job-id="${job.id}">Apply Now</button>
                                    </div>
                                </div>
                            `).join('') : 
                            '<p class="no-data">No recommended jobs at the moment.</p>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    async getApplicationsContent() {
        // In a real app, you would fetch this data from your backend
        const applications = [
            { 
                id: 1, 
                jobId: 101,
                jobTitle: 'Senior Frontend Developer', 
                company: 'Tech Corp', 
                status: 'In Review', 
                appliedDate: '2023-06-15',
                lastUpdated: '2023-06-16',
                notes: 'Technical interview scheduled for next week.'
            },
            { 
                id: 2, 
                jobId: 102,
                jobTitle: 'UX Designer', 
                company: 'Design Hub', 
                status: 'Interview', 
                appliedDate: '2023-06-10',
                lastUpdated: '2023-06-12',
                notes: 'Waiting for feedback from the second interview.'
            },
            { 
                id: 3, 
                jobId: 103,
                jobTitle: 'Product Manager', 
                company: 'Product Labs', 
                status: 'Applied', 
                appliedDate: '2023-06-05',
                lastUpdated: '2023-06-05',
                notes: 'Application submitted successfully.'
            }
        ];
        
        return `
            <div class="dashboard-applications">
                <div class="section-header">
                    <h2>My Job Applications</h2>
                    <div class="filters">
                        <select id="status-filter" class="form-control">
                            <option value="">All Statuses</option>
                            <option value="applied">Applied</option>
                            <option value="review">In Review</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <input type="text" id="search-applications" class="form-control" placeholder="Search applications...">
                    </div>
                </div>
                
                <div class="applications-table">
                    <div class="table-header">
                        <div class="col job">Job</div>
                        <div class="col status">Status</div>
                        <div class="col date">Applied On</div>
                        <div class="col actions">Actions</div>
                    </div>
                    
                    <div class="table-body">
                        ${applications.length > 0 ? 
                            applications.map(app => `
                                <div class="table-row" data-status="${app.status.toLowerCase().replace(' ', '-')}">
                                    <div class="col job">
                                        <h4>${app.jobTitle}</h4>
                                        <p class="company">${app.company}</p>
                                    </div>
                                    <div class="col status">
                                        <span class="status-badge ${app.status.toLowerCase().replace(' ', '-')}">
                                            ${app.status}
                                        </span>
                                    </div>
                                    <div class="col date">
                                        ${new Date(app.appliedDate).toLocaleDateString()}
                                    </div>
                                    <div class="col actions">
                                        <a href="/job-details.html?id=${app.jobId}" class="btn-icon" title="View Job">
                                            <i class="fas fa-eye"></i>
                                        </a>
                                        <button class="btn-icon" title="View Application" data-application-id="${app.id}">
                                            <i class="fas fa-file-alt"></i>
                                        </button>
                                        <button class="btn-icon text-danger" title="Withdraw Application" data-application-id="${app.id}">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('') : 
                            '<div class="no-data">No job applications found. <a href="/find-jobs.html">Browse jobs</a> to apply.</div>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    async getSavedJobsContent() {
        // In a real app, you would fetch this data from your backend
        const savedJobs = [
            { 
                id: 201, 
                title: 'Senior Frontend Developer', 
                company: 'Tech Corp', 
                location: 'San Francisco, CA',
                type: 'Full-time',
                salary: '$120,000 - $150,000',
                savedDate: '2023-06-10',
                expiresIn: '7 days'
            },
            { 
                id: 202, 
                title: 'UX Designer', 
                company: 'Design Hub', 
                location: 'Remote',
                type: 'Contract',
                salary: '$50 - $70/hr',
                savedDate: '2023-06-05',
                expiresIn: '3 days'
            },
            { 
                id: 203, 
                title: 'Product Manager', 
                company: 'Product Labs', 
                location: 'New York, NY',
                type: 'Full-time',
                salary: '$130,000 - $160,000',
                savedDate: '2023-05-28',
                expiresIn: 'Expired'
            }
        ];
        
        return `
            <div class="dashboard-saved-jobs">
                <div class="section-header">
                    <h2>Saved Jobs</h2>
                    <div class="filters">
                        <select id="job-type-filter" class="form-control">
                            <option value="">All Types</option>
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                            <option value="remote">Remote</option>
                        </select>
                    </div>
                </div>
                
                <div class="saved-jobs-list">
                    ${savedJobs.length > 0 ? 
                        savedJobs.map(job => `
                            <div class="saved-job-item" data-type="${job.type.toLowerCase()}">
                                <div class="job-info">
                                    <h3>${job.title}</h3>
                                    <p class="company">${job.company}</p>
                                    <div class="job-meta">
                                        <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                                        <span class="job-type">${job.type}</span>
                                        <span class="salary"><i class="fas fa-money-bill-wave"></i> ${job.salary}</span>
                                    </div>
                                    <div class="job-actions">
                                        <a href="/job-details.html?id=${job.id}" class="btn btn-outline">View Details</a>
                                        <button class="btn btn-primary apply-now" data-job-id="${job.id}">Apply Now</button>
                                    </div>
                                </div>
                                <div class="saved-job-footer">
                                    <span class="saved-date">Saved on ${new Date(job.savedDate).toLocaleDateString()}</span>
                                    <span class="expires">
                                        ${job.expiresIn === 'Expired' ? 
                                            '<span class="text-danger">Expired</span>' : 
                                            `Expires in ${job.expiresIn}`
                                        }
                                    </span>
                                    <button class="btn-link text-danger remove-saved" data-job-id="${job.id}">
                                        <i class="fas fa-trash-alt"></i> Remove
                                    </button>
                                </div>
                            </div>
                        `).join('') : 
                        '<div class="no-data">No saved jobs found. <a href="/find-jobs.html">Browse jobs</a> to save for later.</div>'
                    }
                </div>
            </div>
        `;
    }

    getProfileContent() {
        return `
            <div class="dashboard-profile">
                <div class="row">
                    <div class="col-md-4">
                        <div class="profile-card">
                            <div class="profile-image">
                                <img src="${this.userData.photoURL}" alt="${this.userData.displayName}" id="profile-avatar">
                                <label for="avatar-upload" class="change-avatar">
                                    <i class="fas fa-camera"></i>
                                    <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
                                </label>
                            </div>
                            <h3>${this.userData.displayName}</h3>
                            <p class="text-muted">${this.userData.userType === 'employer' ? 'Employer' : 'Job Seeker'}</p>
                            
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <i class="fas fa-envelope"></i>
                                    <div>
                                        <p>Email</p>
                                        <h4>${this.userData.email}</h4>
                                    </div>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-calendar-alt"></i>
                                    <div>
                                        <p>Member Since</p>
                                        <h4>${this.userData.joinedDate}</h4>
                                    </div>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-sign-in-alt"></i>
                                    <div>
                                        <p>Last Login</p>
                                        <h4>${this.userData.lastLogin}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="profile-links">
                            <a href="#" class="profile-link">
                                <i class="fas fa-lock"></i> Change Password
                            </a>
                            <a href="#" class="profile-link">
                                <i class="fas fa-bell"></i> Notification Settings
                            </a>
                            <a href="#" class="profile-link">
                                <i class="fas fa-shield-alt"></i> Privacy Settings
                            </a>
                            <button id="delete-account" class="profile-link text-danger">
                                <i class="fas fa-trash-alt"></i> Delete Account
                            </button>
                        </div>
                    </div>
                    
                    <div class="col-md-8">
                        <div class="profile-details">
                            <div class="section-header">
                                <h2>Edit Profile</h2>
                                <p>Update your personal information and preferences</p>
                            </div>
                            
                            <form id="profile-form" class="profile-form">
                                <div class="form-group">
                                    <label for="fullName">Full Name</label>
                                    <input type="text" id="fullName" name="fullName" class="form-control" value="${this.userData.displayName}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="email">Email Address</label>
                                    <input type="email" id="email" name="email" class="form-control" value="${this.userData.email}" disabled>
                                    <small class="form-text text-muted">Contact support to change your email address</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="phone">Phone Number</label>
                                    <input type="tel" id="phone" name="phone" class="form-control" placeholder="+1 (123) 456-7890">
                                </div>
                                
                                <div class="form-group">
                                    <label for="location">Location</label>
                                    <input type="text" id="location" name="location" class="form-control" placeholder="City, Country">
                                </div>
                                
                                <div class="form-group">
                                    <label for="headline">Professional Headline</label>
                                    <input type="text" id="headline" name="headline" class="form-control" placeholder="e.g. Senior Software Engineer">
                                </div>
                                
                                <div class="form-group">
                                    <label for="bio">Professional Summary</label>
                                    <textarea id="bio" name="bio" class="form-control" rows="4" placeholder="Tell us about yourself and your professional experience..."></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label>Skills</label>
                                    <div class="skills-container">
                                        <input type="text" id="skills-input" class="form-control" placeholder="Add skills (e.g., JavaScript, UX Design, Project Management)">
                                        <div id="skills-tags" class="skills-tags">
                                            <!-- Skill tags will be added here -->
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>Resume/CV</label>
                                    <div class="file-upload">
                                        <input type="file" id="resume" class="form-control-file" accept=".pdf,.doc,.docx">
                                        <label for="resume" class="btn btn-outline">
                                            <i class="fas fa-upload"></i> Upload Resume
                                        </label>
                                        <small class="form-text text-muted">PDF, DOC, DOCX (Max 5MB)</small>
                                    </div>
                                    <div id="resume-preview" class="resume-preview">
                                        <!-- Resume preview will be shown here -->
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="button" class="btn btn-outline" id="cancel-changes">Cancel</button>
                                    <button type="submit" class="btn btn-primary" id="save-profile">
                                        <i class="fas fa-save"></i> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupTabSpecificHandlers() {
        // Set up handlers specific to the current tab
        switch (this.currentTab) {
            case 'applications':
                this.setupApplicationsHandlers();
                break;
            case 'saved-jobs':
                this.setupSavedJobsHandlers();
                break;
            case 'profile':
                this.setupProfileHandlers();
                break;
        }
    }

    setupApplicationsHandlers() {
        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                const status = e.target.value;
                const rows = document.querySelectorAll('.table-row');
                
                rows.forEach(row => {
                    if (!status || row.dataset.status === status) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        }
        
        // Search functionality
        const searchInput = document.getElementById('search-applications');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('.table-row');
                
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        }
        
        // Application actions
        document.querySelectorAll('.table-row .actions button').forEach(button => {
            button.addEventListener('click', (e) => {
                const applicationId = e.currentTarget.dataset.applicationId;
                const action = e.currentTarget.title;
                
                if (action === 'View Application') {
                    this.viewApplication(applicationId);
                } else if (action === 'Withdraw Application') {
                    this.withdrawApplication(applicationId);
                }
            });
        });
    }

    setupSavedJobsHandlers() {
        // Job type filter
        const jobTypeFilter = document.getElementById('job-type-filter');
        if (jobTypeFilter) {
            jobTypeFilter.addEventListener('change', (e) => {
                const type = e.target.value;
                const jobs = document.querySelectorAll('.saved-job-item');
                
                jobs.forEach(job => {
                    if (!type || job.dataset.type === type) {
                        job.style.display = '';
                    } else {
                        job.style.display = 'none';
                    }
                });
            });
        }
        
        // Remove saved job
        document.querySelectorAll('.remove-saved').forEach(button => {
            button.addEventListener('click', async (e) => {
                const jobId = e.currentTarget.dataset.jobId;
                const jobItem = e.currentTarget.closest('.saved-job-item');
                
                if (confirm('Are you sure you want to remove this job from your saved list?')) {
                    try {
                        // In a real app, you would call your API to remove the saved job
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Remove from UI
                        jobItem.style.opacity = '0';
                        setTimeout(() => {
                            jobItem.remove();
                            
                            // Show message if no jobs left
                            const remainingJobs = document.querySelectorAll('.saved-job-item');
                            if (remainingJobs.length === 0) {
                                const container = document.querySelector('.saved-jobs-list');
                                container.innerHTML = '<div class="no-data">No saved jobs found. <a href="/find-jobs.html">Browse jobs</a> to save for later.</div>';
                            }
                        }, 300);
                        
                        showSuccess('Job removed from saved list');
                    } catch (error) {
                        console.error('Error removing saved job:', error);
                        showError('Failed to remove job. Please try again.');
                    }
                }
            });
        });
        
        // Apply now button
        document.querySelectorAll('.apply-now').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const jobId = e.currentTarget.dataset.jobId;
                window.location.href = `/apply.html?jobId=${jobId}`;
            });
        });
    }

    setupProfileHandlers() {
        // Avatar upload
        const avatarUpload = document.getElementById('avatar-upload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                // Check file type
                if (!file.type.startsWith('image/')) {
                    showError('Please upload an image file (JPEG, PNG, etc.)');
                    return;
                }
                
                // Check file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    showError('Image size should not exceed 2MB');
                    return;
                }
                
                // Preview image
                const reader = new FileReader();
                reader.onload = (e) => {
                    const avatar = document.getElementById('profile-avatar');
                    if (avatar) {
                        avatar.src = e.target.result;
                        // In a real app, you would upload the image to your server here
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        
        // Skills input
        const skillsInput = document.getElementById('skills-input');
        const skillsTags = document.getElementById('skills-tags');
        
        if (skillsInput && skillsTags) {
            skillsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const value = skillsInput.value.trim();
                    if (value) {
                        this.addSkillTag(value);
                        skillsInput.value = '';
                    }
                }
            });
            
            // Load saved skills (in a real app, these would come from the backend)
            const savedSkills = ['JavaScript', 'React', 'Node.js'];
            savedSkills.forEach(skill => this.addSkillTag(skill));
        }
        
        // Resume upload
        const resumeInput = document.getElementById('resume');
        const resumePreview = document.getElementById('resume-preview');
        
        if (resumeInput && resumePreview) {
            resumeInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                // Check file type
                const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                if (!validTypes.includes(file.type)) {
                    showError('Please upload a valid resume file (PDF, DOC, or DOCX)');
                    resumeInput.value = '';
                    return;
                }
                
                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showError('File size should not exceed 5MB');
                    resumeInput.value = '';
                    return;
                }
                
                // Show file info
                resumePreview.innerHTML = `
                    <div class="file-info">
                        <i class="fas fa-file-alt"></i>
                        <div>
                            <p class="file-name">${file.name}</p>
                            <p class="file-size">${this.formatFileSize(file.size)}</p>
                        </div>
                        <button type="button" class="btn-remove" id="remove-resume">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                
                // Add event listener for remove button
                const removeBtn = resumePreview.querySelector('#remove-resume');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        resumeInput.value = '';
                        resumePreview.innerHTML = '';
                    });
                }
            });
        }
        
        // Cancel changes button
        const cancelBtn = document.getElementById('cancel-changes');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to discard your changes?')) {
                    // Reload the form with saved data
                    this.loadTabContent();
                }
            });
        }
        
        // Delete account button
        const deleteAccountBtn = document.getElementById('delete-account');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDeleteAccount();
            });
        }
    }

    addSkillTag(skill) {
        const skillsTags = document.getElementById('skills-tags');
        if (!skillsTags) return;
        
        // Check if skill already exists
        const existingSkills = Array.from(skillsTags.querySelectorAll('.skill-tag'))
            .map(tag => tag.textContent.trim().replace('×', '').trim());
            
        if (existingSkills.includes(skill)) return;
        
        // Create and append new skill tag
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.innerHTML = `
            ${skill}
            <span class="remove-skill" data-skill="${skill}">&times;</span>
        `;
        
        // Add event listener for remove button
        const removeBtn = tag.querySelector('.remove-skill');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                tag.remove();
            });
        }
        
        skillsTags.appendChild(tag);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async viewApplication(applicationId) {
        // In a real app, you would fetch the full application details
        console.log('Viewing application:', applicationId);
        // Show a modal or navigate to a dedicated page
    }

    async withdrawApplication(applicationId) {
        if (confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
            try {
                // In a real app, you would call your API to withdraw the application
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Remove from UI
                const applicationRow = document.querySelector(`[data-application-id="${applicationId}"]`);
                if (applicationRow) {
                    applicationRow.style.opacity = '0';
                    setTimeout(() => {
                        applicationRow.remove();
                        
                        // Show message if no applications left
                        const remainingApps = document.querySelectorAll('.table-row');
                        if (remainingApps.length === 0) {
                            const container = document.querySelector('.table-body');
                            container.innerHTML = '<div class="no-data">No job applications found. <a href="/find-jobs.html">Browse jobs</a> to apply.</div>';
                        }
                    }, 300);
                }
                
                showSuccess('Application withdrawn successfully');
            } catch (error) {
                console.error('Error withdrawing application:', error);
                showError('Failed to withdraw application. Please try again.');
            }
        }
    }

    async handleProfileUpdate(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        try {
            // In a real app, you would validate the form data here
            // and send it to your backend
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Update UI
            showSuccess('Profile updated successfully');
            
            // Update user data
            this.userData = {
                ...this.userData,
                displayName: formData.get('fullName') || this.userData.displayName,
                // Update other fields as needed
            };
            
            // Update welcome message and other UI elements
            this.updateUserInfo();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showError('Failed to update profile. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    async handleDeleteAccount() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.')) {
            try {
                // In a real app, you would call your API to delete the account
                // and then sign the user out
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Sign out and redirect to home page
                await window.auth.signOut();
                window.location.href = '/';
                
            } catch (error) {
                console.error('Error deleting account:', error);
                showError('Failed to delete account. Please try again.');
            }
        }
    }

    async handleLogout() {
        try {
            await window.auth.signOut();
            window.location.href = '/';
        } catch (error) {
            console.error('Error signing out:', error);
            showError('Failed to sign out. Please try again.');
        }
    }

    switchTab(tab) {
        if (tab === this.currentTab) return;
        
        // Update URL without page reload
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('tab', tab);
        window.history.pushState({}, '', newUrl);
        
        // Update current tab and reload content
        this.currentTab = tab;
        this.loadTabContent();
        
        // Update active tab in navigation
        document.querySelectorAll('.dashboard-nav a').forEach(link => {
            if (link.getAttribute('href').includes(tab)) {
                link.classList.add('active');
                // Update page title based on tab
                const tabName = link.textContent.trim();
                document.title = `${tabName} | Dashboard | JobConnect`;
            } else {
                link.classList.remove('active');
            }
        });
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        const contentArea = document.querySelector('.dashboard-content');
        
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
        }
        
        if (contentArea) {
            contentArea.style.opacity = show ? '0.5' : '1';
            contentArea.style.pointerEvents = show ? 'none' : 'auto';
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    if (document.querySelector('.dashboard-container')) {
        const { JobService } = await import('../services/job-service.js');
        new DashboardPage(new JobService());
    }
});
