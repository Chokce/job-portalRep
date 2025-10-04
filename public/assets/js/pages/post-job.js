
import JobService from '../services/job-service.js';
import { serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { auth } from '../firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

document.addEventListener('DOMContentLoaded', function() {
    const jobForm = document.getElementById('jobPostForm');
    const previewBtn = document.getElementById('previewBtn');
    const submitBtn = document.querySelector('.submit-job-btn');
    let currentUser = null;

    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in.
            currentUser = user;
            submitBtn.disabled = false;
        } else {
            // User is signed out.
            currentUser = null;
            submitBtn.disabled = true;
        }
    });

    jobForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            alert('You must be logged in to post a job. Please wait for authentication to complete or log in.');
            return;
        }

        const formData = new FormData(jobForm);
        const jobData = Object.fromEntries(formData);
        
        if (!jobData.title || !jobData.company || !jobData.location || 
            !jobData.jobType || !jobData.description || !jobData.salaryMin || !jobData.salaryMax || 
            !jobData.contactEmail) {
            alert('Please fill in all required fields.');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(jobData.contactEmail)) {
            alert('Please enter a valid email address.');
            return;
        }
        
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting Job...';
        submitBtn.disabled = true;

        jobData.createdAt = serverTimestamp();
        jobData.postedBy = currentUser.uid; // Use the reliable user object

        const result = await JobService.addJob(jobData);

        if (result.success) {
            alert('Job posted successfully!');
            jobForm.reset();
        } else {
            // The error from Firestore will be more specific now if it still fails
            alert('Error posting job: ' + result.message);
        }

        submitBtn.innerHTML = originalText;
        // Re-enable based on auth state, not just after submission
        if (currentUser) {
            submitBtn.disabled = false;
        }
    });
    
    previewBtn.addEventListener('click', function() {
        const formData = new FormData(jobForm);
        const jobData = Object.fromEntries(formData);
        
        if (!jobData.title || !jobData.company) {
            alert('Please fill in at least the job title and company name to preview.');
            return;
        }
        
        const previewContent = `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <h2 style="color: #2c3e50; margin-bottom: 10px;">${jobData.title || 'Job Title'}</h2>
                <p style="color: #666; margin-bottom: 20px;"><strong>${jobData.company || 'Company Name'}</strong> • ${jobData.location || 'Location'}</p>
                
                <div style="margin-bottom: 20px;">
                    <strong>Job Type:</strong> ${jobData.jobType || 'Not specified'}<br>
                    <strong>Salary:</strong> $${jobData.salaryMin || 'N/A'} - $${jobData.salaryMax || 'N/A'}<br>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4>Job Description:</h4>
                    <p style="white-space: pre-line;">${jobData.description || 'No description provided'}</p>
                </div>
                
                <button onclick="this.parentElement.parentElement.remove()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close Preview</button>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; box-sizing: border-box;';
        modal.innerHTML = previewContent;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    });
});
