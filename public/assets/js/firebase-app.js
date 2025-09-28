// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAV6TaVoniaosm5zTZr7TCH5R-TFt4KOLk",

  authDomain: "job-portal-mq0x6.firebaseapp.com",

  projectId: "job-portal-mq0x6",

  storageBucket: "job-portal-mq0x6.appspot.com",

  messagingSenderId: "872434775175",

  appId: "1:872434775175:web:bd99a08b0f78af8edef422"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Optionally expose globally for non-module scripts
window.auth = auth;
window.db = db;

// Export Firebase services
export { app, auth, db, onAuthStateChanged };
