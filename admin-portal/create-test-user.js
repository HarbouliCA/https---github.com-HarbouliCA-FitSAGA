// This script creates a test admin user in Firebase Authentication and Firestore
// Run this script with: node create-test-user.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase configuration from .env.local
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Test user credentials
const testUser = {
  email: 'admin@fitsaga.com',
  password: 'admin123'
};

async function createTestUser() {
  try {
    // Create user in Firebase Authentication
    console.log(`Creating test user: ${testUser.email}`);
    const userCredential = await createUserWithEmailAndPassword(auth, testUser.email, testUser.password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    const userData = {
      uid: user.uid,
      email: user.email,
      name: 'Admin User',
      role: 'admin',
      credits: 100,
      memberSince: new Date(),
      lastActive: new Date(),
      onboardingCompleted: true,
      accessStatus: 'green'
    };
    
    await setDoc(doc(firestore, 'users', user.uid), userData);
    console.log(`Test user created successfully with UID: ${user.uid}`);
    console.log('User data saved to Firestore');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
