import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initAdminSDK } from '@/lib/firebase-admin';
import { Client, ClientFormData } from '@/types/client';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const { db: adminDb, auth: adminAuth } = initAdminSDK();

// GET /api/clients - List clients with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const lastId = url.searchParams.get('lastId') || null;
    const status = url.searchParams.get('status') || null;
    const subscriptionTier = url.searchParams.get('subscriptionTier') || null;
    const minCredits = url.searchParams.get('minCredits') ? parseInt(url.searchParams.get('minCredits')!) : null;
    const searchTerm = url.searchParams.get('search') || null;

    // Reference to clients collection
    const clientsRef = adminDb.collection('clients');
    
    // Build query based on filters
    let clientsQuery = clientsRef.orderBy('name');
    
    // Apply filters
    if (status) {
      clientsQuery = clientsQuery.where('accessStatus', '==', status);
    }
    
    if (subscriptionTier) {
      clientsQuery = clientsQuery.where('subscriptionTier', '==', subscriptionTier);
    }
    
    if (minCredits !== null) {
      clientsQuery = clientsQuery.where('credits', '>=', minCredits);
    }
    
    // Apply pagination
    if (lastId) {
      const lastDocRef = adminDb.collection('clients').doc(lastId);
      const lastDoc = await lastDocRef.get();
      if (lastDoc.exists) {
        clientsQuery = clientsQuery.startAfter(lastDoc);
      }
    }
    
    clientsQuery = clientsQuery.limit(pageSize);
    
    // Execute query
    const snapshot = await clientsQuery.get();
    
    // Process results
    const clients: Client[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      clients.push({
        id: doc.id,
        email: data.email || '',
        name: data.name || '',
        profileImage: data.profileImage || null,
        dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
        gender: data.gender || 'other',
        height: data.height || null,
        weight: data.weight || null,
        address: data.address || null,
        telephone: data.telephone || null,
        role: data.role || 'client',
        memberSince: data.memberSince?.toDate() || new Date(),
        lastActive: data.lastActive?.toDate() || new Date(),
        accessStatus: data.accessStatus || 'active',
        credits: data.credits || 0,
        fidelityScore: data.fidelityScore || 0,
        subscriptionTier: data.subscriptionTier || null,
        subscriptionExpiry: data.subscriptionExpiry?.toDate() || null,
        observations: data.observations || null,
        fitnessGoals: data.fitnessGoals || [],
        onboardingCompleted: data.onboardingCompleted || false,
        notificationSettings: data.notificationSettings || {
          email: true,
          push: true,
          sms: false
        },
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    // If search term is provided, filter results client-side
    let filteredClients = clients;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredClients = clients.filter(client => 
        client.name.toLowerCase().includes(term) || 
        client.email.toLowerCase().includes(term) ||
        client.telephone?.toLowerCase().includes(term) ||
        client.address?.toLowerCase().includes(term)
      );
    }
    
    // Determine if there are more results
    const hasMore = clients.length === pageSize;
    
    // Get the last visible document ID for pagination
    const lastVisible = clients.length > 0 ? clients[clients.length - 1].id : null;
    
    return NextResponse.json({
      clients: filteredClients,
      hasMore,
      lastVisible
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as ClientFormData;
    
    // Validate required fields
    if (!data.email || !data.name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    try {
      const emailCheck = await adminAuth.getUserByEmail(data.email);
      
      // If we get here, the email exists and is active
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    } catch (authError: any) {
      // If the error is auth/user-not-found, the email is available
      // Otherwise, there might be another issue with Firebase Auth
      if (authError.code !== 'auth/user-not-found') {
        console.error('Error checking email:', authError);
        if (authError.code === 'auth/email-already-exists') {
          return NextResponse.json(
            { error: 'Email already exists but may be in deleted state. Please try a different email or wait a few minutes.' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'Error checking email availability' },
          { status: 500 }
        );
      }
      // If we get here, the email is available
    }
    
    // Create user in Firebase Auth
    try {
      const userRecord = await adminAuth.createUser({
        email: data.email,
        displayName: data.name,
        photoURL: data.profileImage,
        disabled: data.accessStatus === 'suspended',
      });
      
      // Set custom claims based on role
      await adminAuth.setCustomUserClaims(userRecord.uid, {
        role: data.role || 'client'
      });
      
      // Create client document in Firestore
      const now = Timestamp.now();
      const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
      const subscriptionExpiry = data.subscriptionExpiry ? new Date(data.subscriptionExpiry) : null;
      const clientData = {
        email: data.email,
        name: data.name,
        profileImage: data.profileImage || null,
        dateOfBirth: dateOfBirth ? Timestamp.fromDate(dateOfBirth) : null,
        gender: data.gender || 'other',
        height: data.height || null,
        weight: data.weight || null,
        address: data.address || null,
        telephone: data.telephone || null,
        role: data.role || 'client',
        memberSince: now,
        lastActive: now,
        accessStatus: data.accessStatus || 'active',
        credits: data.credits || 0,
        fidelityScore: data.fidelityScore || 0,
        subscriptionTier: data.subscriptionTier || null,
        subscriptionExpiry: subscriptionExpiry ? Timestamp.fromDate(subscriptionExpiry) : null,
        observations: data.observations || null,
        fitnessGoals: data.fitnessGoals || [],
        onboardingCompleted: false,
        notificationSettings: data.notificationSettings || {
          email: true,
          push: true,
          sms: false
        },
        createdAt: now,
        updatedAt: now
      };
      
      await adminDb.collection('clients').doc(userRecord.uid).set(clientData);
      
      // Convert Timestamps back to ISO strings for response
      const responseData = {
        id: userRecord.uid,
        ...clientData,
        dateOfBirth: clientData.dateOfBirth?.toDate().toISOString() || null,
        memberSince: clientData.memberSince.toDate().toISOString(),
        lastActive: clientData.lastActive.toDate().toISOString(),
        subscriptionExpiry: clientData.subscriptionExpiry?.toDate().toISOString() || null,
        createdAt: clientData.createdAt.toDate().toISOString(),
        updatedAt: clientData.updatedAt.toDate().toISOString()
      };
      
      return NextResponse.json(responseData);
    } catch (createError: any) {
      console.error('Error creating client:', createError);
      
      // Handle specific Firebase Auth errors
      if (createError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      } else if (createError.code === 'auth/invalid-email') {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      } else if (createError.code === 'auth/operation-not-allowed') {
        return NextResponse.json(
          { error: 'Email/password accounts are not enabled' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

// PATCH /api/clients - Batch update clients
export async function PATCH(request: NextRequest) {
  try {
    const { clientIds, updates } = await request.json();
    
    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: 'No client IDs provided' },
        { status: 400 }
      );
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }
    
    // Create a batch operation
    const batch = adminDb.batch();
    
    // Add update operations to batch
    for (const clientId of clientIds) {
      const clientRef = adminDb.collection('clients').doc(clientId);
      batch.update(clientRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      // If updating access status, also update in Auth
      if (updates.accessStatus) {
        await adminAuth.updateUser(clientId, {
          disabled: updates.accessStatus === 'suspended'
        });
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return NextResponse.json({
      success: true,
      updatedCount: clientIds.length
    });
  } catch (error) {
    console.error('Error updating clients:', error);
    return NextResponse.json(
      { error: 'Failed to update clients' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients - Batch delete clients
export async function DELETE(request: NextRequest) {
  try {
    const { clientIds } = await request.json();
    
    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: 'No client IDs provided' },
        { status: 400 }
      );
    }
    
    // Check for active bookings
    const bookingsRef = adminDb.collection('bookings');
    const activeBookings: string[] = [];
    
    for (const clientId of clientIds) {
      const bookingQuery = await bookingsRef
        .where('userId', '==', clientId)
        .where('status', '==', 'confirmed')
        .limit(1)
        .get();
      
      if (!bookingQuery.empty) {
        activeBookings.push(clientId);
      }
    }
    
    if (activeBookings.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete clients with active bookings',
          clientsWithBookings: activeBookings
        },
        { status: 409 }
      );
    }
    
    // Create a batch operation
    const batch = adminDb.batch();
    
    // Add delete operations to batch
    for (const clientId of clientIds) {
      const clientRef = adminDb.collection('clients').doc(clientId);
      batch.delete(clientRef);
      
      // Also delete from Auth
      await adminAuth.deleteUser(clientId);
    }
    
    // Commit the batch
    await batch.commit();
    
    return NextResponse.json({
      success: true,
      deletedCount: clientIds.length
    });
  } catch (error) {
    console.error('Error deleting clients:', error);
    return NextResponse.json(
      { error: 'Failed to delete clients' },
      { status: 500 }
    );
  }
}
