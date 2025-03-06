import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnxIFmXsXZYYmIrfWVpjZEHSXxEumO4TI",
  authDomain: "fitsaga-app.firebaseapp.com",
  projectId: "fitsaga-app",
  storageBucket: "fitsaga-app.appspot.com",
  messagingSenderId: "1098765432",
  appId: "1:1098765432:web:abcdef1234567890abcdef",
  measurementId: "G-ABCDEF1234"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Create or sign in with admin user
    const adminEmail = 'anass.harbouli.da@gmail.com';
    const adminPassword = 'admin123'; // Change this in production
    
    let adminUid;
    try {
      // Try to create the admin user
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      adminUid = userCredential.user.uid;
      console.log('Admin user created with UID:', adminUid);
    } catch (error: any) {
      // If user already exists, sign in instead
      if (error.code === 'auth/email-already-in-use') {
        console.log('Admin user already exists, signing in...');
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        adminUid = userCredential.user.uid;
        console.log('Signed in as admin with UID:', adminUid);
      } else {
        throw error;
      }
    }
    
    // Add admin user to users collection
    await setDoc(doc(db, 'users', adminUid), {
      name: 'Admin User',
      email: adminEmail,
      gender: 'other',
      birthdate: Timestamp.fromDate(new Date('1990-01-01')),
      height: 175,
      weight: 70,
      observations: 'System administrator',
      fidelityScore: 100,
      scoreCredits: 1000,
      isAdmin: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('Admin user added to users collection');
    
    // Create sample activities
    const activities = [
      {
        id: 'kickboxing',
        name: 'Kickboxing',
        description: 'High-intensity kickboxing workout for all levels',
        isActive: true
      },
      {
        id: 'yoga',
        name: 'Yoga',
        description: 'Relaxing yoga sessions for mind and body balance',
        isActive: true
      },
      {
        id: 'musculation',
        name: 'Musculation',
        description: 'Strength training and muscle building workouts',
        isActive: true
      },
      {
        id: 'free-access',
        name: 'Free Access',
        description: 'Open gym time with access to all equipment',
        isActive: true
      }
    ];
    
    for (const activity of activities) {
      await setDoc(doc(db, 'activities', activity.id), {
        ...activity,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`Activity created: ${activity.name}`);
    }
    
    // Create sample sessions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sessions = [
      {
        id: 'morning-kickboxing',
        activityId: 'kickboxing',
        title: 'Morning Kickboxing',
        description: 'Start your day with an energizing kickboxing session',
        startTime: new Date(new Date(tomorrow).setHours(8, 0, 0, 0)),
        endTime: new Date(new Date(tomorrow).setHours(9, 0, 0, 0)),
        maxParticipants: 20,
        currentParticipants: 0,
        creditCost: 2,
        isActive: true
      },
      {
        id: 'evening-yoga',
        activityId: 'yoga',
        title: 'Evening Yoga',
        description: 'Unwind after a long day with relaxing yoga',
        startTime: new Date(new Date(tomorrow).setHours(18, 0, 0, 0)),
        endTime: new Date(new Date(tomorrow).setHours(19, 0, 0, 0)),
        maxParticipants: 15,
        currentParticipants: 0,
        creditCost: 1,
        isActive: true
      },
      {
        id: 'afternoon-musculation',
        activityId: 'musculation',
        title: 'Afternoon Strength Training',
        description: 'Build strength and muscle with guided training',
        startTime: new Date(new Date(tomorrow).setHours(14, 0, 0, 0)),
        endTime: new Date(new Date(tomorrow).setHours(15, 30, 0, 0)),
        maxParticipants: 10,
        currentParticipants: 0,
        creditCost: 3,
        isActive: true
      }
    ];
    
    for (const session of sessions) {
      await setDoc(doc(db, 'sessions', session.id), {
        ...session,
        startTime: Timestamp.fromDate(session.startTime),
        endTime: Timestamp.fromDate(session.endTime),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`Session created: ${session.title}`);
    }
    
    // Create sample forum posts
    const forumPosts = [
      {
        id: 'welcome-announcement',
        title: 'Welcome to Saga Fitness!',
        content: 'We\'re excited to have you join our fitness community. Check out our upcoming events and special offers.',
        authorId: adminUid,
        isAnnouncement: true,
        likesCount: 0,
        commentsCount: 0,
        images: []
      },
      {
        id: 'nutrition-tips',
        title: 'Nutrition Tips for Better Workouts',
        content: 'Proper nutrition is key to getting the most out of your workouts. Here are some tips to fuel your body effectively...',
        authorId: adminUid,
        isAnnouncement: false,
        likesCount: 0,
        commentsCount: 0,
        images: []
      }
    ];
    
    for (const post of forumPosts) {
      await setDoc(doc(db, 'forumPosts', post.id), {
        ...post,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`Forum post created: ${post.title}`);
    }
    
    // Create sample tutorials
    const tutorials = [
      {
        id: 'kickboxing-basics',
        title: 'Beginner\'s Guide to Kickboxing',
        description: 'Learn the basics of kickboxing with this comprehensive guide',
        content: 'Detailed content about kickboxing techniques, benefits, and safety tips...',
        category: 'workout',
        mediaUrls: ['https://example.com/kickboxing-video.mp4']
      },
      {
        id: 'healthy-meal-prep',
        title: 'Healthy Meal Prep for Fitness',
        description: 'Learn how to prepare nutritious meals to support your fitness goals',
        content: 'Step-by-step guide to meal planning, preparation, and storage...',
        category: 'nutrition',
        mediaUrls: ['https://example.com/meal-prep-guide.jpg']
      }
    ];
    
    for (const tutorial of tutorials) {
      await setDoc(doc(db, 'tutorials', tutorial.id), {
        ...tutorial,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`Tutorial created: ${tutorial.title}`);
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seeding function
seedDatabase();
