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
    
    // Update client with subscription and credits
    await clientRef.update({
      subscription: {
        planId,
        startDate: startDateObj,
        endDate,
        status: 'active',
        autoRenew: true
      },
      credits: {
        total: plan.credits,
        intervalCredits: plan.intervalCredits || 0,
        lastRefilled: new Date()
      }
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