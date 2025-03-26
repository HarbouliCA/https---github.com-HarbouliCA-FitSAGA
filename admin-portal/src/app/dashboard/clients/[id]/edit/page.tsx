'use client';

import { useState, useEffect } from 'react'; // Remove 'use' import
import { useRouter } from 'next/navigation';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { Client } from '@/types/client';
import { toast } from 'react-hot-toast';
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // Import necessary functions

const firestore = getFirestore(); // Initialize Firestore

// Add this validation function at the top of your component or in a separate utils file
const validateSpanishIBAN = (iban: string): boolean => {
  // Remove spaces and convert to uppercase
  const cleanedIBAN = iban.replace(/\s/g, '').toUpperCase();
  
  // Spanish IBAN format: ES + 2 check digits + 20 digits (bank code + account number)
  const spanishIBANRegex = /^ES[0-9]{2}[0-9]{20}$/;
  
  return spanishIBANRegex.test(cleanedIBAN);
};

export default function EditClientPage({ params }: { params: { id: string } }) {
  // Don't try to unwrap params - just use the id directly
  const id = params.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telephone: '',
    address: '',
    subscriptionTier: '',
    subscriptionPlan: '',
    subscriptionExpiry: '',
    healthGoals: '',
    notificationPreferences: {
      email: true,
      push: true,
      sms: false
    },
    dietaryRestrictions: '',
    bicCode: '',
    bankName: '',
    requestBankDetails: false,
    resendMandateFile: false,
    accountNumber: '',
    accountHolder: '',
  });

  // Add state for IBAN validation
  const [ibanError, setIbanError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${params.id}?t=${Date.now()}`, { cache: "no-store" });
        const data = await response.json();
        console.log('Fetched client data for edit:', data);
        console.log('Bank details for edit:', {
          accountNumber: data.accountNumber,
          bicCode: data.bicCode,
          accountHolder: data.accountHolder,
          bankName: data.bankName
        });
        
        setClient(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          telephone: data.telephone || '',
          address: data.address || '',
          subscriptionTier: data.subscriptionTier || '',
          subscriptionPlan: data.subscriptionPlan || data.subscriptionTier || '',
          subscriptionExpiry: data.subscriptionExpiry || '',
          healthGoals: data.healthGoals || '',
          notificationPreferences: {
            email: data.notificationPreferences?.email ?? true,
            push: data.notificationPreferences?.push ?? true,
            sms: data.notificationPreferences?.sms ?? false
          },
          dietaryRestrictions: data.dietaryRestrictions || '',
          bicCode: data.bicCode || '',
          bankName: data.bankName || '',
          requestBankDetails: data.requestBankDetails || false,
          resendMandateFile: data.resendMandateFile || false,
          accountNumber: data.accountNumber || '',
          accountHolder: data.accountHolder || '',
        });
      } catch (error) {
        console.error("Error fetching client data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id) {
      fetchClient();
    }
  }, [params.id]);
  
  // Fetch subscription plans
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        const response = await fetch('/api/subscription-plans');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionPlans(data);
          console.log('Fetched subscription plans:', data);
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
      }
    };
    
    fetchSubscriptionPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    
    setSaving(true);
    try {
      const clientRef = doc(firestore, 'clients', id); // Use doc to get a document reference
      await setDoc(clientRef, {
        ...client,
        ...formData
      }, { merge: true });

      console.log('Client information saved:', formData);
      toast.success('Client updated successfully');
      router.push(`/dashboard/clients/${client.id}`);
    } catch (error) {
      console.error('Error saving client information:', error);
      toast.error('Failed to save client information');
    } finally {
      setSaving(false);
    }
  };

  // Update the handleInputChange function to validate IBAN
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validate IBAN when the account number field changes
    if (name === 'accountNumber') {
      if (value && !validateSpanishIBAN(value)) {
        setIbanError('Invalid Spanish IBAN format. Should be: ES + 22 digits');
      } else {
        setIbanError(null);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleRequestBankDetails = () => {
    setFormData(prev => ({
      ...prev,
      requestBankDetails: true
    }));
  };

  const handleResendMandateFile = () => {
    setFormData(prev => ({
      ...prev,
      resendMandateFile: true
    }));
  };

  const handleDeleteBankDetails = () => {
    setFormData(prev => ({
      ...prev,
      bicCode: '',
      bankName: '',
      requestBankDetails: false,
      resendMandateFile: false
    }));
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
                  {subscriptionPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                {loading && subscriptionPlans.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">Loading subscription plans...</p>
                )}
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
          
          {/* Bank Details */}
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Detalles bancarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Número de cuenta (IBAN)"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md ${ibanError ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm`}
                />
                {ibanError && (
                  <p className="mt-1 text-sm text-red-600">{ibanError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Format: ES + 22 digits (e.g., ES9121000418450200051332)</p>
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  name="bicCode"
                  placeholder="Código BIC"
                  value={formData.bicCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <span className="ml-2 text-blue-500 cursor-pointer">ℹ️</span>
              </div>
              <div>
                <input
                  type="text"
                  name="accountHolder"
                  placeholder="Titular de la cuenta"
                  value={formData.accountHolder}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  name="bankName"
                  placeholder="Nombre del banco"
                  value={formData.bankName}
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
