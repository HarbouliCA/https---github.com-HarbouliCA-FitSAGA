import { NextRequest, NextResponse } from 'next/server';
import { initAdminSDK } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
const { db: adminDb } = initAdminSDK();

// PATCH /api/clients/[id]/credits - Adjust client credits
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const { amount, reason } = await request.json();
    
    if (typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Amount must be a number' },
        { status: 400 }
      );
    }
    
    // Get client document
    const clientRef = adminDb.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    const clientData = clientDoc.data();
    console.log('Raw client data from Firestore:', clientData);
    
    // Handle both number and object formats of credits
    let currentCredits = 0;
    let newCredits = 0;
    let creditsUpdate = {};
    
    if (typeof clientData?.credits === 'number') {
      // If credits is a number, simply add the amount
      currentCredits = clientData.credits;
      newCredits = Math.max(0, currentCredits + amount); // Ensure credits don't go below 0
      creditsUpdate = { credits: newCredits };
    } else if (clientData?.credits && typeof clientData.credits === 'object') {
      // If credits is an object, update the total property
      const creditsObj = clientData.credits;
      currentCredits = creditsObj.total || 0;
      newCredits = Math.max(0, currentCredits + amount); // Ensure credits don't go below 0
      
      // Create a new credits object with updated total
      creditsUpdate = { 
        credits: {
          ...creditsObj,
          total: newCredits,
          lastUpdated: new Date()
        }
      };
    } else {
      // If credits doesn't exist or is null, create a new credits value
      currentCredits = 0;
      newCredits = Math.max(0, amount); // Ensure credits don't go below 0
      creditsUpdate = { credits: newCredits };
    }
    
    // Update client credits
    await clientRef.update({
      ...creditsUpdate,
      updatedAt: new Date()
    });
    
    // Log the update for debugging
    console.log('Credits update:', creditsUpdate);
    
    // Record credit transaction
    await adminDb.collection('creditTransactions').add({
      clientId,
      amount,
      reason: reason || (amount > 0 ? 'Credit adjustment' : 'Credit deduction'),
      previousBalance: currentCredits,
      newBalance: newCredits,
      timestamp: new Date(),
      adminId: request.headers.get('X-Admin-Id') || 'system'
    });
    
    return NextResponse.json({
      success: true,
      previousCredits: currentCredits,
      newCredits,
      adjustment: amount
    });
  } catch (error) {
    console.error('Error adjusting client credits:', error);
    return NextResponse.json(
      { error: 'Failed to adjust client credits' },
      { status: 500 }
    );
  }
}
