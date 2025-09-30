const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Create a new job
router.post('/', async (req, res) => {
    try {
        const { title, company, location, salary, type, description } = req.body;

        if (!title || !company || !location || !description) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const jobRef = await db.collection('jobs').add({
            title,
            company,
            location,
            salary,
            type,
            description,
            createdAt: new Date()
        });

        res.status(201).json({ success: true, id: jobRef.id });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get all jobs
router.get('/', async (req, res) => {
    try {
        const jobsSnapshot = await db.collection('jobs').get();
        const jobs = [];
        jobsSnapshot.forEach(doc => {
            jobs.push({ id: doc.id, ...doc.data() });
        });
        res.json({ success: true, jobs });
    } catch (error) {
        console.error('Error getting jobs:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get a single job by ID
router.get('/:id', async (req, res) => {
    try {
        const jobId = req.params.id;
        const jobDoc = await db.collection('jobs').doc(jobId).get();

        if (!jobDoc.exists) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        res.json({ success: true, job: { id: jobDoc.id, ...jobDoc.data() } });
    } catch (error) {
        console.error('Error getting job:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Apply for a job
router.post('/:id/apply', async (req, res) => {
    try {
        // Note: Add user authentication middleware to get the user ID
        const jobId = req.params.id;
        const userId = req.user.id; // Assuming user is authenticated
        const { cover_letter, resume } = req.body;

        const jobDoc = await db.collection('jobs').doc(jobId).get();
        if (!jobDoc.exists) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const applicationRef = await db.collection('applications').add({
            jobId,
            userId,
            cover_letter,
            resume,
            status: 'pending',
            createdAt: new Date()
        });

        res.status(201).json({ success: true, id: applicationRef.id });
    } catch (error) {
        console.error('Error applying for job:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
