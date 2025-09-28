const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    userType: 'jobseeker'
};

const testJob = {
    title: 'Software Developer',
    company: 'Test Company',
    location: 'Remote',
    jobType: 'Full Time',
    description: 'We are looking for a talented software developer to join our team.',
    requirements: 'JavaScript, Node.js, React experience required.',
    responsibilities: 'Develop and maintain web applications.',
    experience: 'mid',
    education: 'Bachelor\'s degree in Computer Science or related field'
};

let authToken = '';
let userId = '';
let jobId = '';

async function testAPI() {
    console.log('🚀 Starting JobConnect API Tests...\n');

    try {
        // Test 1: Server health check
        console.log('1. Testing server health...');
        const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}`);
        console.log('✅ Server is running:', healthResponse.data.message);

        // Test 2: User registration
        console.log('\n2. Testing user registration...');
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
        authToken = registerResponse.data.token;
        userId = registerResponse.data.user._id;
        console.log('✅ User registered successfully:', registerResponse.data.message);

        // Test 3: User login
        console.log('\n3. Testing user login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ User logged in successfully:', loginResponse.data.message);

        // Test 4: Get user profile
        console.log('\n4. Testing get user profile...');
        const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Profile retrieved successfully');

        // Test 5: Update user profile
        console.log('\n5. Testing profile update...');
        const updateResponse = await axios.put(`${BASE_URL}/users/profile`, {
            bio: 'Experienced software developer with passion for clean code.',
            skills: ['JavaScript', 'Node.js', 'React', 'MongoDB'],
            location: 'San Francisco, CA'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Profile updated successfully:', updateResponse.data.message);

        // Test 6: Post a job (requires employer account)
        console.log('\n6. Testing job posting (skipping - requires employer account)...');
        console.log('⚠️  Job posting test skipped - current user is jobseeker');

        // Test 7: Get all jobs
        console.log('\n7. Testing get all jobs...');
        const jobsResponse = await axios.get(`${BASE_URL}/jobs`);
        console.log('✅ Jobs retrieved successfully. Total jobs:', jobsResponse.data.pagination.totalJobs);

        // Test 8: Search jobs with filters
        console.log('\n8. Testing job search with filters...');
        const searchResponse = await axios.get(`${BASE_URL}/jobs?search=developer&limit=5`);
        console.log('✅ Job search successful. Found jobs:', searchResponse.data.jobs.length);

        // Test 9: Get user by ID
        console.log('\n9. Testing get user by ID...');
        const userResponse = await axios.get(`${BASE_URL}/users/${userId}`);
        console.log('✅ User retrieved successfully');

        // Test 10: Change password
        console.log('\n10. Testing password change...');
        const passwordResponse = await axios.post(`${BASE_URL}/auth/change-password`, {
            currentPassword: testUser.password,
            newPassword: 'newpassword123'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Password changed successfully');

        console.log('\n🎉 All API tests completed successfully!');
        console.log('\n📋 Test Summary:');
        console.log('- ✅ Server health check');
        console.log('- ✅ User registration');
        console.log('- ✅ User login');
        console.log('- ✅ Get user profile');
        console.log('- ✅ Update user profile');
        console.log('- ⚠️  Job posting (skipped - requires employer)');
        console.log('- ✅ Get all jobs');
        console.log('- ✅ Job search with filters');
        console.log('- ✅ Get user by ID');
        console.log('- ✅ Change password');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testAPI();
}

module.exports = { testAPI };
