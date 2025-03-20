import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getAuth, Auth } from 'firebase-admin/auth';
import './server-only'; // Import the server-only marker

// This file should only be imported in server components or API routes
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-client-components

// Initialize Firebase Admin
let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminFirestore: Firestore | undefined;
let adminStorage: Storage | undefined;

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
    // Note: Make sure this matches exactly with your Firebase Storage bucket name
    // The format is typically: <project-id>.appspot.com
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                         `${projectId}.appspot.com`;
    
    console.log(`Initializing Firebase Admin with bucket: ${storageBucket}`);

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
      // Continue without throwing, we'll handle missing services gracefully
      return {
        adminApp: undefined,
        adminAuth: undefined,
        adminFirestore: undefined,
        adminStorage: undefined
      };
    }
  } else {
    adminApp = getApps()[0];
  }

  try {
    adminAuth = getAuth(adminApp);
  } catch (error) {
    console.error('Error initializing Firebase Auth:', error);
    adminAuth = undefined;
  }

  try {
    adminFirestore = getFirestore(adminApp);
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    adminFirestore = undefined;
  }

  try {
    adminStorage = getStorage(adminApp);
  } catch (error) {
    console.error('Error initializing Firebase Storage:', error);
    adminStorage = undefined;
  }

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
  const admin = initializeFirebaseAdmin();
  app = admin.adminApp;
  auth = admin.adminAuth;
  db = admin.adminFirestore;
  storage = admin.adminStorage;
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

export { app, auth, db, storage };