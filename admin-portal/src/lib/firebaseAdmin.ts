import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getAuth, Auth } from 'firebase-admin/auth';
import './server-only'; // Import the server-only marker

// This file should only be imported in server components or API routes
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-client-components

// Initialize Firebase Admin
let adminApp: App;
let adminAuth: Auth;
let adminFirestore: Firestore;
let adminStorage: Storage;

// Function to initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
  // Check if we're on the server side
  if (typeof window !== 'undefined') {
    throw new Error(
      'Firebase Admin SDK should only be used on the server side. ' +
      'This error indicates it was imported in a client component.'
    );
  }

  if (!getApps().length) {
    // Get the private key as a properly formatted string
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    const projectId = process.env.FIREBASE_PROJECT_ID || '';
    
    // Use the project ID as the default bucket name if not specified
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                         `${projectId}.appspot.com`;

    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        storageBucket,
      });
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw new Error('Failed to initialize Firebase Admin SDK');
    }
  } else {
    adminApp = getApps()[0];
  }

  adminAuth = getAuth(adminApp);
  adminFirestore = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);

  return {
    adminApp,
    adminAuth,
    adminFirestore,
    adminStorage,
  };
}

// Initialize on import, but only if we're on the server side
let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: Storage | undefined;

// Use a try-catch to handle any initialization errors
try {
  if (typeof window === 'undefined') {
    const admin = initializeFirebaseAdmin();
    app = admin.adminApp;
    auth = admin.adminAuth;
    db = admin.adminFirestore;
    storage = admin.adminStorage;
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

export { app, auth, db, storage };
