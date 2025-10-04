
import { 
    collection, 
    getDocs, 
    getDoc, 
    addDoc, 
    doc, 
    serverTimestamp, 
    query, 
    where, 
    limit 
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { db } from '../firebase-init.js';
import ExternalJobService from './external-job-service.js';

const JobService = {
    async getJobs() {
        try {
            const jobsCollection = collection(db, 'jobs');
            const jobSnapshot = await getDocs(jobsCollection);
            const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, jobs: jobList };
        } catch (error) {
            console.error("Error getting jobs:", error);
            return { success: false, message: error.message };
        }
    },

    async getJob(id) {
        try {
            // If the job ID has a prefix, it's an external job.
            if (id.startsWith('ext-')) {
                // This is a placeholder. In a real application, you would fetch the details 
                // from the external API again using the original ID.
                return { success: true, job: { id, title: 'External Job', company: 'External Company', external: true } };
            }
            
            const docRef = doc(db, 'jobs', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { success: true, job: { id: docSnap.id, ...docSnap.data() } };
            } else {
                return { success: false, message: 'No such document!' };
            }
        } catch (error) {
            console.error("Error getting job details:", error);
            return { success: false, message: error.message };
        }
    },

    async addJob(jobData) {
        try {
            const docRef = await addDoc(collection(db, 'jobs'), jobData);
            return { success: true, jobId: docRef.id };
        } catch (error) {
            console.error("Error adding job:", error);
            return { success: false, message: error.message };
        }
    },

    async applyForJob(applicationData) {
        try {
            // Check if the user has already applied for this job
            const q = query(
                collection(db, 'applications'),
                where('userId', '==', applicationData.userId),
                where('jobId', '==', applicationData.jobId),
                limit(1)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                return { success: false, message: "You have already applied for this job." };
            }

            // If not, add a new application
            const docRef = await addDoc(collection(db, 'applications'), {
                ...applicationData,
                status: 'pending', // Default status
                submittedAt: serverTimestamp()
            });
            
            return { success: true, applicationId: docRef.id };
        } catch (error) {
            console.error("Error submitting application:", error);
            return { success: false, message: error.message };
        }
    },

    async searchJobs(searchParams) {
        try {
            // Fetch jobs from both Firestore and the external API concurrently.
            const [firestoreResult, externalJobs] = await Promise.all([
                this.searchFirestoreJobs(searchParams),
                ExternalJobService.fetchJobs(searchParams)
            ]);

            let combinedJobs = [];
            if (firestoreResult.success) {
                combinedJobs = combinedJobs.concat(firestoreResult.jobs);
            }
            
            combinedJobs = combinedJobs.concat(externalJobs);

            // Remove duplicates. A simple way is to use a Map based on a unique key, 
            // like a combination of title and company.
            const uniqueJobs = new Map();
            combinedJobs.forEach(job => {
                const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
                if (!uniqueJobs.has(key)) {
                    uniqueJobs.set(key, job);
                }
            });

            return { success: true, jobs: Array.from(uniqueJobs.values()) };

        } catch (error) {
            console.error("Error performing unified search:", error);
            return { success: false, message: error.message };
        }
    },

    async searchFirestoreJobs(searchParams) {
        try {
            const { keyword, location, jobType, salaryRange } = searchParams;
            const keywordLower = keyword ? keyword.toLowerCase() : '';
            const locationLower = location ? location.toLowerCase() : '';

            const jobsCollection = collection(db, 'jobs');
            const jobSnapshot = await getDocs(jobsCollection);
            const allJobs = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const filteredJobs = allJobs.filter(job => {
                const titleMatch = job.title && job.title.toLowerCase().includes(keywordLower);
                const companyMatch = job.company && job.company.toLowerCase().includes(keywordLower);
                const locationMatch = job.location && job.location.toLowerCase().includes(locationLower);
                const jobTypeMatch = !jobType || (job.jobType && job.jobType === jobType);
                
                let salaryMatch = true;
                if (salaryRange) {
                    const [min, max] = salaryRange.split('-').map(Number);
                    const jobMinSalary = Number(job.salaryMin);
                    const jobMaxSalary = Number(job.salaryMax);

                    salaryMatch = max ? (jobMinSalary >= min && jobMaxSalary <= max) : (jobMinSalary >= min);
                }

                return (titleMatch || companyMatch) && locationMatch && jobTypeMatch && salaryMatch;
            });

            return { success: true, jobs: filteredJobs };

        } catch (error) {
            console.error("Error searching Firestore jobs:", error);
            return { success: false, message: error.message };
        }
    }
};

export default JobService;
