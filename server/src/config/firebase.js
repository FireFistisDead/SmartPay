const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK
let app;

try {
  // For development, you can use default credentials or environment variables
  if (!admin.apps.length) {
    app = admin.initializeApp({
      projectId: "blockchain-9ff21",
      // Use environment variables or default credentials
      // For production, add your service account key here
    });
  } else {
    app = admin.app();
  }
  
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.log('Firebase admin initialization error:', error.message);
  // Continue without Firebase for now
  app = null;
}

const auth = app ? getAuth(app) : null;

module.exports = { admin, auth };
