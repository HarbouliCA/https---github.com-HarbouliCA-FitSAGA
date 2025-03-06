const admin = require('firebase-admin');
const serviceAccount = require('./saga-fitness-firebase-adminsdk-fbsvc-8b4d0decfc.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedDatabase() {
  try {
    console.log('Starting database seeding with Admin SDK...');
    
    // Add admin user to users collection
    const adminUid = 'admin';
    await db.collection('users').doc(adminUid).set({
      name: 'Admin User',
      email: 'admin@sagafitness.com',
      gender: 'other',
      birthdate: admin.firestore.Timestamp.fromDate(new Date('1990-01-01')),
      height: 175,
      weight: 70,
      observations: 'System administrator',
      fidelityScore: 100,
      scoreCredits: 1000,
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
      await db.collection('activities').doc(activity.id).set({
        ...activity,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
      await db.collection('sessions').doc(session.id).set({
        ...session,
        startTime: admin.firestore.Timestamp.fromDate(session.startTime),
        endTime: admin.firestore.Timestamp.fromDate(session.endTime),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
      await db.collection('forumPosts').doc(post.id).set({
        ...post,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
      await db.collection('tutorials').doc(tutorial.id).set({
        ...tutorial,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Tutorial created: ${tutorial.title}`);
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Ensure the process exits after seeding
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase();
