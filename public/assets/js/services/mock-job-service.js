// Mock JobService for testing
class MockJobService {
    constructor() {
        this.mockJob = {
            id: 'test-job-123',
            title: 'Senior Frontend Developer',
            company: 'Tech Corp',
            location: 'San Francisco, CA',
            isRemote: true,
            jobType: 'Full-time',
            salary: 120000,
            salaryMin: 100000,
            salaryMax: 140000,
            description: 'We are looking for an experienced Frontend Developer to join our team...',
            requirements: [
                '5+ years of experience with React',
                'Strong JavaScript/TypeScript skills',
                'Experience with modern frontend build tools',
                'Bachelor\'s degree in Computer Science or related field'
            ],
            responsibilities: [
                'Develop and maintain user interfaces using React',
                'Collaborate with designers and backend developers',
                'Write clean, maintainable, and efficient code',
                'Participate in code reviews'
            ],
            benefits: [
                'Competitive salary',
                'Health insurance',
                'Flexible working hours',
                'Remote work options',
                'Professional development budget'
            ],
            skills: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS'],
            category: 'Software Development',
            experienceLevel: 'Senior',
            companyDescription: 'Tech Corp is a leading technology company specializing in innovative solutions...',
            website: 'https://techcorp.example.com',
            howToApply: 'Please send your resume and portfolio to careers@techcorp.example.com',
            applicationDeadline: '2023-12-31T23:59:59Z',
            createdAt: new Date().toISOString(),
            employerId: 'employer-123'
        };
    }

    async getJobById(jobId) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (jobId === 'test-job-123') {
            return {
                success: true,
                data: this.mockJob
            };
        }
        
        return {
            success: false,
            error: 'Job not found'
        };
    }

    async saveJob(jobId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
    }

    async removeSavedJob(jobId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
    }
}

export { MockJobService };
