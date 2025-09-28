
import { auth } from '../firebase-init.js';
import AuthService from '../services/auth-service.js';
import JobService from '../services/job-service.js';

document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(async user => {
        if (user) {
            const userInitial = document.getElementById('userInitial');
            const userResult = await AuthService.getUser(user.uid);

            if (userResult.success) {
                const userData = userResult.user;
                if (userData.firstName && userData.lastName) {
                    const initials = (userData.firstName[0] + userData.lastName[0]).toUpperCase();
                    userInitial.textContent = initials;
                }
            }

            const result = await JobService.getJobs();

            if (result.success) {
                renderMyJobs(result.jobs);
            } else {
                console.error(result.message);
            }

        } else {
            window.location.href = 'login.html';
        }
    });

    function renderMyJobs(jobs) {
        const jobHistory = document.querySelector('.job-history');
        jobHistory.innerHTML = '<h2>All Posted Jobs</h2>'; // Changed title for clarity

        if (jobs.length === 0) {
            jobHistory.innerHTML += '<p>No jobs have been posted yet.</p>';
            return;
        }

        jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.innerHTML = `
                <h3>${job.title}</h3>
                <div class="job-meta">
                    <span><i class="fas fa-building"></i> ${job.company}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span><i class="fas fa-clock"></i> ${job.jobType}</span>
                </div>
                <div class="job-actions">
                    <button class="btn btn-outline">View Details</button>
                </div>
            `;
            jobHistory.appendChild(jobCard);
        });
    }
});
