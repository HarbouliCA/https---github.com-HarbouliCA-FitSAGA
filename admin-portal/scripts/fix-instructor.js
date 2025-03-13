// Script to verify and fix instructor account in Firestore
const admin = require('firebase-admin');
const serviceAccountPath = '../firebase-admin-key.json';

try {
  // Initialize Firebase Admin SDK
  const serviceAccount = require(serviceAccountPath);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  
  const db = admin.firestore();
  
  async function fixInstructorAccount() {
    console.log('Starting instructor account verification...');
    
    // Check for instructor by email
    const instructorEmail = 'instructor@fitsaga.com';
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', instructorEmail).get();
    
    if (snapshot.empty) {
      console.log('No instructor found with email:', instructorEmail);
      console.log('Creating new instructor account...');
      
      // Create a new instructor account
      const newInstructor = {
        email: instructorEmail,
        fullName: 'Test Instructor',
        role: 'instructor',
        accessStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        phoneNumber: '+1234567890',
        uid: 'instructor-test-uid' // This would normally be set by Firebase Auth
      };
      
      await usersRef.doc(newInstructor.uid).set(newInstructor);
      console.log('Instructor account created successfully!');
      return;
    }
    
    // Update existing instructor account
    let instructorDoc = null;
    snapshot.forEach(doc => {
      console.log('Found instructor document:', doc.id);
      console.log('Current data:', doc.data());
      instructorDoc = doc;
    });
    
    if (instructorDoc) {
      const data = instructorDoc.data();
      const updates = {};
      let needsUpdate = false;
      
      // Check role
      if (data.role !== 'instructor') {
        updates.role = 'instructor';
        needsUpdate = true;
        console.log('Fixing role to "instructor"');
      }
      
      // Check access status
      if (data.accessStatus !== 'active' && data.accessStatus !== 'green') {
        updates.accessStatus = 'active';
        needsUpdate = true;
        console.log('Fixing accessStatus to "active"');
      }
      
      // Check if UID field exists
      if (!data.uid) {
        updates.uid = instructorDoc.id;
        needsUpdate = true;
        console.log('Adding uid field with document ID');
      }
      
      // Update document if needed
      if (needsUpdate) {
        console.log('Updating instructor document with:', updates);
        await usersRef.doc(instructorDoc.id).update(updates);
        console.log('Instructor account updated successfully!');
      } else {
        console.log('Instructor account is correctly configured.');
      }
    }
  }
  
  // Run the function
  fixInstructorAccount()
    .then(() => {
      console.log('Script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running script:', error);
      process.exit(1);
    });
    
} catch (error) {
  console.error('Failed to initialize:', error);
  console.error('Make sure the service account key exists at:', serviceAccountPath);
  process.exit(1);
}
