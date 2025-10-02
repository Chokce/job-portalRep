
import { 
    collection, 
    getDocs, 
    getDoc, 
    addDoc, 
    doc 
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { db } from '../firebase-init.js';

const jobService = {
    getJobs: async () => {
        try {
            const jobsCollection = collection(db, 'jobs');
            const jobSnapshot = await getDocs(jobsCollection);
            const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, jobs: jobList };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    getJob: async (id) => {
        try {
            const docRef = doc(db, 'jobs', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { success: true, job: { id: docSnap.id, ...docSnap.data() } };
            } else {
                return { success: false, message: 'No such document!' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    addJob: async (jobData) => {
        try {
            const docRef = await addDoc(collection(db, 'jobs'), jobData);
            return { success: true, jobId: docRef.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    searchJobs: async (searchParams) => {
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

                    if (max) {
                        salaryMatch = jobMinSalary >= min && jobMaxSalary <= max;
                    } else {
                        salaryMatch = jobMinSalary >= min;
                    }
                }

                return (titleMatch || companyMatch) && locationMatch && jobTypeMatch && salaryMatch;
            });

            return { success: true, jobs: filteredJobs };
        } catch (error) {
            console.error("Error searching jobs:", error);
            return { success: false, message: error.message };
        }
    }
};

export default jobService;
