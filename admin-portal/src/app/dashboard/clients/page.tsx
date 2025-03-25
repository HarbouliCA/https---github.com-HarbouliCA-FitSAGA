'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Client } from '@/interfaces/client';
import { toast } from 'react-hot-toast';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [generatingContract, setGeneratingContract] = useState<string | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<Record<string, any>>({});

  const fetchClients = async (reset = false) => {
    if (reset) {
      setLastVisible(null);
      setClients([]);
    }
    
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('pageSize', '20');
      
      if (lastVisible && !reset) {
        params.append('lastId', lastVisible);
      }
      
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Fetch clients
      const response = await fetch(`/api/clients?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      
      // Update state
      if (reset || !lastVisible) {
        setClients(data.clients);
      } else {
        setClients(prev => [...prev, ...data.clients]);
      }
      
      setLastVisible(data.lastVisible);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription plans
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        const response = await fetch('/api/subscription-plans');
        if (response.ok) {
          const data = await response.json();
          // Create a lookup map
          const planMap = data.reduce((acc: Record<string, any>, plan: any) => {
            acc[plan.id] = plan;
            return acc;
          }, {});
          setSubscriptionPlans(planMap);
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
      }
    };
    
    fetchSubscriptionPlans();
  }, []);

  useEffect(() => {
    fetchClients(true);
  }, [filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchClients();
    }
  };

  const handleToggleClientAccess = async (client: Client, newStatus: 'active' | 'suspended' | 'inactive') => {
    try {
      const response = await fetch(`/api/clients/${client.id}/access`, {
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
        throw new Error('Failed to update client access');
      }
      
      // Update local state
      setClients(clients.map(c => 
        c.id === client.id ? { ...c, accessStatus: newStatus } : c
      ));
      
      toast.success(`Client access status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating client access:', error);
      toast.error('Failed to update client access');
    }
  };

  const handleBatchAction = async (action: 'activate' | 'suspend' | 'delete') => {
    if (selectedClients.length === 0) {
      toast.error('Please select at least one client');
      return;
    }
    
    try {
      if (action === 'delete') {
        const response = await fetch('/api/clients', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientIds: selectedClients
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete clients');
        }
        
        // Update local state
        setClients(clients.filter(client => !selectedClients.includes(client.id)));
        setSelectedClients([]);
        
        toast.success(`Successfully deleted ${selectedClients.length} clients`);
      } else {
        const newStatus = action === 'activate' ? 'active' : 'suspended';
        
        const response = await fetch('/api/clients', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientIds: selectedClients,
            updates: {
              accessStatus: newStatus
            }
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update clients');
        }
        
        // Update local state
        setClients(clients.map(client => 
          selectedClients.includes(client.id) 
            ? { ...client, accessStatus: newStatus } 
            : client
        ));
        
        setSelectedClients([]);
        
        toast.success(`Successfully updated ${selectedClients.length} clients`);
      }
    } catch (error) {
      console.error(`Error performing batch ${action}:`, error);
      toast.error(`Failed to ${action} clients`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Suspended
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getTotalCredits = (client: Client) => {
    const planId = client.subscriptionPlan || client.subscriptionTier;
    if (planId && subscriptionPlans[planId]) {
      const plan = subscriptionPlans[planId];
      const extra = (plan.name && plan.name.toLowerCase().includes('gold'))
        ? 4
        : (plan.intervalCredits || 0);
      return (plan.credits || 0) + extra;
    }
    if (typeof client.credits === 'number') {
      return client.credits;
    }
    if (client.credits && typeof client.credits === 'object') {
      const creditsObj = client.credits as Record<string, any>;
      return creditsObj.total || 0;
    }
    return 0;
  };

  const getSubscriptionPlanName = (client: Client) => {
    // Check for subscriptionPlan first, then fall back to subscriptionTier
    const planId = client.subscriptionPlan || client.subscriptionTier;
    
    if (!planId) {
      return 'No subscription';
    }
    
    const plan = subscriptionPlans[planId];
    if (!plan) {
      // If plan details not found, at least show the plan ID
      return `${planId}`;
    }
    
    return plan.name;
  };

  const handleGenerateContract = async (client: Client) => {
    if (generatingContract === client.id) return;
    
    setGeneratingContract(client.id);
    toast.loading(`Generating contract for ${client.name}...`);
    
    try {
      const response = await fetch(`/api/clients/${client.id}/contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sendEmail: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate contract');
      }
      
      const data = await response.json();
      toast.dismiss();
      toast.success(`Contract generated and sent to ${client.email}`);
      
    } catch (error) {
      console.error('Error generating contract:', error);
      toast.dismiss();
      toast.error('Failed to generate contract');
    } finally {
      setGeneratingContract(null);
    }
  };

  // Function to calculate total available credits
  const calculateTotalCredits = (client: Client) => {
    console.log(`Calculating credits for client: ${client.name}, Plan: ${client.subscriptionPlan || client.subscriptionTier || 'None'}`);
    
    // First check if client has unlimited credits in any format
    if (
      (client.credits && typeof client.credits === 'object' && client.credits.total === "unlimited") ||
      client.gymCredits === "unlimited" ||
      (typeof client.credits === 'string' && client.credits === "unlimited")
    ) {
      console.log('Found unlimited credits in credits object or gymCredits');
      return "Unlimited";
    }
    
    // Check if the client has a premium subscription plan that indicates unlimited credits
    if (client.subscriptionPlan || client.subscriptionTier) {
      const planName = (client.subscriptionPlan || client.subscriptionTier || '').toString().toLowerCase();
      console.log(`Checking plan name: "${planName}"`);
      
      // Check for exact matches first
      if (planName === 'premium' || planName === 'gold') {
        console.log('Found exact match for premium/gold plan');
        return "Unlimited";
      }
      
      // Then check for partial matches
      if (planName.includes('premium') || planName.includes('gold') || planName.includes('unlimited')) {
        console.log('Found partial match for premium/gold/unlimited in plan name');
        return "Unlimited";
      }
    }
    
    // Check if credits is an object with a total property
    if (client.credits && typeof client.credits === 'object' && 'total' in client.credits) {
      const creditsObj = client.credits as { total?: number | string };
      console.log(`Credits object total: ${creditsObj.total}`);
      
      // Return the total credits if it exists and is not zero
      if (creditsObj.total !== undefined && creditsObj.total !== 0) {
        return creditsObj.total;
      }
    }
    
    // Handle legacy format where credits is a direct number
    if (typeof client.credits === 'number') {
      console.log(`Credits as number: ${client.credits}`);
      if (client.credits > 0) {
        return client.credits;
      }
    }
    
    // Handle gymCredits property if it exists
    if (client.gymCredits !== undefined) {
      console.log(`gymCredits: ${client.gymCredits}`);
      if (client.gymCredits !== 0) {
        return client.gymCredits;
      }
    }
    
    console.log('No credits found, returning 0');
    // Default case if no credits information is found
    return 0;
  };

  return (
    <div className="space-y-6">
      <PageNavigation 
        title="Client Management" 
        actions={[
          {
            label: 'Add Client',
            icon: PlusIcon,
            href: '/dashboard/clients/create',
            variant: 'primary'
          }
        ]}
      />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-grow">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search by name, email, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
          
          {/* Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              id="status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="all">All Clients</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        {/* Batch Actions */}
        {selectedClients.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-md">
            <span className="text-sm font-medium text-gray-700">
              {selectedClients.length} clients selected
            </span>
            <div className="flex-grow"></div>
            <button
              onClick={() => handleBatchAction('activate')}
              className="btn-sm btn-success"
            >
              Activate
            </button>
            <button
              onClick={() => handleBatchAction('suspend')}
              className="btn-sm btn-warning"
            >
              Suspend
            </button>
            <button
              onClick={() => handleBatchAction('delete')}
              className="btn-sm btn-danger"
            >
              Delete
            </button>
          </div>
        )}
        
        {/* Clients Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={selectedClients.length > 0 && selectedClients.length === clients.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClients(clients.map(client => client.id));
                      } else {
                        setSelectedClients([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={selectedClients.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClients([...selectedClients, client.id]);
                          } else {
                            setSelectedClients(selectedClients.filter(id => id !== client.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {client.profileImage ? (
                          <img
                            className="h-10 w-10 rounded-full mr-3"
                            src={client.profileImage}
                            alt={client.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-gray-500 font-medium">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.email}</div>
                      {client.telephone && (
                        <div className="text-sm text-gray-500">{client.telephone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{calculateTotalCredits(client)}</div>
                      <div className="text-sm text-gray-500">{client.fidelityScore} loyalty points</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getSubscriptionPlanName(client)}</div>
                      {client.subscriptionExpiry && (
                        <div className="text-sm text-gray-500">
                          Expires: {new Date(client.subscriptionExpiry).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(client.accessStatus || 'unknown')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu
                      align="right"
                      actions={[
                        {
                          label: 'View Details',
                          icon: EyeIcon,
                          onClick: () => router.push(`/dashboard/clients/${client.id}`)
                        },
                        {
                          label: 'Edit Client',
                          icon: PencilSquareIcon,
                          onClick: () => router.push(`/dashboard/clients/${client.id}/edit`)
                        },
                        {
                          label: client.accessStatus === 'active' ? 'Suspend Access' : 'Activate Access',
                          icon: client.accessStatus === 'active' ? XCircleIcon : CheckCircleIcon,
                          onClick: () => handleToggleClientAccess(
                            client, 
                            client.accessStatus === 'active' ? 'suspended' : 'active'
                          )
                        },
                        {
                          label: generatingContract === client.id ? 'Generating...' : 'Generate Contract',
                          icon: DocumentTextIcon,
                          onClick: () => {
                            // Only execute if not already generating
                            if (generatingContract !== client.id) {
                              handleGenerateContract(client);
                            }
                          }
                        } 
                      ]}
                    />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Load More Button */}
        {hasMore && (
          <div className="mt-4 text-center">
            <button 
              onClick={handleLoadMore}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
