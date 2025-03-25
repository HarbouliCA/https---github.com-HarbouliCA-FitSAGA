import { NextRequest, NextResponse } from 'next/server';
import { initAdminSDK } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
const { db } = initAdminSDK();

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if needed
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all clients
    const clientsSnapshot = await db.collection('clients').get();
    const batch = db.batch();
    
    for (const clientDoc of clientsSnapshot.docs) {
      const clientData = clientDoc.data();
      const planId = clientData.subscriptionTier || clientData.subscriptionPlan;
      
      if (!planId) continue;

      // Get the client's subscription plan
      const planDoc = await db.collection('subscriptionPlans').doc(planId).get();
      const planData = planDoc.data();
      
      if (!planData) continue;

      // Determine credits based on plan type
      let newCredits;
      if (planData.name?.toLowerCase().includes('premium')) {
        newCredits = {
          total: 'unlimited',
          intervalCredits: 4,
          lastRefilled: new Date()
        };
      } else if (planData.name?.toLowerCase().includes('gold')) {
        newCredits = {
          total: 8,
          intervalCredits: 4,
          lastRefilled: new Date()
        };
      } else { // Basic plan
        newCredits = {
          total: 8,
          intervalCredits: 0,
          lastRefilled: new Date()
        };
      }

      // Update client document
      const clientRef = db.collection('clients').doc(clientDoc.id);
      batch.update(clientRef, {
        credits: newCredits.total,
        gymCredits: newCredits.total,
        intervalCredits: newCredits.intervalCredits,
        lastCreditReset: new Date()
      });
    }

    // Commit all updates
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Credits reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting credits:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 