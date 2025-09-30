const express = require('express');
const router = express.Router();
const {
    createJob,
    getAllJobs,
    getJobById,
    createApplication
} = require('../lib/jsonDatabase');

// Route to get all jobs
router.get('/', async (req, res) => {
    try {
        const jobs = await getAllJobs();
        res.json({ success: true, jobs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to get jobs' });
    }
});

// Route to get a single job by ID
router.get('/:id', async (req, res) => {
    try {
        const job = await getJobById(req.params.id);
        if (job) {
            res.json({ success: true, job });
        } else {
            res.status(404).json({ success: false, message: 'Job not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to get job' });
    }
});

// Route to create a new job
router.post('/', async (req, res) => {
    try {
        const newJob = await createJob(req.body);
        res.status(201).json({ success: true, job: newJob });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create job' });
    }
});

// Route to apply for a job
router.post('/:id/apply', async (req, res) => {
    try {
        // Assuming you have user authentication and the user ID is available in req.user.id
        const userId = req.user ? req.user.id : null;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Please login to apply' });
        }

        const job = await getJobById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const applicationData = {
            job_id: req.params.id,
            user_id: userId,
            ...req.body
        };

        const newApplication = await createApplication(applicationData);
        res.status(201).json({ success: true, application: newApplication });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to apply for job' });
    }
});

module.exports = router;
