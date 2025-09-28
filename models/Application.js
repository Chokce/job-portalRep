const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coverLetter: {
        type: String,
        required: true,
        minlength: 100,
        maxlength: 2000
    },
    resume: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'shortlisted', 'interviewed', 'accepted', 'rejected'],
        default: 'pending'
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    reviewedDate: {
        type: Date
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        maxlength: 1000
    },
    interviewDate: {
        type: Date
    },
    interviewLocation: {
        type: String
    },
    interviewType: {
        type: String,
        enum: ['phone', 'video', 'in-person', 'assessment'],
        default: 'in-person'
    },
    isWithdrawn: {
        type: Boolean,
        default: false
    },
    withdrawnDate: {
        type: Date
    },
    employerNotes: {
        type: String,
        maxlength: 1000
    }
}, {
    timestamps: true
});

// Ensure one application per user per job
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Virtual for application status color
applicationSchema.virtual('statusColor').get(function() {
    const statusColors = {
        'pending': '#f39c12',
        'reviewed': '#3498db',
        'shortlisted': '#9b59b6',
        'interviewed': '#e67e22',
        'accepted': '#2ecc71',
        'rejected': '#e74c3c'
    };
    return statusColors[this.status] || '#95a5a6';
});

// Ensure virtual fields are serialized
applicationSchema.set('toJSON', { virtuals: true });
applicationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Application', applicationSchema);
