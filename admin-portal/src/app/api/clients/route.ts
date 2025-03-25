import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initAdminSDK } from '@/lib/firebase-admin';
import { Client, ClientFormData } from '@/types/client';
import { ClientCredits } from '@/types/subscriptionPlan';
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

    console.log('Fetching clients with params:', { 
      pageSize, lastId, status, subscriptionTier, minCredits, searchTerm 
    });

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
    
    // Remove the minCredits filter as it can cause issues with different credits formats
    // We'll filter by credits client-side after fetching the data
    console.log('Skipping minCredits filter in Firestore query to avoid issues with different credits formats');
    
    // Apply pagination
    if (lastId) {
      try {
        const lastDocRef = adminDb.collection('clients').doc(lastId);
        const lastDoc = await lastDocRef.get();
        if (lastDoc.exists) {
          clientsQuery = clientsQuery.startAfter(lastDoc);
        } else {
          console.warn(`Last document with ID ${lastId} does not exist, ignoring pagination`);
        }
      } catch (paginationError) {
        console.error('Error applying pagination:', paginationError);
        // Continue without pagination if there's an error
      }
    }
    
    clientsQuery = clientsQuery.limit(pageSize);
    
    // Execute query
    console.log('Executing Firestore query...');
    const snapshot = await clientsQuery.get();
    console.log(`Query returned ${snapshot.size} documents`);
    
    // Process results
    const clients: Client[] = [];
    snapshot.forEach(doc => {
      try {
        const data = doc.data();
        
        // Extract credits correctly, handling both number and object formats
        let clientCredits: ClientCredits;
        if (typeof data.credits === 'number') {
          clientCredits = {
            total: data.credits,
            intervalCredits: 0,
            lastRefilled: new Date()
          };
        } else if (data.credits && typeof data.credits === 'object') {
          // Try to extract from credits object if it exists
          let totalCredits;
          
          if (data.credits.total === "unlimited" || data.gymCredits === "unlimited") {
            totalCredits = "unlimited";
          } else {
            totalCredits = data.credits.total || 
                          data.credits.value || 
                          data.credits.amount || 
                          data.credits.balance || 
                          data.gymCredits || 0;
          }
          
          clientCredits = {
            total: totalCredits,
            intervalCredits: data.credits.intervalCredits || data.intervalCredits || 0,
            lastRefilled: data.credits.lastRefilled ? 
              (data.credits.lastRefilled.toDate ? data.credits.lastRefilled.toDate() : new Date(data.credits.lastRefilled)) 
              : new Date()
          };
        } else {
          // Default if no credits information is available
          clientCredits = {
            total: 0,
            intervalCredits: 0,
            lastRefilled: new Date()
          };
        }
        
        // Helper function to safely convert various date formats to Date objects
        // Returns Date | null for most date fields
        const safelyConvertToDate = (dateValue: any): Date | null => {
          try {
            if (!dateValue) return null;
            
            // If it's already a Date object
            if (dateValue instanceof Date) return dateValue;
            
            // If it's a Firestore Timestamp with toDate method
            if (dateValue.toDate && typeof dateValue.toDate === 'function') {
              return dateValue.toDate();
            }
            
            // If it's a string, parse it
            if (typeof dateValue === 'string') {
              return new Date(dateValue);
            }
            
            // If it's a number (timestamp in seconds or milliseconds)
            if (typeof dateValue === 'number') {
              // If it's in seconds (Firestore timestamp seconds)
              if (dateValue < 2000000000) {
                return new Date(dateValue * 1000);
              }
              // If it's in milliseconds
              return new Date(dateValue);
            }
            
            return null;
          } catch (error) {
            console.error('Error converting date:', error, dateValue);
            return null;
          }
        };
        
        // Helper function that always returns a Date (never null)
        // Use this for required Date fields like dateOfBirth
        const convertToRequiredDate = (dateValue: any): Date => {
          const result = safelyConvertToDate(dateValue);
          return result || new Date(); // Always return a Date, never null
        };
        
        // Helper function that returns Date | undefined (never null)
        // Use this for optional Date fields like subscriptionExpiry
        const convertToOptionalDate = (dateValue: any): Date | undefined => {
          const result = safelyConvertToDate(dateValue);
          return result || undefined; // Convert null to undefined
        };
        
        clients.push({
          id: doc.id,
          email: data.email || '',
          name: data.name || '',
          profileImage: data.profileImage || null,
          dateOfBirth: convertToRequiredDate(data.dateOfBirth), // Always returns a Date
          gender: data.gender || 'other',
          height: data.height || null,
          weight: data.weight || null,
          address: data.address || null,
          telephone: data.telephone || null,
          role: data.role || 'client',
          memberSince: convertToRequiredDate(data.memberSince), // Always returns a Date
          lastActive: convertToRequiredDate(data.lastActive), // Always returns a Date
          accessStatus: data.accessStatus || 'active',
          credits: clientCredits,
          fidelityScore: data.fidelityScore || 0,
          subscriptionTier: data.subscriptionTier || null,
          subscriptionExpiry: convertToOptionalDate(data.subscriptionExpiry), // Returns Date | undefined
          observations: data.observations || null,
          fitnessGoals: data.fitnessGoals || [],
          onboardingCompleted: data.onboardingCompleted || false,
          notificationSettings: data.notificationSettings || {
            email: true,
            push: true,
            sms: false
          },
          createdAt: convertToRequiredDate(data.createdAt), // Always returns a Date
          updatedAt: convertToRequiredDate(data.updatedAt) // Always returns a Date
        });
      } catch (docError) {
        console.error(`Error processing client document ${doc.id}:`, docError);
        // Continue with other documents
      }
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
    
    // If minCredits was provided, filter by credits client-side
    if (minCredits !== null) {
      console.log(`Filtering clients by minCredits: ${minCredits} client-side`);
      filteredClients = filteredClients.filter(client => 
        (client.credits?.total || 0) >= minCredits
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
      
      // Prepare client data
      let clientData: any = {
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
        fidelityScore: data.fidelityScore || 0,
        subscriptionTier: data.subscriptionTier || data.subscriptionPlan || null,
        subscriptionPlan: data.subscriptionPlan || null,
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
      
      // Initialize credits structure
      clientData.credits = {
        total: 0,
        intervalCredits: 0,
        lastRefilled: now
      };

      // If a subscription plan is provided, set initial credits
      if (data.subscriptionPlan) {
        const planDoc = await adminDb.collection('subscriptionPlans').doc(data.subscriptionPlan).get();
        if (planDoc.exists) {
          const plan = planDoc.data();
          const intervalCredits = plan?.name?.toLowerCase().includes('gold') ? 4 : (plan?.intervalCredits || 0);
          
          clientData.credits = {
            total: plan?.credits || 0,
            intervalCredits,
            lastRefilled: now
          };
        }
      }
      
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
