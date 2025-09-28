const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { auth, isOwnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        res.json({
            user: req.user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', [
    auth,
    body('firstName')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('phone')
        .optional()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),
    body('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters'),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio must be less than 500 characters'),
    body('skills')
        .optional()
        .isArray()
        .withMessage('Skills must be an array'),
    body('experience')
        .optional()
        .isIn(['entry', 'mid', 'senior', 'executive'])
        .withMessage('Invalid experience level'),
    body('education')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Education must be less than 200 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.findById(req.user._id);

        // Update allowed fields
        const allowedUpdates = [
            'firstName', 'lastName', 'phone', 'location', 'bio', 
            'skills', 'experience', 'education'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
});

// @route   GET /api/users/:id
// @desc    Get a user's public profile
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('firstName lastName username userType location bio skills experience education profilePicture createdAt');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(404).json({ message: 'User profile not available' });
        }

        res.json({ user });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Server error while fetching user profile' });
    }
});

// @route   POST /api/users/upload-resume
// @desc    Upload user's resume
// @access  Private
router.post('/upload-resume', [
    auth,
    body('resume')
        .notEmpty()
        .withMessage('Resume file is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.findById(req.user._id);
        user.resume = req.body.resume;
        await user.save();

        res.json({
            message: 'Resume uploaded successfully',
            resume: user.resume
        });

    } catch (error) {
        console.error('Upload resume error:', error);
        res.status(500).json({ message: 'Server error while uploading resume' });
    }
});

// @route   POST /api/users/upload-profile-picture
// @desc    Upload user's profile picture
// @access  Private
router.post('/upload-profile-picture', [
    auth,
    body('profilePicture')
        .notEmpty()
        .withMessage('Profile picture file is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.findById(req.user._id);
        user.profilePicture = req.body.profilePicture;
        await user.save();

        res.json({
            message: 'Profile picture uploaded successfully',
            profilePicture: user.profilePicture
        });

    } catch (error) {
        console.error('Upload profile picture error:', error);
        res.status(500).json({ message: 'Server error while uploading profile picture' });
    }
});

// @route   GET /api/users/search/candidates
// @desc    Search for job candidates (employers only)
// @access  Private (Employers only)
router.get('/search/candidates', [
    auth,
    query('skills')
        .optional()
        .isString()
        .withMessage('Skills must be a string'),
    query('experience')
        .optional()
        .isIn(['entry', 'mid', 'senior', 'executive'])
        .withMessage('Invalid experience level'),
    query('location')
        .optional()
        .isString()
        .withMessage('Location must be a string'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
    try {
        // Check if user is employer
        if (req.user.userType !== 'employer' && req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Only employers can search for candidates' });
        }

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            skills,
            experience,
            location,
            page = 1,
            limit = 10
        } = req.query;

        // Build filter object
        const filter = {
            userType: 'jobseeker',
            isActive: true
        };

        if (skills) {
            const skillsArray = skills.split(',').map(skill => skill.trim());
            filter.skills = { $in: skillsArray };
        }

        if (experience) {
            filter.experience = experience;
        }

        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get candidates with pagination
        const candidates = await User.find(filter)
            .select('firstName lastName username location bio skills experience education profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await User.countDocuments(filter);

        res.json({
            candidates,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalCandidates: total,
                hasNext: skip + candidates.length < total,
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('Search candidates error:', error);
        res.status(500).json({ message: 'Server error while searching candidates' });
    }
});

// @route   PUT /api/users/:id/verify
// @desc    Verify a user account (admin only)
// @access  Private (Admin only)
router.put('/:id/verify', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Only admins can verify users' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isVerified = true;
        await user.save();

        res.json({
            message: 'User verified successfully',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ message: 'Server error while verifying user' });
    }
});

// @route   PUT /api/users/:id/deactivate
// @desc    Deactivate a user account (admin only)
// @access  Private (Admin only)
router.put('/:id/deactivate', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Only admins can deactivate users' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = false;
        await user.save();

        res.json({
            message: 'User deactivated successfully'
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({ message: 'Server error while deactivating user' });
    }
});

module.exports = router;
