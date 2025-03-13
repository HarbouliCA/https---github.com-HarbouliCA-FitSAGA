import { NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { 
  FieldValue, 
  CollectionReference, 
  Query, 
  DocumentData,
  QueryDocumentSnapshot 
} from 'firebase-admin/firestore';
import { User } from '@/shared/types';

/**
 * GET /api/users
 * List all users with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;
    
    // Reference to users collection
    const usersRef: CollectionReference<DocumentData> = adminFirestore.collection('users');
    let totalCount = 0;
    
    // Get total count first
    const countSnapshot = await usersRef.count().get();
    totalCount = countSnapshot.data().count;
    
    // Start building the query
    let query: Query<DocumentData> = usersRef;
    
    if (role) {
      query = query.where('role', '==', role);
    }
    
    if (status) {
      query = query.where('accessStatus', '==', status);
    }
    
    if (search) {
      query = query.where('fullName', '>=', search)
        .where('fullName', '<=', search + '\uf8ff');
    }
    
    // Apply ordering and pagination
    query = query.orderBy('createdAt', 'desc').limit(limit).offset(offset);
    
    const snapshot = await query.get();
    const users = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as User[];
    
    return NextResponse.json({
      users,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

/**
 * POST /api/users/:userId/access
 * Update a user's access status
 */
export async function POST(request: Request) {
  try {
    const { userId, accessStatus, reason, role } = await request.json();
    
    if (!userId || !accessStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get current user data
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    // Update user access status
    await adminFirestore.collection('users').doc(userId).update({
      accessStatus,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    // Log the access status change
    await adminFirestore.collection('access_logs').add({
      userId,
      role,
      previousStatus: userData?.accessStatus || 'unknown',
      newStatus: accessStatus,
      reason: reason || null,
      changedAt: FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating user access:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to update user access' }, { status: 500 });
  }
}
