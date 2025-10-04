import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

const db = getFirestore();
const auth = getAuth();

document.addEventListener('DOMContentLoaded', () => {
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const jobsAppliedCount = document.getElementById('jobs-applied-count');
    const jobsSavedCount = document.getElementById('jobs-saved-count');
    const profileViewsCount = document.getElementById('profile-views-count');
    const savedJobsPane = document.getElementById('saved-jobs-tab-pane');
    const applicationHistoryPane = document.getElementById('application-history-tab-pane');
    const tabs = document.querySelectorAll('.tab-link');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            fetchDashboardData(user.uid);
            tabs.forEach(tab => {
                tab.addEventListener('click', () => switchTab(tab, user.uid));
            });
        } else {
            window.location.href = '/login.html';
        }
    });

    async function fetchDashboardData(userId) {
        try {
            // Fetch user profile
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                userName.textContent = userData.name || 'User';
                userEmail.textContent = userData.email;
                userAvatar.textContent = (userData.name || 'U').charAt(0).toUpperCase();
            }

            // Fetch applications and saved jobs concurrently
            const [applications, savedJobs] = await Promise.all([
                fetchApplications(userId),
                fetchSavedJobs(userId)
            ]);

            // Update stat cards
            jobsAppliedCount.textContent = applications.length;
            jobsSavedCount.textContent = savedJobs.length;
            profileViewsCount.textContent = '17'; // Placeholder

            // Render content
            renderApplicationHistory(applications);
            renderSavedJobs(savedJobs, userId);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            savedJobsPane.innerHTML = '<div class="empty-state"><p>Error loading data.</p></div>';
            applicationHistoryPane.innerHTML = '<div class="empty-state"><p>Error loading data.</p></div>';
        }
    }

    async function fetchApplications(userId) {
        const q = query(collection(db, 'applications'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return Promise.all(snapshot.docs.map(async (appDoc) => {
            const appData = appDoc.data();
            const jobDoc = await getDoc(doc(db, 'jobs', appData.jobId));
            return {
                id: appDoc.id,
                ...appData,
                job: jobDoc.exists() ? { ...jobDoc.data(), id: jobDoc.id } : null
            };
        }));
    }

    async function fetchSavedJobs(userId) {
        const q = query(collection(db, 'savedJobs'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return Promise.all(snapshot.docs.map(async (savedJobDoc) => {
            const savedJobData = savedJobDoc.data();
            const jobDoc = await getDoc(doc(db, 'jobs', savedJobData.jobId));
            return {
                id: savedJobDoc.id,
                ...savedJobData,
                job: jobDoc.exists() ? { ...jobDoc.data(), id: jobDoc.id } : null
            };
        }));
    }

    function renderApplicationHistory(applications) {
        applicationHistoryPane.innerHTML = '';
        if (applications.length === 0) {
            applicationHistoryPane.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-signature"></i>
                    <p>You haven't applied to any jobs yet.</p>
                    <a href="/find-jobs.html" class="btn btn-primary">Find Jobs Now</a>
                </div>`;
            return;
        }

        applications.forEach(app => {
            if (!app.job) return; // Skip if job details are missing
            const item = document.createElement('div');
            item.className = 'job-list-item';
            item.innerHTML = `
                <div class="job-info">
                    <h3>${app.job.title}</h3>
                    <p>${app.job.company} - ${app.job.location}</p>
                    <p>Applied on: ${new Date(app.submittedAt.seconds * 1000).toLocaleDateString()}</p>
                </div>
                <div class="job-actions">
                     <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span>
                    <a href="/job-details.html?id=${app.job.id}" class="btn btn-outline">View Job</a>
                </div>
            `;
            applicationHistoryPane.appendChild(item);
        });
    }

    function renderSavedJobs(savedJobs, userId) {
        savedJobsPane.innerHTML = '';
        if (savedJobs.length === 0) {
            savedJobsPane.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bookmark"></i>
                    <p>You have no saved jobs.</p>
                    <a href="/find-jobs.html" class="btn btn-primary">Find Jobs Now</a>
                </div>`;
            return;
        }

        savedJobs.forEach(saved => {
            if (!saved.job) return; // Skip if job details are missing
            const item = document.createElement('div');
            item.className = 'job-list-item';
            item.innerHTML = `
                <div class="job-info">
                    <h3>${saved.job.title}</h3>
                    <p>${saved.job.company} - ${saved.job.location}</p>
                    <p>Saved on: ${new Date(saved.savedAt.seconds * 1000).toLocaleDateString()}</p>
                </div>
                <div class="job-actions">
                    <a href="/job-details.html?id=${saved.job.id}" class="btn btn-primary">View Job</a>
                    <button class="btn btn-outline-danger" data-saved-job-id="${saved.id}">Unsave</button>
                </div>
            `;
            savedJobsPane.appendChild(item);
        });

        // Add event listeners for unsave buttons
        savedJobsPane.querySelectorAll('.btn-outline-danger').forEach(button => {
            button.addEventListener('click', () => unsaveJob(button.dataset.savedJobId, userId));
        });
    }

    async function unsaveJob(savedJobId, userId) {
        if (!confirm('Are you sure you want to unsave this job?')) return;

        try {
            await deleteDoc(doc(db, 'savedJobs', savedJobId));
            // Refresh the dashboard to show the change
            fetchDashboardData(userId);
        } catch (error) {
            console.error('Error unsaving job:', error);
            alert('Failed to unsave job. Please try again.');
        }
    }

    function switchTab(clickedTab, userId) {
        tabs.forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        clickedTab.classList.add('active');
        const tabId = clickedTab.dataset.tab;
        document.getElementById(`${tabId}-tab-pane`).classList.add('active');
    }
});
