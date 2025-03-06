const fs = require('fs');
const path = require('path');

// Firebase configuration values
const firebaseConfig = {
  apiKey: "AIzaSyD3MAuIYZ2dGq5hspUvxK4KeNIbVzw6EaQ",
  authDomain: "saga-fitness.firebaseapp.com",
  projectId: "saga-fitness",
  storageBucket: "saga-fitness.firebasestorage.app",
  messagingSenderId: "360667066098",
  appId: "1:360667066098:web:93bef4a0c957968c67aa6b",
  measurementId: "G-GCZRZ22EYL"
};

// Create .env.local content
const envContent = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${firebaseConfig.apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${firebaseConfig.appId}
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${firebaseConfig.measurementId}
`;

// Write to .env.local file
const envPath = path.join(__dirname, '.env.local');
fs.writeFileSync(envPath, envContent);

console.log('.env.local file created successfully with Firebase configuration!');
