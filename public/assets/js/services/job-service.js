import { db, auth } from '../firebase-app.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

class JobService {
  // Create a new job
  static async createJob(jobData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const jobWithMetadata = {
        ...jobData,
        postedBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        applications: 0
      };

      const docRef = await addDoc(collection(db, 'jobs'), jobWithMetadata);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating job:', error);
      return { success: false, error: error.message };
    }

  // ===================== Saved Jobs =====================
  static async saveJobForUser(jobId, userId) {
    try {
      const ref = doc(db, 'users', userId, 'savedJobs', jobId);
      await setDoc(ref, {
        jobId,
        userId,
        savedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error saving job for user:', error);
      return { success: false, error: error.message };
    }
  }

  static async removeSavedJobForUser(jobId, userId) {
    try {
      const ref = doc(db, 'users', userId, 'savedJobs', jobId);
      await deleteDoc(ref);
      return { success: true };
    } catch (error) {
      console.error('Error removing saved job for user:', error);
      return { success: false, error: error.message };
    }
  }

  static async hasSavedJob(jobId, userId) {
    try {
      const ref = doc(db, 'users', userId, 'savedJobs', jobId);
      const snap = await getDoc(ref);
      return { success: true, exists: snap.exists() };
    } catch (error) {
      console.error('Error checking saved job:', error);
      return { success: false, error: error.message };
    }
  }

  // ===================== Applications =====================
  static async applyToJob(jobId, applicant) {
    try {
      const application = {
        jobId,
        applicantId: applicant.uid,
        applicantEmail: applicant.email || null,
        employerId: applicant.employerId || null, // optional override
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'applications'), application);
      return { success: true };
    } catch (error) {
      console.error('Error applying to job:', error);
      return { success: false, error: error.message };
    }
  }

  static async hasApplied(userId, jobId) {
    try {
      const q = query(
        collection(db, 'applications'),
        where('applicantId', '==', userId),
        where('jobId', '==', jobId)
      );
      const snap = await getDocs(q);
      return { success: true, exists: !snap.empty };
    } catch (error) {
      console.error('Error checking application:', error);
      return { success: false, error: error.message };
    }
  }
  }

  // Get all jobs with pagination
  static async getJobs(limitCount = 10, lastVisible = null) {
    try {
      let q = query(
        collection(db, 'jobs'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (lastVisible) {
        const lastDoc = await getDoc(doc(db, 'jobs', lastVisible));
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const jobs = [];
      let lastDoc = null;

      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() });
        lastDoc = doc;
      });

      return { 
        success: true, 
        data: jobs, 
        lastVisible: lastDoc ? lastDoc.id : null 
      };
    } catch (error) {
      console.error('Error getting jobs:', error);
      return { success: false, error: error.message };
    }
  }

  // Search jobs with filters
  static async searchJobs(filters = {}, limitCount = 10, lastVisible = null) {
    try {
      let q = collection(db, 'jobs');
      const conditions = [];

      // Add search conditions based on filters
      if (filters.title) {
        conditions.push(where('title', '>=', filters.title));
        conditions.push(where('title', '<=', filters.title + '\uf8ff'));
      }
      if (filters.location) {
        conditions.push(where('location', '==', filters.location));
      }
      if (filters.jobType) {
        conditions.push(where('jobType', '==', filters.jobType));
      }
      if (filters.salaryMin) {
        conditions.push(where('salaryMin', '>=', Number(filters.salaryMin)));
      }

      // Add sorting and pagination
      conditions.push(orderBy('createdAt', 'desc'));
      conditions.push(limit(limitCount));

      if (lastVisible) {
        const lastDoc = await getDoc(doc(db, 'jobs', lastVisible));
        conditions.push(startAfter(lastDoc));
      }

      const jobsQuery = query(collection(db, 'jobs'), ...conditions);
      const querySnapshot = await getDocs(jobsQuery);
      
      const jobs = [];
      let lastDoc = null;

      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() });
        lastDoc = doc;
      });

      return { 
        success: true, 
        data: jobs, 
        lastVisible: lastDoc ? lastDoc.id : null 
      };
    } catch (error) {
      console.error('Error searching jobs:', error);
      return { success: false, error: error.message };
    }
  }

  // Get job by ID
  static async getJobById(jobId) {
    try {
      const docRef = doc(db, 'jobs', jobId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'No such document!' };
      }
    } catch (error) {
      console.error('Error getting job:', error);
      return { success: false, error: error.message };
    }
  }

  // Update a job
  static async updateJob(jobId, jobData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Verify the user is the owner of the job
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (jobDoc.data().postedBy !== user.uid) {
        throw new Error('Not authorized to update this job');
      }

      const updatedData = {
        ...jobData,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'jobs', jobId), updatedData);
      return { success: true };
    } catch (error) {
      console.error('Error updating job:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a job
  static async deleteJob(jobId) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Verify the user is the owner of the job
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (jobDoc.data().postedBy !== user.uid) {
        throw new Error('Not authorized to delete this job');
      }

      await deleteDoc(doc(db, 'jobs', jobId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting job:', error);
      return { success: false, error: error.message };
    }
  }

  // Get jobs posted by current user
  static async getMyJobs() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const q = query(
        collection(db, 'jobs'),
        where('postedBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const jobs = [];

      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: jobs };
    } catch (error) {
      console.error('Error getting my jobs:', error);
      return { success: false, error: error.message };
    }
  }
}

export default JobService;
