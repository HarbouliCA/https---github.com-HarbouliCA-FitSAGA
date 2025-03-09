import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminFirestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * DELETE /api/sessions
 * 
 * Deletes one or more sessions by ID.
 * Only accessible to admin users.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }
    
    // Verify admin status using admin SDK
    const userRef = adminFirestore.collection('users').doc(session.user.id);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Unauthorized: User not found' },
        { status: 401 }
      );
    }
    
    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can delete sessions' },
        { status: 403 }
      );
    }
    
    // Get session IDs from request body
    const { sessionIds }: { sessionIds: string[] } = await request.json();
    
    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request: No session IDs provided' },
        { status: 400 }
      );
    }
    
    // Check for active bookings
    const bookingsSnapshot = await adminFirestore.collection('bookings')
      .where('sessionId', 'in', sessionIds)
      .get();
    
    if (!bookingsSnapshot.empty) {
      const sessionsWithBookings: string[] = [];
      bookingsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.sessionId) {
          sessionsWithBookings.push(data.sessionId);
        }
      });
      
      return NextResponse.json(
        { 
          error: 'Conflict: Cannot delete sessions with active bookings',
          sessionsWithBookings
        },
        { status: 409 }
      );
    }
    
    // Check session status
    const sessionsSnapshot = await adminFirestore.collection('sessions')
      .where(admin.firestore.FieldPath.documentId(), 'in', sessionIds)
      .get();
    
    const invalidSessions: Array<{id: string; activityName: string; status: string}> = [];
    sessionsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'in_progress' || data.status === 'completed') {
        invalidSessions.push({
          id: doc.id,
          activityName: data.activityName || 'Unknown',
          status: data.status
        });
      }
    });
    
    if (invalidSessions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Conflict: Cannot delete sessions that are in progress or completed',
          invalidSessions
        },
        { status: 409 }
      );
    }
    
    // Delete sessions using admin SDK
    const batch = adminFirestore.batch();
    
    sessionIds.forEach(sessionId => {
      const sessionRef = adminFirestore.collection('sessions').doc(sessionId);
      batch.delete(sessionRef);
    });
    
    await batch.commit();
    
    return NextResponse.json(
      { 
        success: true,
        message: `Successfully deleted ${sessionIds.length} session(s)`,
        deletedCount: sessionIds.length
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error deleting sessions:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
