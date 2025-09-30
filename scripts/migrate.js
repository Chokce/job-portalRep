const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
const jobs = require('../app/data/jobs.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateJobs() {
  for (const job of jobs) {
    await db.collection('jobs').add(job);
  }
  console.log('Jobs migrated successfully!');
}

migrateJobs().catch(console.error);
