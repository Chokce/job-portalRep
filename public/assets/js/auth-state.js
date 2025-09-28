import { auth, onAuthStateChanged } from './firebase-app.js';
import { showError } from './utils/helpers.js';

// Handle authentication state changes
const setupAuthState = () => {
  onAuthStateChanged(auth, (user) => {
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const dashboardLink = document.getElementById('dashboard-link');
    const logoutBtn = document.getElementById('logout-btn');
    const postJobLink = document.getElementById('post-job-link');
    const userMenu = document.getElementById('user-menu');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');

    if (user) {
      // User is signed in
      if (loginLink) loginLink.style.display = 'none';
      if (registerLink) registerLink.style.display = 'none';
      if (dashboardLink) dashboardLink.style.display = 'block';
      if (postJobLink) postJobLink.style.display = 'block';
      
      if (logoutBtn) {
        logoutBtn.style.display = 'block';
        logoutBtn.onclick = handleLogout;
      }
      
      if (userMenu) userMenu.style.display = 'flex';
      if (userAvatar) userAvatar.textContent = user.email ? user.email.charAt(0).toUpperCase() : 'U';
      if (userName) userName.textContent = user.displayName || user.email;
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      }));
    } else {
      // User is signed out
      if (loginLink) loginLink.style.display = 'block';
      if (registerLink) registerLink.style.display = 'block';
      if (dashboardLink) dashboardLink.style.display = 'none';
      if (postJobLink) postJobLink.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'none';
      
      // Clear user data from localStorage
      localStorage.removeItem('user');
    }
  });
};

// Handle logout
const handleLogout = async () => {
  try {
    await auth.signOut();
    // Redirect to home page after logout
    window.location.href = 'index.html';
  } catch (error) {
    showError('Error signing out: ' + error.message);
  }
};

// Initialize auth state when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setupAuthState();
});

export { setupAuthState, handleLogout };
