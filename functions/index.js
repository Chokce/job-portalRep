
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.searchJobs = functions.https.onCall(async (data, context) => {
  const keyword = data.keyword ? data.keyword.toLowerCase() : '';
  const location = data.location ? data.location.toLowerCase() : '';
  const jobType = data.jobType || '';
  const salaryRange = data.salaryRange || '';

  try {
    const jobsSnapshot = await db.collection("posts").get();
    const allJobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const filteredJobs = allJobs.filter(job => {
      const titleMatch = job.title && job.title.toLowerCase().includes(keyword);
      const companyMatch = job.company && job.company.toLowerCase().includes(keyword);
      const locationMatch = job.location && job.location.toLowerCase().includes(location);
      const jobTypeMatch = !jobType || (job.jobType && job.jobType === jobType);

      let salaryMatch = true;
      if (salaryRange) {
          const [min, max] = salaryRange.split('-').map(Number);
          const jobMinSalary = Number(job.salaryMin);
          const jobMaxSalary = Number(job.salaryMax);

          if (max) {
              salaryMatch = jobMinSalary >= min && jobMaxSalary <= max;
          } else {
              salaryMatch = jobMinSalary >= min;
          }
      }

      return (titleMatch || companyMatch) && locationMatch && jobTypeMatch && salaryMatch;
    });

    return { success: true, jobs: filteredJobs };

  } catch (error) {
    console.error("Error searching jobs:", error);
    throw new functions.https.HttpsError("internal", "An error occurred while searching for jobs.");
  }
});
