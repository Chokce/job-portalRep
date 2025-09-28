const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { auth, isEmployer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/applications/my-applications
// @desc    Get current user's job applications
// @access  Private (Job seekers only)
router.get('/my-applications', auth, async (req, res) => {
    try {
        if (req.user.userType !== 'jobseeker') {
            return res.status(403).json({ message: 'Only job seekers can view their applications' });
        }

        const applications = await Application.find({ applicant: req.user._id })
            .populate('job', 'title company location jobType')
            .sort({ appliedDate: -1 });

        res.json({ applications });
    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({ message: 'Server error while fetching applications' });
    }
});

// @route   GET /api/applications/job/:jobId
// @desc    Get applications for a specific job (employers only)
// @access  Private (Job poster or admin only)
router.get('/job/:jobId', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.postedBy.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view applications for this job' });
        }

        const applications = await Application.find({ job: req.params.jobId })
            .populate('applicant', 'firstName lastName username email location')
            .sort({ appliedDate: -1 });

        res.json({ applications });
    } catch (error) {
        console.error('Get job applications error:', error);
        res.status(500).json({ message: 'Server error while fetching applications' });
    }
});

// @route   PUT /api/applications/:id/status
// @desc    Update application status (employers only)
// @access  Private (Job poster or admin only)
router.put('/:id/status', [
    auth,
    body('status')
        .isIn(['pending', 'reviewed', 'shortlisted', 'interviewed', 'accepted', 'rejected'])
        .withMessage('Invalid status'),
    body('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes must be less than 1000 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const application = await Application.findById(req.params.id).populate('job');
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (application.job.postedBy.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this application' });
        }

        const { status, notes } = req.body;
        application.status = status;
        application.notes = notes || '';
        application.reviewedDate = new Date();
        application.reviewedBy = req.user._id;

        await application.save();

        res.json({
            message: 'Application status updated successfully',
            application
        });
    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ message: 'Server error while updating application status' });
    }
});

// @route   PUT /api/applications/:id/withdraw
// @desc    Withdraw application (applicant only)
// @access  Private (Applicant only)
router.put('/:id/withdraw', auth, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (application.applicant.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to withdraw this application' });
        }

        if (application.status === 'accepted' || application.status === 'rejected') {
            return res.status(400).json({ message: 'Cannot withdraw application in current status' });
        }

        application.isWithdrawn = true;
        application.withdrawnDate = new Date();
        await application.save();

        res.json({ message: 'Application withdrawn successfully' });
    } catch (error) {
        console.error('Withdraw application error:', error);
        res.status(500).json({ message: 'Server error while withdrawing application' });
    }
});

module.exports = router;
