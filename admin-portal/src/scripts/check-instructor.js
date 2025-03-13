// Script to check instructor account in Firestore
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('../../firebase-admin-key.json');

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkInstructor() {
  try {
    // Check if instructor exists in users collection
    const instructorEmail = 'instructor@fitsaga.com';
    const usersSnapshot = await db.collection('users')
      .where('email', '==', instructorEmail)
      .get();
    
    if (usersSnapshot.empty) {
      console.log(`No user found with email: ${instructorEmail}`);
      
      // Create test instructor if it doesn't exist
      console.log('Creating test instructor account...');
      
      const newInstructor = {
        email: instructorEmail,
        fullName: 'Test Instructor',
        role: 'instructor',
        accessStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        phoneNumber: '+1234567890'
      };
      
      await db.collection('users').add(newInstructor);
      console.log('Test instructor created successfully');
    } else {
      // Display instructor data
      usersSnapshot.forEach(doc => {
        console.log('Found instructor:');
        console.log(`ID: ${doc.id}`);
        console.log('Data:', doc.data());
        
        // Update instructor if needed
        const data = doc.data();
        const updates = {};
        
        if (data.role !== 'instructor') {
          updates.role = 'instructor';
        }
        
        if (data.accessStatus !== 'active' && data.accessStatus !== 'green') {
          updates.accessStatus = 'active';
        }
        
        if (Object.keys(updates).length > 0) {
          console.log('Updating instructor with:', updates);
          db.collection('users').doc(doc.id).update(updates)
            .then(() => console.log('Instructor updated successfully'))
            .catch(err => console.error('Error updating instructor:', err));
        }
      });
    }
  } catch (error) {
    console.error('Error checking instructor:', error);
  }
}

checkInstructor().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
