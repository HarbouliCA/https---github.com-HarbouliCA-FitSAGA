import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3MAuIYZ2dGq5hspUvxK4KeNIbVzw6EaQ",
  authDomain: "saga-fitness.firebaseapp.com",
  projectId: "saga-fitness",
  storageBucket: "saga-fitness.firebasestorage.app",
  messagingSenderId: "360667066098",
  appId: "1:360667066098:web:93bef4a0c957968c67aa6b",
  measurementId: "G-GCZRZ22EYL"
};

// Initialize Firebase only on the client side
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: any = null;

if (typeof window !== 'undefined') {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
    analytics = getAnalytics(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  // Server-side placeholder
  app = null;
  auth = null;
  firestore = null;
  storage = null;
  analytics = null;
}

export { app, auth, firestore, storage, analytics };
