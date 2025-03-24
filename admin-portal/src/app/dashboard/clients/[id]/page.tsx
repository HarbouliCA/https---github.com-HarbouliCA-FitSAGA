'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { Modal } from '@/components/ui/Modal';
import { Client } from '@/types/client';
import { toast } from 'react-hot-toast';

type BookingInfo = {
  id: string;
  sessionId: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  creditsUsed: number;
  bookedAt: Date;
  sessionName: string;
  sessionDate: Date;
};

interface SubscriptionPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  features: string[];
  type: string;
  unlimited: boolean;
  intervalCredits: number;
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<BookingInfo[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState<number>(0);
  const [creditReason, setCreditReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdjustingCredits, setIsAdjustingCredits] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  
  // Store clientId in state to avoid direct params access in useEffect
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    // Safely extract and store the client ID from params
    if (params && params.id) {
      setClientId(params.id);
    }
  }, [params]);

  const fetchClientData = async () => {
    if (!clientId) return;
    
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Client not found');
          router.push('/dashboard/clients');
          return;
        }
        throw new Error('Failed to fetch client data');
      }
      
      const data = await response.json();
      setClient(data);
      setRecentBookings(data.recentBookings || []);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription plan details when client data changes
  useEffect(() => {
    const fetchSubscriptionPlan = async (planId: string) => {
      if (!planId) return;
      
      setLoadingPlan(true);
      try {
        const response = await fetch(`/api/subscription-plans/${planId}`);
        
        if (!response.ok) {
          console.error('Failed to fetch subscription plan:', response.statusText);
          return;
        }
        
        const data = await response.json();
        console.log('Fetched subscription plan:', data);
        setSubscriptionPlan(data);
      } catch (error) {
        console.error('Error fetching subscription plan:', error);
      } finally {
        setLoadingPlan(false);
      }
    };
    
    if (client) {
      // Try to fetch plan using subscriptionTier or subscriptionPlan
      const planId = client.subscriptionTier || client.subscriptionPlan;
      if (planId) {
        fetchSubscriptionPlan(planId);
      }
    }
  }, [client]);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const handleToggleAccess = async (newStatus: 'active' | 'suspended' | 'inactive') => {
    if (!client || !clientId) return;
    
    try {
      const response = await fetch(`/api/clients/${clientId}/access`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          reason: `Status changed to ${newStatus} by admin`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update access status');
      }
      
      setClient(prev => prev ? { ...prev, accessStatus: newStatus } : null);
      toast.success(`Access status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating access status:', error);
      toast.error('Failed to update access status');
    }
  };

  const handleDelete = async () => {
    if (!client || !clientId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete client');
      }
      
      toast.success('Client deleted successfully');
      router.push('/dashboard/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete client');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!client || !clientId || creditAdjustment === 0) return;
    
    setIsAdjustingCredits(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/credits`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: creditAdjustment,
          reason: creditReason || `Credit adjustment of ${creditAdjustment}`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to adjust credits');
      }
      
      const data = await response.json();
      setClient(prev => prev ? { ...prev, credits: data.newCredits } : null);
      
      toast.success(`Credits ${creditAdjustment > 0 ? 'added' : 'deducted'} successfully`);
      setCreditAdjustment(0);
      setCreditReason('');
      setShowCreditModal(false);
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast.error('Failed to adjust credits');
    } finally {
      setIsAdjustingCredits(false);
    }
  };

  // Add right after handleAdjustCredits function (around line 166)
  const displayCredits = () => {
    if (!client) return 0;
    
    // Log the client object to inspect its structure
    console.log("Client object:", client);
    
    let baseCredits = 0;
    if (typeof client.credits === 'number') {
      baseCredits = client.credits;
    } else if (client.credits && typeof client.credits === 'object') {
      // Log the object to console to inspect its structure
      console.log("Client credits object:", client.credits);
      
      // Use a safer approach with type assertion
      // TypeScript doesn't know what properties exist, but we'll check at runtime
      const creditsObj = client.credits as Record<string, any>;
      
      // Try common property names
      baseCredits = creditsObj.value || 
                   creditsObj.amount || 
                   creditsObj.total || 
                   creditsObj.balance || 0;
    }
    
    return baseCredits;
  };

  const displaySubscription = () => {
    if (!client) return 'No active subscription';
    
    // Log subscription-related fields for debugging
    console.log("Subscription fields:", {
      subscriptionPlan: client.subscriptionPlan,
      subscriptionTier: client.subscriptionTier,
      subscriptionExpiry: client.subscriptionExpiry,
      fetchedPlan: subscriptionPlan
    });
    
    // If we have fetched the subscription plan details, use the plan name
    if (subscriptionPlan) {
      const expiry = client.subscriptionExpiry 
        ? ` (Expires: ${format(new Date(client.subscriptionExpiry), 'MMM d, yyyy')})`
        : '';
      return `${subscriptionPlan.name}${expiry}`;
    }
    
    // If we're still loading the plan, show a loading indicator
    if (loadingPlan) {
      return 'Loading subscription details...';
    }
    
    // First check subscriptionTier (most reliable)
    if (client.subscriptionTier) {
      const expiry = client.subscriptionExpiry 
        ? ` (Expires: ${format(new Date(client.subscriptionExpiry), 'MMM d, yyyy')})`
        : '';
      return `${client.subscriptionTier}${expiry}`;
    }
    
    // Then check subscriptionPlan
    if (client.subscriptionPlan) {
      // subscriptionPlan is a string, just use it as the plan name
      const planName = typeof client.subscriptionPlan === 'string' 
        ? client.subscriptionPlan 
        : 'Active subscription';
      
      // Use subscriptionExpiry for expiry date
      if (client.subscriptionExpiry) {
        return `${planName} (Expires: ${format(new Date(client.subscriptionExpiry), 'MMM d, yyyy')})`;
      }
      return planName;
    }
    
    return 'No active subscription';
  };
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Client not found</h3>
        <p className="mt-2 text-sm text-gray-500">The client you're looking for doesn't exist or has been deleted.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageNavigation 
        title={`Client: ${client.name}`}
        backButton={{
          href: '/dashboard/clients',
          label: 'Back to Clients'
        }}
        actions={[
          {
            label: 'Edit',
            icon: PencilIcon,
            href: `/dashboard/clients/${clientId}/edit`,
            variant: 'secondary'
          },
          {
            label: 'Delete',
            icon: TrashIcon,
            onClick: () => setShowDeleteModal(true),
            variant: 'danger'
          }
        ]}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Client Information</h3>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-4">
                {client.profileImage ? (
                  <img
                    src={client.profileImage}
                    alt={client.name}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{client.name}</h4>
                  <p className="text-sm text-gray-500">{client.email}</p>
                </div>
              </div>
              
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.telephone || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.address || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(client.memberSince), 'MMMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <div className="flex items-center">
                      {client.accessStatus === 'active' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="capitalize">{client.accessStatus}</span>
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Credits</dt>
                  <dd className="mt-1 flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{displayCredits()}</span>
                    <button
                      onClick={() => setShowCreditModal(true)}
                      className="btn-sm btn-secondary"
                    >
                      Adjust Credits
                    </button>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Loyalty Points</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{client.fidelityScore}</dd>
                </div>
                <div>
  <dt className="text-sm font-medium text-gray-500">Subscription</dt>
  <dd className="mt-1 text-sm text-gray-900">
    {displaySubscription()}
  </dd>
</div>
              </dl>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-900">Access Control</h4>
              <div className="space-x-2">
                {client.accessStatus !== 'active' && (
                  <button
                    onClick={() => handleToggleAccess('active')}
                    className="btn-sm btn-success"
                  >
                    Activate
                  </button>
                )}
                {client.accessStatus !== 'suspended' && (
                  <button
                    onClick={() => handleToggleAccess('suspended')}
                    className="btn-sm btn-danger"
                  >
                    Suspend
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentBookings.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 text-center">No recent activity</p>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking.id} className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {booking.sessionName}
                      </p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {format(new Date(booking.sessionDate), 'MMM d, yyyy h:mm a')}
                      </div>
                      <div className="mt-1 flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'attended' ? 'bg-green-100 text-green-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {booking.creditsUsed} credits used
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {recentBookings.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <Link
                href={`/dashboard/clients/${clientId}/bookings`}
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all bookings
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Client"
        actions={[
          {
            label: 'Cancel',
            onClick: () => setShowDeleteModal(false),
            variant: 'secondary'
          },
          {
            label: isDeleting ? 'Deleting...' : 'Delete',
            onClick: handleDelete,
            variant: 'danger',
            disabled: isDeleting
          }
        ]}
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to delete this client? This action cannot be undone.
        </p>
      </Modal>
      
      {/* Credit Adjustment Modal */}
      <Modal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        title="Adjust Credits"
        actions={[
          {
            label: 'Cancel',
            onClick: () => setShowCreditModal(false),
            variant: 'secondary'
          },
          {
            label: isAdjustingCredits ? 'Adjusting...' : 'Confirm',
            onClick: handleAdjustCredits,
            variant: 'primary',
            disabled: isAdjustingCredits || creditAdjustment === 0
          }
        ]}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="creditAdjustment" className="block text-sm font-medium text-gray-700">
              Credit Adjustment
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="creditAdjustment"
                value={creditAdjustment}
                onChange={(e) => setCreditAdjustment(parseInt(e.target.value) || 0)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Enter amount (negative to deduct)"
              />
            </div>
          </div>
          <div>
            <label htmlFor="creditReason" className="block text-sm font-medium text-gray-700">
              Reason
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="creditReason"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Enter reason for adjustment"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
