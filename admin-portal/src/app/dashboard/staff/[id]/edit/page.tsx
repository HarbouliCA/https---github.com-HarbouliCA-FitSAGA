'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Staff, StaffFormData } from '@/types/staff';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { StaffForm } from '@/components/staff/StaffForm';

interface PageParams {
  id: string;
}

export default function EditStaffPage() {
  const params = useParams() as PageParams;
  const router = useRouter();
  const { firestore } = useFirebase();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!firestore || !params.id) return;

      try {
        const docRef = doc(firestore as Firestore, 'staff', params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setStaff({
            id: docSnap.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            gender: data.gender || 'other',
            dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
            email: data.email || '',
            phone: data.phone || '',
            employedSince: data.employedSince?.toDate() || new Date(),
            role: data.role || 'INSTRUCTOR',
            address: {
              street: data.address?.street || '',
              city: data.address?.city || '',
              postalCode: data.address?.postalCode || '',
              country: data.address?.country || ''
            },
            bankDetails: {
              accountHolder: data.bankDetails?.accountHolder || '',
              iban: data.bankDetails?.iban || '',
              bankName: data.bankDetails?.bankName
            },
            status: data.status || 'active',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        } else {
          setError('Staff member not found');
        }
      } catch (error) {
        console.error('Error fetching staff member:', error);
        setError('Failed to load staff member');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [firestore, params.id]);

  const handleSubmit = async (data: StaffFormData) => {
    if (!firestore || !params.id) return;

    setSaving(true);
    setError(null);

    try {
      const docRef = doc(firestore as Firestore, 'staff', params.id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });

      router.push(`/dashboard/staff/${params.id}`);
    } catch (error) {
      console.error('Error updating staff member:', error);
      setError('Failed to update staff member');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageNavigation 
          title="Edit Staff Member"
          backUrl={`/dashboard/staff/${params.id}`}
        />
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="space-y-6">
        <PageNavigation 
          title="Edit Staff Member"
          backUrl={`/dashboard/staff/${params.id}`}
        />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageNavigation 
        title={`Edit ${staff.firstName} ${staff.lastName}`}
        backUrl={`/dashboard/staff/${params.id}`}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}

          <StaffForm
            initialData={staff}
            onSubmit={handleSubmit}
            disabled={saving}
            submitLabel={saving ? 'Saving...' : 'Save Changes'}
          />
        </div>
      </div>
    </div>
  );
}
