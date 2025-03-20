'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { toast } from 'react-hot-toast';
import { SubscriptionPlan } from '@/types/subscriptionPlan';

interface PageProps {
  params: Promise<{
    action: string;
  }>;
}

export default function SubscriptionPlanActionPage({ params }: PageProps) {
  const { action } = use(params);
  const router = useRouter();
  const isEditing = action !== 'new';

  const [plan, setPlan] = useState<Partial<SubscriptionPlan>>({
    name: '',
    type: 'individual',
    planCategory: 'credits_8',
    price: 0,
    currency: '€',
    credits: 8,
    intervalCredits: 0,
    unlimited: false,
    familySize: 0,
    familyTier: undefined,
    isRegistrationFee: false,
    registrationFee: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchPlanDetails();
    }
  }, [action]);

  useEffect(() => {
    // Auto-set values based on plan type and category
    if (plan.type === 'individual') {
      switch (plan.planCategory) {
        case 'credits_8':
          setPlan(prev => ({ 
            ...prev, 
            price: 35, 
            credits: 8, 
            intervalCredits: 0,
            unlimited: false 
          }));
          break;
        case 'credits_12':
          setPlan(prev => ({ 
            ...prev, 
            price: 42, 
            credits: 12, 
            intervalCredits: 4,
            unlimited: false 
          }));
          break;
        case 'unlimited':
          setPlan(prev => ({ 
            ...prev, 
            price: 50, 
            credits: 0, 
            intervalCredits: 4,
            unlimited: true 
          }));
          break;
        case 'interval':
          setPlan(prev => ({ 
            ...prev, 
            price: 25, 
            credits: 0, 
            intervalCredits: 4,
            unlimited: false 
          }));
          break;
        case 'pilates':
          setPlan(prev => ({ 
            ...prev, 
            price: 30, 
            credits: 0, 
            intervalCredits: 0,
            unlimited: false 
          }));
          break;
        case 'registration':
          setPlan(prev => ({ 
            ...prev, 
            price: 40, 
            credits: 0, 
            intervalCredits: 0,
            unlimited: false,
            isRegistrationFee: true
          }));
          break;
      }
    } else if (plan.type === 'family') {
      // Auto-calculate family pricing based on tier
      const getFamilyPrice = () => {
        if (!plan.familyTier) return 0;
        
        switch (plan.planCategory) {
          case 'credits_8':
            return plan.familyTier === 'small' ? 90 : 
                   plan.familyTier === 'medium' ? 120 : 150;
          case 'credits_12':
            return plan.familyTier === 'small' ? 110 : 
                   plan.familyTier === 'medium' ? 148 : 185;
          case 'unlimited':
            return plan.familyTier === 'small' ? 130 : 
                   plan.familyTier === 'medium' ? 175 : 220;
          case 'registration':
            return 20;
          default:
            return 0;
        }
      };
      
      setPlan(prev => ({
        ...prev,
        price: getFamilyPrice(),
        registrationFee: plan.planCategory === 'registration' ? 20 : 0,
        isRegistrationFee: plan.planCategory === 'registration'
      }));
    }
  }, [plan.type, plan.planCategory, plan.familyTier]);
  
  async function fetchPlanDetails() {
    try {
      setLoading(true);
      // Get the ID from the URL if we're editing
      const searchParams = new URLSearchParams(window.location.search);
      const id = searchParams.get('id');
      
      if (!id && action === 'edit') {
        toast.error('No plan ID provided');
        router.push('/dashboard/subscription-plans');
        return;
      }
      
      const response = await fetch(`/api/subscription-plans/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch plan details');
      }
      const data = await response.json();
      setPlan(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load plan details');
    } finally {
      setLoading(false);
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const searchParams = new URLSearchParams(window.location.search);
      const id = searchParams.get('id');
      
      const url = isEditing 
        ? `/api/subscription-plans/${id}` 
        : '/api/subscription-plans';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plan),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} subscription plan`);
      }
      
      toast.success(`Subscription plan ${isEditing ? 'updated' : 'created'} successfully`);
      router.push('/dashboard/subscription-plans');
      
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} subscription plan`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setPlan({ ...plan, [name]: checked });
    } else {
      setPlan({ ...plan, [name]: type === 'number' ? parseFloat(value) : value });
    }
  };
  
  if (loading) {
    return <div className="p-8 text-center">Loading plan details...</div>;
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 mb-8">
          {isEditing ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Plan Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={plan.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., Basic 8 Credits, Family Unlimited, etc."
            />
          </div>
          
          {/* Plan type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Plan Type
            </label>
            <select
              id="type"
              name="type"
              value={plan.type}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="individual">Individual</option>
              <option value="family">Family</option>
              <option value="special">Special (Pilates/Interval)</option>
            </select>
          </div>
          
          {/* Plan category */}
          <div>
            <label htmlFor="planCategory" className="block text-sm font-medium text-gray-700">
              Plan Category
            </label>
            <select
              id="planCategory"
              name="planCategory"
              value={plan.planCategory}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="credits_8">8 Credits</option>
              <option value="credits_12">12 Credits</option>
              <option value="unlimited">Unlimited (All Days)</option>
              {plan.type !== 'family' && (
                <>
                  <option value="interval">Intervals</option>
                  <option value="pilates">Pilates</option>
                </>
              )}
              <option value="registration">Registration Fee</option>
            </select>
          </div>
          
          {/* Family tier for family plans */}
          {plan.type === 'family' && plan.planCategory !== 'registration' && (
            <div>
              <label htmlFor="familyTier" className="block text-sm font-medium text-gray-700">
                Family Size Tier
              </label>
              <select
                id="familyTier"
                name="familyTier"
                value={plan.familyTier}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select a tier</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          )}
          
          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price (€)
            </label>
            <input
              type="number"
              name="price"
              id="price"
              min="0"
              step="0.01"
              value={plan.price}
              onChange={handleInputChange}
              required
              disabled={true} // Auto-calculated based on selections
              className="mt-1 block w-full rounded-md bg-gray-100 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Price is auto-calculated based on plan type and category</p>
          </div>
          
          {/* Credits */}
          {!plan.isRegistrationFee && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
                  Regular Credits
                </label>
                <input
                  type="number"
                  name="credits"
                  id="credits"
                  min="0"
                  value={plan.credits}
                  onChange={handleInputChange}
                  disabled={true} // Auto-calculated
                  className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="intervalCredits" className="block text-sm font-medium text-gray-700">
                  Interval Credits
                </label>
                <input
                  type="number"
                  name="intervalCredits"
                  id="intervalCredits"
                  min="0"
                  value={plan.intervalCredits}
                  onChange={handleInputChange}
                  disabled={true} // Auto-calculated
                  className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          )}
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={plan.description || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe what's included in this plan"
            />
          </div>
          
          {/* Form actions */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard/subscription-plans')}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}