import { NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Check if Firebase Admin is initialized
    if (!adminAuth || !adminFirestore) {
      console.error('Firebase Admin not initialized');
      return NextResponse.json(
        { message: 'Internal server error - Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const { id } = params;

    // Get instructor data to check if it exists
    const instructorDoc = await adminFirestore.collection('instructors').doc(id).get();
    if (!instructorDoc.exists) {
      return NextResponse.json(
        { message: 'Instructor not found' },
        { status: 404 }
      );
    }

    // Start a batch write
    const batch = adminFirestore.batch();

    // Delete instructor document
    batch.delete(adminFirestore.collection('instructors').doc(id));

    // Delete user document
    batch.delete(adminFirestore.collection('users').doc(id));

    // Get all sessions assigned to this instructor
    const sessionsSnapshot = await adminFirestore
      .collection('sessions')
      .where('instructorId', '==', id)
      .get();

    // Update sessions to remove instructor assignment
    sessionsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        instructorId: null,
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    // Get all activities created by this instructor
    const activitiesSnapshot = await adminFirestore
      .collection('activities')
      .where('createdBy', '==', id)
      .get();

    // Update activities to mark as unassigned
    activitiesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        createdBy: null,
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    // Commit all Firestore changes
    await batch.commit();

    // Delete from Firebase Auth
    await adminAuth.deleteUser(id);

    return NextResponse.json({ 
      message: 'Instructor deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting instructor:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('auth/user-not-found')) {
        return NextResponse.json(
          { message: 'Instructor not found in authentication system' },
          { status: 404 }
        );
      }
      if (error.message.includes('auth/invalid-uid')) {
        return NextResponse.json(
          { message: 'Invalid instructor ID' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete instructor' },
      { status: 500 }
    );
  }
}
