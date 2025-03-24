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

// Define a type for the credits object
interface CreditsObject {
  total?: number;
  value?: number;
  amount?: number;
  balance?: number;
  intervalCredits?: number;
  lastRefilled?: FirebaseFirestore.Timestamp;
  [key: string]: any; // Allow other properties
}

interface ClientData {
  email: string;
  name: string;
  profileImage?: string | null;
  dateOfBirth?: FirebaseFirestore.Timestamp | string | null;
  gender?: 'male' | 'female' | 'other';
  height?: number | null;
  weight?: number | null;
  address?: string | null;
  telephone?: string | null;
  role?: 'client' | 'instructor' | 'admin';
  memberSince?: FirebaseFirestore.Timestamp | string | Date;
  lastActive?: FirebaseFirestore.Timestamp | string | Date;
  accessStatus?: 'active' | 'suspended' | 'inactive';
  credits?: number | CreditsObject; // Can be either a number or an object
  fidelityScore?: number;
  subscriptionTier?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiry?: FirebaseFirestore.Timestamp | string | Date | null;
  subscription?: {
    planId: string;
    startDate: FirebaseFirestore.Timestamp | string | Date;
    endDate: FirebaseFirestore.Timestamp | string | Date;
    status: string;
    autoRenew: boolean;
  };
  observations?: string | null;
  fitnessGoals?: string[];
  onboardingCompleted?: boolean;
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  // Additional properties for client data
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  healthGoals?: string;
  dietaryRestrictions?: string;
  createdAt?: FirebaseFirestore.Timestamp | string | Date | null;
  updatedAt?: FirebaseFirestore.Timestamp | string | Date | null;
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
    // Log the raw client data for debugging
    console.log('Raw client data from Firestore:', clientData);
    
    // Extract credits correctly, handling both number and object formats
    let clientCredits = 0;
    if (typeof clientData.credits === 'number') {
      clientCredits = clientData.credits;
    } else if (clientData.credits && typeof clientData.credits === 'object') {
      // Sum both base credits and intervalCredits explicitly as numbers
      clientCredits = Number(clientData.credits.total ?? 0) + Number(clientData.credits.intervalCredits ?? 0);
    }
    
    // Helper function to safely convert various date formats to Date objects
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
    
    // Map client data to response object
    const client = {
      id: clientDoc.id,
      email: clientData.email || '',
      name: clientData.name || '',
      profileImage: clientData.profileImage || null,
      dateOfBirth: safelyConvertToDate(clientData.dateOfBirth),
      gender: clientData.gender || 'other',
      height: clientData.height || null,
      weight: clientData.weight || null,
      address: clientData.address || null,
      telephone: clientData.telephone || null,
      role: clientData.role || 'client',
      memberSince: safelyConvertToDate(clientData.memberSince),
      lastActive: safelyConvertToDate(clientData.lastActive),
      accessStatus: clientData.accessStatus || 'active',
      credits: clientCredits,
      fidelityScore: clientData.fidelityScore || 0,
      subscriptionPlan: clientData.subscriptionPlan || (clientData.subscription?.planId || null),
      subscriptionTier: clientData.subscriptionTier || (clientData.subscription?.planId || null),
      subscriptionExpiry: safelyConvertToDate(clientData.subscriptionExpiry),
      observations: clientData.observations || null,
      fitnessGoals: clientData.fitnessGoals || [],
      onboardingCompleted: clientData.onboardingCompleted || false,
      notificationSettings: clientData.notificationSettings || {
        email: true,
        push: true,
        sms: false
      },
      createdAt: safelyConvertToDate(clientData.createdAt),
      updatedAt: safelyConvertToDate(clientData.updatedAt)
    };
    
    // Log the mapped client data for debugging
    console.log('Mapped client data for response:', client);
    if (client.subscriptionPlan) {
      const planDoc = await adminDb.collection('subscriptionPlans').doc(client.subscriptionPlan).get();
      if (planDoc.exists) {
        const planData = planDoc.data();
        // Use subscriptionTier field to check for 'gold' if available
        const extra = (client.subscriptionTier && client.subscriptionTier.toLowerCase().includes('gold'))
          ? 4
          : (planData?.intervalCredits || 0);
        client.credits = (planData?.credits || 0) + extra;
      }
    }

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
    // Prevent the client-provided credits from overwriting subscription computation
    delete data.credits;
    
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
    
    // Get the existing client data
    const existingData = clientDoc.data() as ClientData;
    console.log('Existing client data before update:', existingData);
    console.log('Update data received:', data);
    
    // Only update specific fields that are allowed to be updated from the form
    const updates: Record<string, any> = {
      updatedAt: new Date()
    };
    
    // Basic information
    if (data.name !== undefined) updates.name = data.name;
    if (data.email !== undefined) updates.email = data.email;
    if (data.telephone !== undefined) updates.telephone = data.telephone;
    if (data.address !== undefined) updates.address = data.address;
    
    // Critical fields - preserve existing values unless explicitly updated
    updates.role = data.role || existingData.role || 'client';
    updates.accessStatus = data.accessStatus || existingData.accessStatus || 'active';
    
    // Subscription details
    if (data.subscriptionTier !== undefined) updates.subscriptionTier = data.subscriptionTier;
    if (data.subscriptionPlan !== undefined) updates.subscriptionPlan = data.subscriptionPlan;
    
    // Adjust credits if subscription plan is changing
    if ((data.subscriptionTier && data.subscriptionTier !== existingData.subscriptionTier) ||
        (data.subscriptionPlan && data.subscriptionPlan !== existingData.subscriptionPlan)) {
      try {
        // Determine which plan ID to use (subscriptionTier or subscriptionPlan)
        const newPlanId = data.subscriptionTier || data.subscriptionPlan;
        const oldPlanId = existingData.subscriptionTier || existingData.subscriptionPlan;
        
        if (newPlanId && oldPlanId && newPlanId !== oldPlanId) {
          console.log(`Subscription plan changing from ${oldPlanId} to ${newPlanId}`);
          
          // Get current credits
          let currentCredits = 0;
          if (typeof existingData.credits === 'number') {
            currentCredits = existingData.credits;
          } else if (existingData.credits && typeof existingData.credits === 'object') {
            currentCredits = existingData.credits.total || 0;
          }
          
      // Get old plan credits
      let oldPlanCredits = 0;
      const oldPlanDoc = await adminDb.collection('subscriptionPlans').doc(oldPlanId).get();
      if (oldPlanDoc.exists) {
        const oldPlan = oldPlanDoc.data();
        console.log('Old plan data:', oldPlan);
        oldPlanCredits = oldPlan?.credits || 0;
        console.log('Old plan credits:', oldPlanCredits);
      } else {
        console.log('Old plan document does not exist:', oldPlanId);
      }
      
      // Get new plan credits
      let newPlanCredits = 0;
          const newPlanDoc = await adminDb.collection('subscriptionPlans').doc(newPlanId).get();
          if (newPlanDoc.exists) {
            const newPlan = newPlanDoc.data();
            console.log('New plan data:', newPlan);
            // For gold subscriptions, always add 4 interval credits regardless of the stored intervalCredits
            newPlanCredits = newPlan && newPlan.name && newPlan.name.toLowerCase().includes('gold')
              ? (newPlan.credits || 0) + 4
              : (newPlan?.credits || 0) + (newPlan?.intervalCredits || 0);
            console.log('New plan calculated credits:', newPlanCredits);
                
            const adjustedCredits = newPlanCredits;
            console.log(`Setting credits to new plan value: ${adjustedCredits}`);
            
            if (existingData.credits && typeof existingData.credits === 'object') {
              updates.credits = {
                ...existingData.credits,
                total: adjustedCredits
              };
            } else {
              updates.credits = adjustedCredits;
            }
          }
        }
      } catch (error) {
        console.error('Error adjusting credits for subscription change:', error);
        // Continue with the update even if credit adjustment fails
      }
    }
    
    // Handle subscription expiry date - convert to Firestore Timestamp if provided
    if (data.subscriptionExpiry) {
      try {
        const expiryDate = new Date(data.subscriptionExpiry);
        const { Timestamp } = require('firebase-admin/firestore');
        updates.subscriptionExpiry = Timestamp.fromDate(expiryDate);
      } catch (dateError) {
        console.error('Error converting subscription expiry date:', dateError);
        // Keep the existing value if there's an error
      }
    }
    
    // Health & Fitness
    if (data.healthGoals !== undefined) updates.healthGoals = data.healthGoals;
    if (data.dietaryRestrictions !== undefined) updates.dietaryRestrictions = data.dietaryRestrictions;
    
    // Emergency Contact
    if (data.emergencyContact) {
      updates.emergencyContact = {
        name: data.emergencyContact.name || existingData.emergencyContact?.name || '',
        phone: data.emergencyContact.phone || existingData.emergencyContact?.phone || '',
        relationship: data.emergencyContact.relationship || existingData.emergencyContact?.relationship || ''
      };
    }
    
    // Notification Preferences
    if (data.notificationPreferences) {
      updates.notificationPreferences = {
        email: data.notificationPreferences.email !== undefined ? 
          data.notificationPreferences.email : 
          existingData.notificationPreferences?.email || true,
        push: data.notificationPreferences.push !== undefined ? 
          data.notificationPreferences.push : 
          existingData.notificationPreferences?.push || true,
        sms: data.notificationPreferences.sms !== undefined ? 
          data.notificationPreferences.sms : 
          existingData.notificationPreferences?.sms || false
      };
    }
    
    // Preserve existing credits structure only if credits was not adjusted due to subscription change
    if (data.credits !== undefined && !((data.subscriptionTier && data.subscriptionTier !== existingData.subscriptionTier) || (data.subscriptionPlan && data.subscriptionPlan !== existingData.subscriptionPlan))) {
      // If the existing credits is an object, preserve its structure
      if (existingData.credits && typeof existingData.credits === 'object') {
        // If the new credits is a number, update the total property
        if (typeof data.credits === 'number') {
          updates.credits = {
            ...existingData.credits,
            total: data.credits
          };
        } 
        // If the new credits is an object, merge it with the existing object
        else if (typeof data.credits === 'object') {
          updates.credits = {
            ...existingData.credits,
            ...data.credits
          };
        }
      } 
      // If the existing credits is a number or doesn't exist, use the new value directly
      else {
        updates.credits = data.credits;
      }
    }
    
    console.log('Final updates to be applied:', updates);
    
    // Update the client document in Firestore
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
