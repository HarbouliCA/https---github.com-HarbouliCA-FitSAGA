'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { Client } from '@/types/client';
import { toast } from 'react-hot-toast';

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telephone: '',
    address: '',
    subscriptionTier: '',
    subscriptionExpiry: '',
    healthGoals: '',
    notificationPreferences: {
      email: true,
      push: true,
      sms: false
    },
    dietaryRestrictions: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await fetch(`/api/clients/${params.id}`);
        
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
        setFormData({
          name: data.name || '',
          email: data.email || '',
          telephone: data.telephone || '',
          address: data.address || '',
          subscriptionTier: data.subscriptionTier || '',
          subscriptionExpiry: data.subscriptionExpiry || '',
          healthGoals: data.healthGoals || '',
          notificationPreferences: {
            email: data.notificationPreferences?.email ?? true,
            push: data.notificationPreferences?.push ?? true,
            sms: data.notificationPreferences?.sms ?? false
          },
          dietaryRestrictions: data.dietaryRestrictions || '',
          emergencyContact: {
            name: data.emergencyContact?.name || '',
            phone: data.emergencyContact?.phone || '',
            relationship: data.emergencyContact?.relationship || ''
          }
        });
      } catch (error) {
        console.error('Error fetching client:', error);
        toast.error('Failed to load client data');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...client,
          ...formData
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update client');
      }
      
      toast.success('Client updated successfully');
      router.push(`/dashboard/clients/${client.id}`);
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev };
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        (newData as any)[parent] = {
          ...(newData as any)[parent],
          [child]: value
        };
      } else {
        (newData as any)[name] = value;
      }
      return newData;
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (name.startsWith('notificationPreferences.')) {
      const preference = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [preference]: checked
        }
      }));
    }
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
        title={`Edit Client: ${client.name}`}
        backButton={{
          href: `/dashboard/clients/${client.id}`,
          label: 'Back to Client'
        }}
      />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg">
          {/* Basic Information */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <p className="mt-1 text-sm text-gray-500">Update the client's basic contact information.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="telephone"
                  id="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Subscription Details */}
          <div className="p-6 border-t border-gray-200 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Subscription Details</h3>
              <p className="mt-1 text-sm text-gray-500">Manage the client's subscription information.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="subscriptionTier" className="block text-sm font-medium text-gray-700">
                  Subscription Tier
                </label>
                <select
                  name="subscriptionTier"
                  id="subscriptionTier"
                  value={formData.subscriptionTier}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">No Subscription</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="subscriptionExpiry" className="block text-sm font-medium text-gray-700">
                  Subscription Expiry
                </label>
                <input
                  type="date"
                  name="subscriptionExpiry"
                  id="subscriptionExpiry"
                  value={formData.subscriptionExpiry ? formData.subscriptionExpiry.split('T')[0] : ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Health & Fitness */}
          <div className="p-6 border-t border-gray-200 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Health & Fitness</h3>
              <p className="mt-1 text-sm text-gray-500">Update health-related information and goals.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="healthGoals" className="block text-sm font-medium text-gray-700">
                  Health Goals
                </label>
                <textarea
                  name="healthGoals"
                  id="healthGoals"
                  rows={3}
                  value={formData.healthGoals}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Client's health and fitness goals..."
                />
              </div>
              
              <div>
                <label htmlFor="dietaryRestrictions" className="block text-sm font-medium text-gray-700">
                  Dietary Restrictions
                </label>
                <textarea
                  name="dietaryRestrictions"
                  id="dietaryRestrictions"
                  rows={2}
                  value={formData.dietaryRestrictions}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Any dietary restrictions or preferences..."
                />
              </div>
            </div>
          </div>
          
          {/* Emergency Contact */}
          <div className="p-6 border-t border-gray-200 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
              <p className="mt-1 text-sm text-gray-500">Emergency contact information.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-gray-700">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  id="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="emergencyContact.phone" className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  id="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-gray-700">
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  id="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Notification Preferences */}
          <div className="p-6 border-t border-gray-200 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              <p className="mt-1 text-sm text-gray-500">Choose how the client wants to receive notifications.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notificationPreferences.email"
                  id="notificationPreferences.email"
                  checked={formData.notificationPreferences.email}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="notificationPreferences.email" className="ml-3 text-sm text-gray-700">
                  Email Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notificationPreferences.push"
                  id="notificationPreferences.push"
                  checked={formData.notificationPreferences.push}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="notificationPreferences.push" className="ml-3 text-sm text-gray-700">
                  Push Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notificationPreferences.sms"
                  id="notificationPreferences.sms"
                  checked={formData.notificationPreferences.sms}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="notificationPreferences.sms" className="ml-3 text-sm text-gray-700">
                  SMS Notifications
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
