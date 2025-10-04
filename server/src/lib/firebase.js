import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Load service account key from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET // e.g., 'my-project.appspot.com'
});

// Export Firestore and Storage
export const firestore = admin.firestore();
export const storage = admin.storage();

// Test Firebase connection
async function testFirebaseConnection() {
  try {
    await firestore.listCollections();
    console.log('✅ Firebase connected successfully!');
  } catch (error) {
    console.error('❌ Failed to connect to Firebase:', error.message);
    process.exit(1);
  }
}

testFirebaseConnection();
