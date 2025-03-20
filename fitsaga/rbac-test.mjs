// Import Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3MAuIYZ2dGq5hspUvxK4KeNIbVzw6EaQ",
  authDomain: "saga-fitness.firebaseapp.com",
  projectId: "saga-fitness",
  storageBucket: "saga-fitness.firebasestorage.app",
  messagingSenderId: "360667066098",
  appId: "1:360667066098:web:93bef4a0c957968c67aa6b",
  measurementId: "G-GCZRZ22EYL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test users - update these with your actual test credentials
const testUsers = [
  { email: 'user@example.com', password: 'password123', expectedRole: 'user' },
  { email: 'instructor@example.com', password: 'password123', expectedRole: 'instructor' },
  { email: 'admin@example.com', password: 'password123', expectedRole: 'admin' }
];

// Test RBAC for each user
async function testUserRBAC(userCredentials) {
  console.log(`Testing RBAC for ${userCredentials.email}...`);
  
  try {
    // Sign in
    const userCredential = await signInWithEmailAndPassword(
      auth,
      userCredentials.email, 
      userCredentials.password
    );
    
    console.log(`Successfully signed in as ${userCredentials.email}`);
    
    // Get user profile from Firestore
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error(`No user profile found for ${userCredentials.email}`);
      return;
    }
    
    const userData = userDoc.data();
    console.log(`User profile data:`, userData);
    
    // Verify role
    if (userData.role !== userCredentials.expectedRole) {
      console.error(`Role mismatch! Expected: ${userCredentials.expectedRole}, Got: ${userData.role}`);
    } else {
      console.log(`Role verified: ${userData.role}`);
    }
    
    // Test access to different collections based on role
    await testCollectionAccess(userCredential.user.uid, userData.role);
    
  } catch (error) {
    console.error(`Error testing ${userCredentials.email}:`, error.message);
  }
}

// Test access to different collections
async function testCollectionAccess(uid, role) {
  console.log(`Testing collection access for role: ${role}`);
  
  // Test activities access
  try {
    const activitiesRef = collection(db, 'activities');
    const activitiesQuery = query(activitiesRef, limit(1));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    console.log(`Activities access: SUCCESS (${activitiesSnapshot.size} documents)`);
  } catch (error) {
    console.error(`Activities access: DENIED - ${error.message}`);
  }
  
  // Test sessions access
  try {
    const sessionsRef = collection(db, 'sessions');
    const sessionsQuery = query(sessionsRef, limit(1));
    const sessionsSnapshot = await getDocs(sessionsQuery);
    console.log(`Sessions access: SUCCESS (${sessionsSnapshot.size} documents)`);
  } catch (error) {
    console.error(`Sessions access: DENIED - ${error.message}`);
  }
  
  // Test instructor-specific sessions (if instructor)
  if (role === 'instructor') {
    try {
      const instructorSessionsRef = collection(db, 'sessions');
      const instructorSessionsQuery = query(
        instructorSessionsRef,
        where('instructorId', '==', uid),
        limit(1)
      );
      const instructorSessionsSnapshot = await getDocs(instructorSessionsQuery);
      console.log(`Instructor's own sessions access: SUCCESS (${instructorSessionsSnapshot.size} documents)`);
    } catch (error) {
      console.error(`Instructor's own sessions access: DENIED - ${error.message}`);
    }
  }
  
  // Test instructors collection access (admin only)
  try {
    const instructorsRef = collection(db, 'instructors');
    const instructorsQuery = query(instructorsRef, limit(1));
    const instructorsSnapshot = await getDocs(instructorsQuery);
    console.log(`Instructors collection access: SUCCESS (${instructorsSnapshot.size} documents)`);
  } catch (error) {
    console.error(`Instructors collection access: DENIED - ${error.message}`);
  }
}

// Run tests
async function runTests() {
  for (const user of testUsers) {
    await testUserRBAC(user);
    console.log('-----------------------------------');
  }
  
  // Sign out after tests
  await signOut(auth);
  console.log('All tests completed');
}

// Execute tests
runTests().catch(console.error);
