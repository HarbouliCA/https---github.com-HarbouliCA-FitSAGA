import { NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/users/[id]
 * Get a specific user by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Get user from Firestore
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    
    // Get role-specific data if needed
    if (userData?.role === 'instructor') {
      const instructorDoc = await adminFirestore.collection('instructors').doc(userId).get();
      if (instructorDoc.exists) {
        const instructorData = instructorDoc.data();
        return NextResponse.json({
          ...userData,
          ...instructorData,
          id: userId
        });
      }
    } else if (userData?.role === 'client') {
      const clientDoc = await adminFirestore.collection('clients').doc(userId).get();
      if (clientDoc.exists) {
        const clientData = clientDoc.data();
        return NextResponse.json({
          ...userData,
          ...clientData,
          id: userId
        });
      }
    }
    
    return NextResponse.json({
      ...userData,
      id: userId
    });
  } catch (error: any) {
    console.error(`Error fetching user ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch user', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Update a specific user
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const updates = await request.json();
    
    // Get current user data
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    const currentRole = userData?.role;
    const newRole = updates.role;
    
    // Update user in Firestore
    const userUpdates = {
      ...updates,
      updatedAt: FieldValue.serverTimestamp()
    };
    
    // Remove role-specific fields from the main user document
    delete userUpdates.bankDetails;
    delete userUpdates.dateOfBirth;
    delete userUpdates.workingSince;
    delete userUpdates.accessStatus;
    delete userUpdates.credits;
    delete userUpdates.fidelityScore;
    delete userUpdates.healthGoals;
    delete userUpdates.dietaryRestrictions;
    delete userUpdates.emergencyContact;
    delete userUpdates.notificationPreferences;
    
    await adminFirestore.collection('users').doc(userId).update(userUpdates);
    
    // Handle role-specific updates
    if (currentRole === 'instructor') {
      if (newRole && newRole !== 'instructor') {
        // Role changed from instructor to something else
        // Delete instructor document
        await adminFirestore.collection('instructors').doc(userId).delete();
      } else {
        // Update instructor document
        await adminFirestore.collection('instructors').doc(userId).update({
          ...updates,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    } else if (currentRole === 'client') {
      if (newRole && newRole !== 'client') {
        // Role changed from client to something else
        // Delete client document
        await adminFirestore.collection('clients').doc(userId).delete();
      } else {
        // Update client document
        await adminFirestore.collection('clients').doc(userId).update({
          ...updates,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }
    
    // If role changed to instructor or client, create new role-specific document
    if (newRole && newRole !== currentRole) {
      if (newRole === 'instructor') {
        await adminFirestore.collection('instructors').doc(userId).set({
          ...userData,
          ...updates,
          role: 'instructor',
          dateOfBirth: updates.dateOfBirth || null,
          telephone: updates.telephone || userData?.phoneNumber || null,
          workingSince: updates.workingSince || FieldValue.serverTimestamp(),
          address: updates.address || null,
          accessStatus: updates.accessStatus || 'green',
          bankDetails: updates.bankDetails || {
            bankName: null,
            accountHolder: null,
            accountNumber: null,
            iban: null
          },
          updatedAt: FieldValue.serverTimestamp()
        });
      } else if (newRole === 'client') {
        await adminFirestore.collection('clients').doc(userId).set({
          ...userData,
          ...updates,
          role: 'client',
          memberSince: updates.memberSince || FieldValue.serverTimestamp(),
          accessStatus: updates.accessStatus || 'active',
          credits: updates.credits || 0,
          fidelityScore: updates.fidelityScore || 0,
          healthGoals: updates.healthGoals || [],
          dietaryRestrictions: updates.dietaryRestrictions || [],
          notificationPreferences: updates.notificationPreferences || {
            email: true,
            push: true,
            sms: false
          },
          updatedAt: FieldValue.serverTimestamp()
        });
      }
      
      // Update custom claims if role changed
      await adminAuth.setCustomUserClaims(userId, { role: newRole });
    }
    
    // Update Auth user if needed
    if (updates.email || updates.fullName || updates.phoneNumber || updates.disabled !== undefined) {
      const authUpdates: any = {};
      
      if (updates.email) authUpdates.email = updates.email;
      if (updates.fullName) authUpdates.displayName = updates.fullName;
      if (updates.phoneNumber) authUpdates.phoneNumber = updates.phoneNumber;
      if (updates.disabled !== undefined) authUpdates.disabled = updates.disabled;
      
      await adminAuth.updateUser(userId, authUpdates);
    }
    
    return NextResponse.json({
      success: true,
      id: userId
    });
  } catch (error: any) {
    console.error(`Error updating user ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update user', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a specific user
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Get user data to check role
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    
    // Delete from role-specific collection
    if (userData?.role === 'instructor') {
      await adminFirestore.collection('instructors').doc(userId).delete();
    } else if (userData?.role === 'client') {
      await adminFirestore.collection('clients').doc(userId).delete();
    }
    
    // Delete from users collection
    await adminFirestore.collection('users').doc(userId).delete();
    
    // Delete from Auth
    await adminAuth.deleteUser(userId);
    
    return NextResponse.json({
      success: true,
      id: userId
    });
  } catch (error: any) {
    console.error(`Error deleting user ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete user', message: error.message },
      { status: 500 }
    );
  }
}
