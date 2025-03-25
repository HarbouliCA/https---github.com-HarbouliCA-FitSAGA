import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { SubscriptionPlan } from '@/types/subscriptionPlan';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    const clientId = params.id;
    const { planId, startDate } = await request.json();
    
    // Verify client exists
    const clientRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Get subscription plan
    const planRef = db.collection('subscriptionPlans').doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    const plan = planDoc.data() as SubscriptionPlan;
    
    // Calculate end date (1 month from start date)
    const startDateObj = new Date(startDate);
    const endDate = new Date(startDateObj);
    endDate.setMonth(endDate.getMonth() + 1);
    
    // Get client data to check if they already have a subscription
    const clientData = clientDoc.data();
    let currentCredits = 0;
    let oldPlanCredits = 0;
    
    // Check if client already has credits
    if (clientData?.credits) {
      if (typeof clientData.credits === 'number') {
        currentCredits = clientData.credits;
      } else if (typeof clientData.credits === 'object') {
        currentCredits = clientData.credits.total || 0;
      }
    }
    
    // Check if client already has a subscription
    if (clientData?.subscription?.planId) {
      try {
        // Get the old plan to determine credit difference
        const oldPlanDoc = await db.collection('subscriptionPlans').doc(clientData.subscription.planId).get();
        if (oldPlanDoc.exists) {
          const oldPlan = oldPlanDoc.data() as SubscriptionPlan;
          oldPlanCredits = oldPlan.credits || 0;
          console.log(`Old plan credits: ${oldPlanCredits}, Current credits: ${currentCredits}`);
        }
      } catch (error) {
        console.error('Error fetching old subscription plan:', error);
        // Continue with the update even if we can't get the old plan
      }
    }
    
    // Calculate new credits based on plan
    const newCredits = {
      total: plan.unlimited ? "unlimited" : (plan.credits || 0),
      intervalCredits: plan.name?.toLowerCase().includes('gold') ? 4 : (plan.intervalCredits || 0),
      lastRefilled: new Date()
    };
    
    // Update client with subscription and adjusted credits
    await clientRef.update({
      subscription: {
        planId,
        startDate: startDateObj,
        endDate,
        status: 'active',
        autoRenew: true
      },
      subscriptionTier: planId,
      subscriptionExpiry: endDate,
      credits: newCredits
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      if (!db) {
        return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
      }
      
      const clientId = params.id;
      
      // Get client document
      const clientDoc = await db.collection('clients').doc(clientId).get();
      
      if (!clientDoc.exists) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      
      const clientData = clientDoc.data();
      
      if (!clientData) {
        return NextResponse.json({ error: 'Client data is empty' }, { status: 404 });
      }
      
      if (!clientData.subscription) {
        return NextResponse.json({ error: 'Client has no active subscription' }, { status: 404 });
      }
      
      // Get plan details
      const planDoc = await db.collection('subscriptionPlans').doc(clientData.subscription.planId).get();
      
      if (!planDoc.exists) {
        return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
      }
      
      return NextResponse.json({
        subscription: clientData.subscription,
        credits: clientData.credits,
        plan: {
          id: planDoc.id,
          ...planDoc.data()
        }
      });
    } catch (error) {
      console.error('Error fetching client subscription:', error);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const clientId = params.id;
    const { gymCredits, intervalCredits, reason } = await request.json();

    // Verify client exists
    const clientRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      gymCredits: gymCredits === 'unlimited' ? 'unlimited' : Number(gymCredits),
      intervalCredits: Number(intervalCredits),
      credits: gymCredits === 'unlimited' ? 'unlimited' : (Number(gymCredits) + Number(intervalCredits)),
      updatedAt: new Date()
    };

    // Update client with new credit values
    await clientRef.update(updateData);

    // Log the credit adjustment if reason is provided
    if (reason) {
      await db.collection('creditAdjustments').add({
        clientId,
        previousGymCredits: clientDoc.data()?.gymCredits,
        previousIntervalCredits: clientDoc.data()?.intervalCredits,
        newGymCredits: updateData.gymCredits,
        newIntervalCredits: updateData.intervalCredits,
        reason,
        timestamp: new Date()
      });
    }

    return NextResponse.json({ success: true, credits: updateData });
  } catch (error) {
    console.error('Error adjusting credits:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
