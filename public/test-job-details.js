// Test script for job-details.js
console.log('Job Details Test Script Loaded');

// Test data
const testJob = {
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
        'Bachelors degree in Computer Science or related field'
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

// Test functions
function testJobDetailsRendering() {
    console.log('Testing job details rendering...');
    
    // Check if job details container exists
    const jobDetails = document.getElementById('job-details');
    if (!jobDetails) {
        console.error('Error: Job details container not found');
        return false;
    }
    
    // Check if job title is rendered
    const jobTitle = jobDetails.querySelector('h1');
    if (!jobTitle || !jobTitle.textContent.includes(testJob.title)) {
        console.error('Error: Job title not rendered correctly');
        return false;
    }
    
    // Check if company name is rendered
    const companyName = jobDetails.querySelector('.company');
    if (!companyName || !companyName.textContent.includes(testJob.company)) {
        console.error('Error: Company name not rendered correctly');
        return false;
    }
    
    console.log('Job details rendering test passed!');
    return true;
}

function testSaveJobButton() {
    console.log('Testing save job button...');
    
    const saveButton = document.getElementById('save-job-btn');
    if (!saveButton) {
        console.error('Error: Save job button not found');
        return false;
    }
    
    // Simulate click
    saveButton.click();
    
    // Check if button state changed
    setTimeout(() => {
        const isSaved = saveButton.classList.contains('saved');
        console.log(`Save button state: ${isSaved ? 'Saved' : 'Not saved'}`);
        return isSaved;
    }, 500);
}

// Run tests when page is fully loaded
window.addEventListener('load', () => {
    console.log('Running job details tests...');
    
    // Wait for job details to load
    setTimeout(() => {
        const tests = [
            { name: 'Job Details Rendering', test: testJobDetailsRendering },
            { name: 'Save Job Button', test: testSaveJobButton }
        ];
        
        let allTestsPassed = true;
        
        tests.forEach(({ name, test }) => {
            console.log(`\nRunning test: ${name}`);
            const passed = test();
            console.log(`${name}: ${passed ? 'PASSED' : 'FAILED'}`);
            if (!passed) allTestsPassed = false;
        });
        
        console.log(`\nAll tests ${allTestsPassed ? 'PASSED' : 'SOME TESTS FAILED'}`);
    }, 1500); // Wait for job details to load
});

// Make test functions available in console
window.testJobDetails = {
    testJobDetailsRendering,
    testSaveJobButton
};
