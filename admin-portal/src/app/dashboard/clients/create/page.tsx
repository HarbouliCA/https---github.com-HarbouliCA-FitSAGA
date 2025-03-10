'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { toast } from 'react-hot-toast';
import { ClientFormData } from '@/types/client';

export default function CreateClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ClientFormData>>({
    name: '',
    email: '',
    telephone: '',
    address: '',
    dateOfBirth: '',
    gender: 'other',
    height: undefined,
    weight: undefined,
    role: 'client',
    subscriptionTier: '',
    subscriptionExpiry: '',
    credits: 0,
    fidelityScore: 0,
    observations: '',
    fitnessGoals: [],
    notificationSettings: {
      email: true,
      push: true,
      sms: false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          accessStatus: 'active',
          height: formData.height ? Number(formData.height) : null,
          weight: formData.weight ? Number(formData.weight) : null,
          credits: Number(formData.credits) || 0,
          fidelityScore: Number(formData.fidelityScore) || 0,
          fitnessGoals: formData.fitnessGoals || []
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }
      
      const data = await response.json();
      toast.success('Client created successfully');
      router.push(`/dashboard/clients/${data.id}`);
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create client');
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
    if (name.startsWith('notificationSettings.')) {
      const preference = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        notificationSettings: {
          ...(prev.notificationSettings || { email: true, push: true, sms: false }),
          [preference]: checked
        }
      }));
    }
  };

  return (
    <div className="space-y-6">
      <PageNavigation 
        title="Create New Client"
        backButton={{
          href: '/dashboard/clients',
          label: 'Back to Clients'
        }}
      />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg">
          {/* Basic Information */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <p className="mt-1 text-sm text-gray-500">Enter the client's basic contact information.</p>
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

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  name="gender"
                  id="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="other">Other</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  id="height"
                  value={formData.height || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  id="weight"
                  value={formData.weight || ''}
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
              <p className="mt-1 text-sm text-gray-500">Set up the client's subscription information.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  value={formData.subscriptionExpiry}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
                  Initial Credits
                </label>
                <input
                  type="number"
                  name="credits"
                  id="credits"
                  value={formData.credits}
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
              <p className="mt-1 text-sm text-gray-500">Record the client's health information and goals.</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="observations" className="block text-sm font-medium text-gray-700">
                  Health Notes & Observations
                </label>
                <textarea
                  name="observations"
                  id="observations"
                  rows={3}
                  value={formData.observations}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Any health conditions, restrictions, or notes..."
                />
              </div>
            </div>
          </div>
          
          {/* Notification Preferences */}
          <div className="p-6 border-t border-gray-200 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              <p className="mt-1 text-sm text-gray-500">Set how the client wishes to receive notifications.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notificationSettings.email"
                  id="notificationSettings.email"
                  checked={formData.notificationSettings?.email}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="notificationSettings.email" className="ml-2 block text-sm text-gray-700">
                  Email Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notificationSettings.push"
                  id="notificationSettings.push"
                  checked={formData.notificationSettings?.push}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="notificationSettings.push" className="ml-2 block text-sm text-gray-700">
                  Push Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notificationSettings.sms"
                  id="notificationSettings.sms"
                  checked={formData.notificationSettings?.sms}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="notificationSettings.sms" className="ml-2 block text-sm text-gray-700">
                  SMS Notifications
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/clients')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Creating...' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
}
