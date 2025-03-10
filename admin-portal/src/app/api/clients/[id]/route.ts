import { NextRequest, NextResponse } from 'next/server';
import { initAdminSDK } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
const { db: adminDb, auth: adminAuth } = initAdminSDK();

// Define types for Firestore data
interface BookingData {
  sessionId: string;
  userId: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  bookedAt: FirebaseFirestore.Timestamp;
  creditsUsed: number;
  notes?: string;
}

interface ClientBooking {
  id: string;
  sessionId: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  creditsUsed: number;
  bookedAt?: Date;
  sessionTitle?: string;
  sessionDate?: Date;
}

interface ClientData {
  email: string;
  name: string;
  profileImage?: string | null;
  dateOfBirth?: FirebaseFirestore.Timestamp | null;
  gender?: 'male' | 'female' | 'other';
  height?: number | null;
  weight?: number | null;
  address?: string | null;
  telephone?: string | null;
  role?: 'client' | 'instructor' | 'admin';
  memberSince?: FirebaseFirestore.Timestamp;
  lastActive?: FirebaseFirestore.Timestamp;
  accessStatus?: 'active' | 'suspended' | 'inactive';
  credits?: number;
  fidelityScore?: number;
  subscriptionTier?: string | null;
  subscriptionExpiry?: FirebaseFirestore.Timestamp | null;
  observations?: string | null;
  fitnessGoals?: string[];
  onboardingCompleted?: boolean;
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  createdAt?: FirebaseFirestore.Timestamp | null;
  updatedAt?: FirebaseFirestore.Timestamp | null;
}

// GET /api/clients/[id] - Get a specific client
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Get the client ID from context params - properly await it
    const params = await context.params;
    
    // Ensure id is available
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const clientId = params.id;
    
    // Get client document
    const clientDoc = await adminDb.collection('clients').doc(clientId).get();
    
    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const clientData = clientDoc.data() as ClientData;
    const client = {
      id: clientDoc.id,
      email: clientData.email || '',
      name: clientData.name || '',
      profileImage: clientData.profileImage || null,
      dateOfBirth: clientData.dateOfBirth?.toDate() || null,
      gender: clientData.gender || 'other',
      height: clientData.height || null,
      weight: clientData.weight || null,
      address: clientData.address || null,
      telephone: clientData.telephone || null,
      role: clientData.role || 'client',
      memberSince: clientData.memberSince?.toDate() || null,
      lastActive: clientData.lastActive?.toDate() || null,
      accessStatus: clientData.accessStatus || 'active',
      credits: clientData.credits || 0,
      fidelityScore: clientData.fidelityScore || 0,
      subscriptionTier: clientData.subscriptionTier || null,
      subscriptionExpiry: clientData.subscriptionExpiry?.toDate() || null,
      observations: clientData.observations || null,
      fitnessGoals: clientData.fitnessGoals || [],
      onboardingCompleted: clientData.onboardingCompleted || false,
      notificationSettings: clientData.notificationSettings || {
        email: true,
        push: true,
        sms: false
      },
      createdAt: clientData.createdAt?.toDate() || null,
      updatedAt: clientData.updatedAt?.toDate() || null
    };

    try {
      // Get recent bookings - wrap this in a try/catch to handle index errors
      const bookingsQuery = await adminDb
        .collection('bookings')
        .where('userId', '==', clientId)
        .limit(5) // Remove the orderBy for now to avoid index errors
        .get();
      
      const recentBookings: ClientBooking[] = [];
      bookingsQuery.forEach(doc => {
        const bookingData = doc.data() as BookingData;
        recentBookings.push({
          id: doc.id,
          sessionId: bookingData.sessionId,
          status: bookingData.status,
          creditsUsed: bookingData.creditsUsed,
          bookedAt: bookingData.bookedAt?.toDate() || undefined,
        });
      });

      return NextResponse.json({ ...client, recentBookings });
    } catch (bookingError) {
      console.error('Error fetching bookings:', bookingError);
      // Return client data even if bookings fail
      return NextResponse.json({ ...client, recentBookings: [] });
    }
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update a specific client
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Get the client ID from context params - properly await it
    const params = await context.params;
    
    // Ensure id is available
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const clientId = params.id;
    const data = await request.json();
    
    // Validate client exists
    const clientDoc = await adminDb.collection('clients').doc(clientId).get();
    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    // Update user in Firebase Auth if email or name changed
    if (data.email || data.name || data.profileImage !== undefined) {
      try {
        const updateAuthData: any = {};
        if (data.email) updateAuthData.email = data.email;
        if (data.name) updateAuthData.displayName = data.name;
        if (data.profileImage !== undefined) updateAuthData.photoURL = data.profileImage;
        
        await adminAuth.updateUser(clientId, updateAuthData);
      } catch (authError) {
        console.error('Error updating auth user:', authError);
        // Continue with Firestore update even if Auth update fails
      }
    }
    
    // Update client document in Firestore
    const updates = {
      ...data,
      updatedAt: new Date()
    };
    
    await adminDb.collection('clients').doc(clientId).update(updates);
    
    return NextResponse.json({ id: clientId, ...updates });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete a specific client
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Get the client ID from context params - properly await it
    const params = await context.params;
    
    // Ensure id is available
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const clientId = params.id;
    
    // Delete user from Firebase Auth
    try {
      await adminAuth.deleteUser(clientId);
    } catch (authError) {
      console.error('Error deleting auth user:', authError);
      // Continue with Firestore deletion even if Auth deletion fails
    }
    
    // Delete client document from Firestore
    await adminDb.collection('clients').doc(clientId).delete();
    
    return NextResponse.json({ id: clientId, deleted: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
