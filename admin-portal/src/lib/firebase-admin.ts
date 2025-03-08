import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      throw new Error('Missing Firebase Admin credentials. Check your environment variables.');
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error:', error);
      throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
    }
  }

  return admin;
}

// Initialize services with proper error handling
let adminAuth: admin.auth.Auth;
let adminFirestore: admin.firestore.Firestore;

try {
  const adminApp = getFirebaseAdmin();
  adminAuth = adminApp.auth();
  adminFirestore = adminApp.firestore();
} catch (error) {
  console.error('Failed to initialize Firebase Admin services:', error);
  throw error; // Re-throw to handle it in the API routes
}

export { adminAuth, adminFirestore };
