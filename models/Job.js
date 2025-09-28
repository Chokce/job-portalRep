const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    jobType: {
        type: String,
        enum: ['Full Time', 'Part Time', 'Contract', 'Remote', 'Internship'],
        required: true
    },
    description: {
        type: String,
        required: true,
        minlength: 50
    },
    requirements: {
        type: String,
        required: true
    },
    responsibilities: {
        type: String,
        required: true
    },
    salary: {
        min: {
            type: Number,
            min: 0
        },
        max: {
            type: Number,
            min: 0
        },
        currency: {
            type: String,
            default: 'USD'
        },
        period: {
            type: String,
            enum: ['hourly', 'monthly', 'yearly'],
            default: 'yearly'
        }
    },
    experience: {
        type: String,
        enum: ['entry', 'mid', 'senior', 'executive'],
        required: true
    },
    education: {
        type: String,
        required: true
    },
    skills: [{
        type: String,
        trim: true
    }],
    benefits: [{
        type: String,
        trim: true
    }],
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isRemote: {
        type: Boolean,
        default: false
    },
    applicationDeadline: {
        type: Date
    },
    applicationCount: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Index for search functionality
jobSchema.index({
    title: 'text',
    description: 'text',
    company: 'text',
    location: 'text',
    skills: 'text'
});

// Virtual for formatted salary
jobSchema.virtual('formattedSalary').get(function() {
    if (!this.salary.min && !this.salary.max) return 'Negotiable';
    
    if (this.salary.min && this.salary.max) {
        return `${this.salary.currency} ${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()} ${this.salary.period}`;
    } else if (this.salary.min) {
        return `${this.salary.currency} ${this.salary.min.toLocaleString()}+ ${this.salary.period}`;
    } else {
        return `${this.salary.currency} Up to ${this.salary.max.toLocaleString()} ${this.salary.period}`;
    }
});

// Ensure virtual fields are serialized
jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
