// Import Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Firebase services
const firestore = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase Auth
// Note: To properly enable persistence in React Native, you would need to:
// 1. Install the required package: npm install firebase@^9.19.1
// 2. Then use:
//    import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
//    import { getReactNativePersistence } from 'firebase/auth/react-native';
//    const auth = initializeAuth(app, {
//      persistence: getReactNativePersistence(AsyncStorage)
//    });
const auth = getAuth(app);

// Set up auth state listener to persist auth state in AsyncStorage
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    // Store user info in AsyncStorage
    AsyncStorage.setItem('user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    })).catch(error => {
      console.error("Error storing user data:", error);
    });
  } else {
    // User is signed out
    // Remove user info from AsyncStorage
    AsyncStorage.removeItem('user').catch(error => {
      console.error("Error removing user data:", error);
    });
  }
});

// Export the initialized services
export { app, auth, firestore, storage };
export default app;
