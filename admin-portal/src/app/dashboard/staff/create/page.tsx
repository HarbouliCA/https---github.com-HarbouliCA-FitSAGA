'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, setDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/contexts/FirebaseContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { StaffForm } from '@/components/staff/StaffForm';
import PageNavigation from '@/components/ui/PageNavigation';
import { StaffFormData, PageNavigationAction, User } from '@/types';

export default function CreateStaffPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { hasPermission } = usePermissions();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for manage_staff permission
  useEffect(() => {
    if (!hasPermission('manage_staff')) {
      router.push('/dashboard/staff');
    }
  }, [hasPermission, router]);

  const handleSubmit = async (data: StaffFormData) => {
    if (!firestore || !hasPermission('manage_staff')) return;

    setSaving(true);
    setError(null);

    try {
      const staffData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: new Date()
      };

      // Create staff member in staff collection
      const staffRef = await addDoc(collection(firestore as Firestore, 'staff'), staffData);

      // Create user document for the staff member to ensure proper permissions
      const userRef = doc(firestore as Firestore, 'users', staffRef.id);
      const userData: User = {
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        role: data.role,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await setDoc(userRef, userData);

      router.push(`/dashboard/staff/${staffRef.id}`);
    } catch (error) {
      console.error('Error creating staff member:', error);
      setError('Failed to create staff member. Please try again.');
      setSaving(false);
    }
  };

  // Don't render if no permission
  if (!hasPermission('manage_staff')) {
    return null;
  }

  const actions: PageNavigationAction[] = [
    { label: 'Back to Staff', href: '/dashboard/staff', variant: 'secondary' }
  ];

  return (
    <div className="space-y-6">
      <PageNavigation 
        title="Add Staff Member"
        actions={actions}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}

          <StaffForm
            onSubmit={handleSubmit}
            disabled={saving}
            submitLabel={saving ? 'Saving...' : 'Create Staff Member'}
          />
        </div>
      </div>
    </div>
  );
}
