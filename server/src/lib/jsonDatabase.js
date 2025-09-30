
const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', '..', 'app', 'data');
const jobsFilePath = path.join(dataDir, 'jobs.json');
const usersFilePath = path.join(dataDir, 'users.json');
const applicationsFilePath = path.join(dataDir, 'applications.json');

async function readJsonFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Job Methods
async function createJob(jobData) {
    const jobs = await readJsonFile(jobsFilePath);
    const newJob = {
        id: jobs.length + 1,
        ...jobData,
        created_at: new Date().toISOString(),
    };
    jobs.push(newJob);
    await writeJsonFile(jobsFilePath, jobs);
    return newJob;
}

async function getAllJobs() {
    return await readJsonFile(jobsFilePath);
}

async function getJobById(id) {
    const jobs = await readJsonFile(jobsFilePath);
    return jobs.find(job => job.id === parseInt(id));
}

// Application Methods
async function createApplication(applicationData) {
    const applications = await readJsonFile(applicationsFilePath);
    const newApplication = {
        id: applications.length + 1,
        ...applicationData,
        created_at: new Date().toISOString(),
        status: 'pending',
    };
    applications.push(newApplication);
    await writeJsonFile(applicationsFilePath, applications);
    return newApplication;
}

module.exports = {
    createJob,
    getAllJobs,
    getJobById,
    createApplication
};
