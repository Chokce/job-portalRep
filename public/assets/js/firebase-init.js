// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "G-MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Handle auth state changes
onAuthStateChanged(auth, (user) => {
  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const dashboardLink = document.getElementById('dashboard-link');
  const logoutBtn = document.getElementById('logout-btn');

  if (user) {
    // User is signed in
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'block';
    if (logoutBtn) {
      logoutBtn.style.display = 'block';
      logoutBtn.onclick = () => auth.signOut();
    }
  } else {
    // User is signed out
    if (loginLink) loginLink.style.display = 'block';
    if (registerLink) registerLink.style.display = 'block';
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
});

export { app, auth, db };
