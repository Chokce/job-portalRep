// Test script for external job functionality
// Run with: node test-external-jobs.js

import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testEmployer = {
  email: 'employer@company.com',
  password: 'password123'
};

async function testExternalJobs() {
  console.log('🚀 Testing External Job Portal APIs...\n');

  try {
    // 1. Test health check
    console.log('1. Testing health check...');
    const health = await axios.get(`${API_BASE.replace('/api', '')}/health`);
    console.log('✅ Health check:', health.data);
    console.log('');

    // 2. Test external jobs search (no auth required)
    console.log('2. Testing external jobs search...');
    try {
      const searchResult = await axios.post(`${API_BASE}/external-jobs/search`, {
        query: 'software engineer',
        location: 'remote',
        limit: 5
      });
      console.log('✅ External jobs search:', {
        scraped: searchResult.data.scraped,
        saved: searchResult.data.saved,
        message: searchResult.data.message
      });
    } catch (error) {
      console.log('⚠️  External jobs search (expected to fail without scraping):', error.response?.data?.error || error.message);
    }
    console.log('');

    // 3. Test getting external jobs list
    console.log('3. Testing external jobs list...');
    try {
      const jobsList = await axios.get(`${API_BASE}/external-jobs?limit=5`);
      console.log('✅ External jobs list:', {
        total: jobsList.data.pagination.total,
        jobs_count: jobsList.data.jobs.length,
        page: jobsList.data.pagination.page
      });
    } catch (error) {
      console.log('⚠️  External jobs list:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 4. Test unified jobs search
    console.log('4. Testing unified jobs search...');
    try {
      const unifiedSearch = await axios.get(`${API_BASE}/unified-jobs/search?query=engineer&limit=5`);
      console.log('✅ Unified jobs search:', {
        total: unifiedSearch.data.pagination.total,
        jobs_count: unifiedSearch.data.jobs.length,
        source_type: unifiedSearch.data.source_type
      });
    } catch (error) {
      console.log('⚠️  Unified jobs search:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 5. Test getting job statistics
    console.log('5. Testing job statistics...');
    try {
      const stats = await axios.get(`${API_BASE}/external-jobs/stats/overview`);
      console.log('✅ External jobs stats:', stats.data);
    } catch (error) {
      console.log('⚠️  External jobs stats:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 6. Test getting source sites
    console.log('6. Testing source sites list...');
    try {
      const sources = await axios.get(`${API_BASE}/external-jobs/sources/list`);
      console.log('✅ Source sites:', sources.data);
    } catch (error) {
      console.log('⚠️  Source sites:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 7. Test unified jobs statistics
    console.log('7. Testing unified jobs statistics...');
    try {
      const unifiedStats = await axios.get(`${API_BASE}/unified-jobs/stats/overview`);
      console.log('✅ Unified jobs stats:', unifiedStats.data);
    } catch (error) {
      console.log('⚠️  Unified jobs stats:', error.response?.data?.error || error.message);
    }
    console.log('');

    console.log('🎉 External job portal API testing completed!');
    console.log('\n📝 Notes:');
    console.log('- Some endpoints may return empty results if no external jobs exist yet');
    console.log('- Job scraping requires the server to be running with scheduled jobs enabled');
    console.log('- Admin endpoints require employer authentication');
    console.log('\n🚀 To populate with external jobs:');
    console.log('1. Start the server with NODE_ENV=production');
    console.log('2. Wait for scheduled scraping or use admin endpoints');
    console.log('3. Or manually trigger scraping via POST /api/admin/scraping/trigger');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

// Run the test
testExternalJobs();
