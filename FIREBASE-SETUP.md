# Firebase Setup for Job Portal

This guide will help you set up Firebase for the Job Portal application.

## Prerequisites

1. A Firebase account (https://console.firebase.google.com/)
2. Node.js and npm installed
3. Basic understanding of Firebase services

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project"
3. Enter a project name (e.g., "JobPortal")
4. Follow the setup wizard (you can disable Google Analytics if not needed)

## Step 2: Set Up Authentication

1. In the Firebase Console, go to "Authentication"
2. Click on "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication

## Step 3: Set Up Firestore Database

1. In the Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in production mode
4. Choose a location close to your users
5. Click "Enable"

## Step 4: Update Security Rules

1. Go to "Firestore Database" > "Rules"
2. Replace the default rules with the contents of `firestore.rules` from the project root
3. Click "Publish"

## Step 5: Get Firebase Configuration

1. In the Firebase Console, go to Project Settings (gear icon next to "Project Overview")
2. Under "Your apps", click on the web app (or create one if needed)
3. Copy the Firebase configuration object

## Step 6: Update Firebase Configuration

1. Open `public/assets/js/firebase-init.js`
2. Replace the `firebaseConfig` object with your Firebase configuration

## Step 7: Install Firebase Tools (for deployment)

```bash
npm install -g firebase-tools
```

## Step 8: Deploy Firebase Rules

```bash
firebase login
firebase init
# Select Firestore and Hosting
# Choose your Firebase project
# Follow the setup wizard

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy hosting (optional)
firebase deploy --only hosting
```

## Step 9: Update Environment Variables

Create a `.env` file in the project root with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-measurement_id
```

## Step 10: Test the Integration

1. Start your development server
2. Try to register a new user
3. Verify the user appears in Firebase Authentication
4. Check if the user document is created in Firestore

## Troubleshooting

- Make sure your Firestore security rules are correctly set
- Check the browser console for any errors
- Verify your Firebase configuration matches your project settings
- Ensure you've enabled the required authentication methods

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
