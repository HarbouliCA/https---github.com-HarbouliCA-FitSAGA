import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * PATCH /api/users/[id]/access
 * Update a user's access status
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { accessStatus, reason } = await request.json();
    
    // Get user data to check role
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    const role = userData?.role;
    
    // Validate access status based on role
    if (role === 'instructor') {
      if (!['green', 'yellow', 'red'].includes(accessStatus)) {
        return NextResponse.json(
          { error: 'Invalid access status for instructor. Must be green, yellow, or red' },
          { status: 400 }
        );
      }
      
      // Update instructor access status
      await adminFirestore.collection('instructors').doc(userId).update({
        accessStatus,
        updatedAt: FieldValue.serverTimestamp()
      });
    } else if (role === 'client') {
      if (!['active', 'suspended', 'inactive'].includes(accessStatus)) {
        return NextResponse.json(
          { error: 'Invalid access status for client. Must be active, suspended, or inactive' },
          { status: 400 }
        );
      }
      
      // Update client access status
      await adminFirestore.collection('clients').doc(userId).update({
        accessStatus,
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      return NextResponse.json(
        { error: 'Access status can only be updated for instructors and clients' },
        { status: 400 }
      );
    }
    
    // Log the access status change
    await adminFirestore.collection('access_logs').add({
      userId,
      role,
      previousStatus: userData?.accessStatus || 'unknown',
      newStatus: accessStatus,
      reason: reason || null,
      changedAt: FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({
      success: true,
      id: userId,
      accessStatus
    });
  } catch (error: any) {
    console.error(`Error updating access status for user ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update access status', message: error.message },
      { status: 500 }
    );
  }
}
