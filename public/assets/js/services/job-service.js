
import { 
    collection, 
    getDocs, 
    getDoc, 
    addDoc, 
    doc 
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-functions.js';
import { db, app } from '../firebase-init.js';

const functions = getFunctions(app);

const jobService = {
    getJobs: async () => {
        try {
            const jobsCollection = collection(db, 'posts');
            const jobSnapshot = await getDocs(jobsCollection);
            const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, jobs: jobList };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    getJob: async (id) => {
        try {
            const docRef = doc(db, 'posts', id);
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
            const docRef = await addDoc(collection(db, 'posts'), jobData);
            return { success: true, jobId: docRef.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    searchJobs: async (searchParams) => {
        try {
            const searchJobs = httpsCallable(functions, 'searchJobs');
            const result = await searchJobs(searchParams);
            return result.data;
        } catch (error) {
            console.error("Error calling searchJobs function: ", error);
            return { success: false, message: error.message };
        }
    }
};

export default jobService;
