
import JobService from '../services/job-service.js';
import { db, storage } from '../firebase-init.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';

document.addEventListener('DOMContentLoaded', async function() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');
    
    mobileMenu.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(item => {
                    item.classList.remove('active');
                });
                this.classList.add('active');
                if (window.innerWidth <= 968) {
                    navMenu.classList.remove('active');
                    mobileMenu.classList.remove('active');
                }
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 70,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        if (window.innerWidth <= 968) {
            item.addEventListener('click', function(e) {
                if (e.target.classList.contains('nav-link')) {
                    const dropdown = this.querySelector('.dropdown');
                    if (dropdown) {
                        e.preventDefault();
                        dropdown.classList.toggle('show');
                    }
                }
            });
        }
    });

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }

    const registerBtn = document.getElementById('register-btn');
    if(registerBtn) {
        registerBtn.addEventListener('click', function() {
            window.location.href = 'register.html';
        });
    }

    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('.page-section, .hero');
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 100)) {
                currentSection = section.getAttribute('id');
            }
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === currentSection) {
                link.classList.add('active');
            }
        });
    });

    const closeModal = document.getElementById('close-modal');
    if(closeModal) {
        closeModal.addEventListener('click', function() {
            document.getElementById('apply-modal').style.display = 'none';
        });
    }

    const applyForm = document.getElementById('apply-form');
    if(applyForm) {
        applyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('applicant-name').value;
            const email = document.getElementById('applicant-email').value;
            const cv = document.getElementById('applicant-cv').files[0];
            const jobTitle = document.getElementById('apply-job-title').textContent;

            if (!name || !email || !cv) {
                alert('Please fill all fields and upload your CV.');
                return;
            }

            const submitBtn = applyForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            try {
                const cvRef = ref(storage, `cvs/${cv.name}`);
                await uploadBytes(cvRef, cv);
                const cvUrl = await getDownloadURL(cvRef);

                await addDoc(collection(db, "applications"), {
                    name: name,
                    email: email,
                    jobTitle: jobTitle,
                    cv: cvUrl,
                    appliedAt: new Date()
                });
                alert('Application submitted successfully!');
                window.location.reload();
            } catch (error) {
                console.error("Error adding document: ", error);
                alert('Error submitting application. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    document.querySelectorAll('.workflow-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            document.querySelectorAll('.workflow-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.workflow-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    const searchJobsBtn = document.getElementById('search-jobs-btn');
    if (searchJobsBtn) {
        searchJobsBtn.addEventListener('click', function() {
            const keyword = document.getElementById('keyword-input').value;
            const location = document.getElementById('location-input').value;
            const searchURL = `find-jobs.html?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
            window.location.href = searchURL;
        });
    }

    const jobsGrid = document.getElementById('jobs-grid');

    function renderJobs(jobs) {
        jobsGrid.innerHTML = '';
        jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.innerHTML = `
                <div class="job-header">
                    <h3 class="job-title">${job.title}</h3>
                    <div class="job-company">
                        <div class="company-logo">TC</div>
                        <div>
                            <h4>${job.company}</h4>
                            <p>${job.location}</p>
                        </div>
                    </div>
                    <div class="job-info">
                        <span><i class="fas fa-dollar-sign"></i> ${job.salaryMin} - ${job.salaryMax}</span>
                        <span><i class="fas fa-clock"></i> ${job.jobType}</span>
                        <span><i class="fas fa-briefcase"></i> ${job.experienceLevel}</span>
                    </div>
                </div>
                <div class="job-footer">
                    <span class="job-type ${job.jobType.toLowerCase().replace(' ', '-')}">${job.jobType}</span>
                    <button class="btn btn-primary">Apply Now</button>
                </div>
            `;
            jobsGrid.appendChild(jobCard);
        });

        document.querySelectorAll('.job-card .btn-primary').forEach(button => {
            button.addEventListener('click', function() {
                const jobTitle = this.closest('.job-card').querySelector('.job-title').textContent;
                document.getElementById('apply-job-title').textContent = jobTitle;
                document.getElementById('apply-modal').style.display = 'flex';
            });
        });
    }

    const result = await JobService.getJobs();
    if (result.success) {
        renderJobs(result.jobs.slice(0, 6)); // Display only the first 6 jobs
    } else {
        console.error(result.message);
    }
});
