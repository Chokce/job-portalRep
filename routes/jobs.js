const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { auth, isEmployer, isOwnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/jobs
// @desc    Post a new job
// @access  Private (Employers only)
router.post('/', [
    auth,
    isEmployer,
    body('title')
        .notEmpty()
        .withMessage('Job title is required')
        .isLength({ min: 5, max: 100 })
        .withMessage('Job title must be between 5 and 100 characters'),
    body('company')
        .notEmpty()
        .withMessage('Company name is required'),
    body('location')
        .notEmpty()
        .withMessage('Location is required'),
    body('jobType')
        .isIn(['Full Time', 'Part Time', 'Contract', 'Remote', 'Internship'])
        .withMessage('Invalid job type'),
    body('description')
        .notEmpty()
        .withMessage('Job description is required')
        .isLength({ min: 50, max: 5000 })
        .withMessage('Job description must be between 50 and 5000 characters'),
    body('requirements')
        .notEmpty()
        .withMessage('Job requirements are required'),
    body('responsibilities')
        .notEmpty()
        .withMessage('Job responsibilities are required'),
    body('experience')
        .isIn(['entry', 'mid', 'senior', 'executive'])
        .withMessage('Invalid experience level'),
    body('education')
        .notEmpty()
        .withMessage('Education requirement is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const jobData = {
            ...req.body,
            postedBy: req.user._id
        };

        const job = new Job(jobData);
        await job.save();

        res.status(201).json({
            message: 'Job posted successfully',
            job
        });

    } catch (error) {
        console.error('Post job error:', error);
        res.status(500).json({ message: 'Server error while posting job' });
    }
});

// @route   GET /api/jobs
// @desc    Get all jobs with filtering and pagination
// @access  Public
router.get('/', [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string'),
    query('location')
        .optional()
        .isString()
        .withMessage('Location must be a string'),
    query('jobType')
        .optional()
        .isIn(['Full Time', 'Part Time', 'Contract', 'Remote', 'Internship'])
        .withMessage('Invalid job type'),
    query('experience')
        .optional()
        .isIn(['entry', 'mid', 'senior', 'executive'])
        .withMessage('Invalid experience level'),
    query('remote')
        .optional()
        .isBoolean()
        .withMessage('Remote must be a boolean')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            page = 1,
            limit = 10,
            search,
            location,
            jobType,
            experience,
            remote
        } = req.query;

        // Build filter object
        const filter = { isActive: true };

        if (search) {
            filter.$text = { $search: search };
        }

        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }

        if (jobType) {
            filter.jobType = jobType;
        }

        if (experience) {
            filter.experience = experience;
        }

        if (remote !== undefined) {
            filter.isRemote = remote === 'true';
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get jobs with pagination
        const jobs = await Job.find(filter)
            .populate('postedBy', 'firstName lastName company')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Job.countDocuments(filter);

        res.json({
            jobs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalJobs: total,
                hasNext: skip + jobs.length < total,
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ message: 'Server error while fetching jobs' });
    }
});

// @route   GET /api/jobs/:id
// @desc    Get a specific job by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('postedBy', 'firstName lastName company email phone')
            .populate('applications', 'applicant status appliedDate');

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (!job.isActive) {
            return res.status(404).json({ message: 'Job is no longer active' });
        }

        // Increment view count
        job.views += 1;
        await job.save();

        res.json({ job });

    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ message: 'Server error while fetching job' });
    }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job
// @access  Private (Job poster or admin only)
router.put('/:id', [
    auth,
    body('title')
        .optional()
        .isLength({ min: 5, max: 100 })
        .withMessage('Job title must be between 5 and 100 characters'),
    body('jobType')
        .optional()
        .isIn(['Full Time', 'Part Time', 'Contract', 'Remote', 'Internship'])
        .withMessage('Invalid job type'),
    body('description')
        .optional()
        .isLength({ min: 50, max: 5000 })
        .withMessage('Job description must be between 50 and 5000 characters'),
    body('experience')
        .optional()
        .isIn(['entry', 'mid', 'senior', 'executive'])
        .withMessage('Invalid experience level')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check if user owns the job or is admin
        if (job.postedBy.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this job' });
        }

        // Update job
        Object.assign(job, req.body);
        await job.save();

        res.json({
            message: 'Job updated successfully',
            job
        });

    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ message: 'Server error while updating job' });
    }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job
// @access  Private (Job poster or admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check if user owns the job or is admin
        if (job.postedBy.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this job' });
        }

        // Soft delete - mark as inactive
        job.isActive = false;
        await job.save();

        res.json({ message: 'Job deleted successfully' });

    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ message: 'Server error while deleting job' });
    }
});

// @route   GET /api/jobs/employer/my-jobs
// @desc    Get jobs posted by current employer
// @access  Private (Employers only)
router.get('/employer/my-jobs', auth, async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ jobs });

    } catch (error) {
        console.error('Get employer jobs error:', error);
        res.status(500).json({ message: 'Server error while fetching jobs' });
    }
});

// @route   POST /api/jobs/:id/apply
// @desc    Apply for a job
// @access  Private (Job seekers only)
router.post('/:id/apply', [
    auth,
    body('coverLetter')
        .notEmpty()
        .withMessage('Cover letter is required')
        .isLength({ min: 100, max: 2000 })
        .withMessage('Cover letter must be between 100 and 2000 characters'),
    body('resume')
        .notEmpty()
        .withMessage('Resume is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Check if user is a job seeker
        if (req.user.userType !== 'jobseeker') {
            return res.status(403).json({ message: 'Only job seekers can apply for jobs' });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (!job.isActive) {
            return res.status(400).json({ message: 'Job is no longer active' });
        }

        // Check if user has already applied
        const existingApplication = await Application.findOne({
            job: job._id,
            applicant: req.user._id
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }

        // Create application
        const application = new Application({
            job: job._id,
            applicant: req.user._id,
            coverLetter: req.body.coverLetter,
            resume: req.body.resume
        });

        await application.save();

        // Increment application count
        job.applicationCount += 1;
        await job.save();

        res.status(201).json({
            message: 'Application submitted successfully',
            application
        });

    } catch (error) {
        console.error('Apply for job error:', error);
        res.status(500).json({ message: 'Server error while applying for job' });
    }
});

module.exports = router;
