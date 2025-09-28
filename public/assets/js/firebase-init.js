
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {

  apiKey: "AIzaSyAV6TaVoniaosm5zTZr7TCH5R-TFt4KOLk",

  authDomain: "job-portal-mq0x6.firebaseapp.com",

  projectId: "job-portal-mq0x6",

  storageBucket: "job-portal-mq0x6.firebasestorage.app",

  messagingSenderId: "872434775175",

  appId: "1:872434775175:web:bd99a08b0f78af8edef422"

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
