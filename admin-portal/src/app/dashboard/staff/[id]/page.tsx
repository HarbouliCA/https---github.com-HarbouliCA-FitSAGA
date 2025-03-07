'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { doc, getDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/contexts/FirebaseContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Staff } from '@/types';
import { PageNavigation, PageNavigationAction } from '@/components/layout/PageNavigation';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';

interface PageParams {
  id: string;
}

export default function StaffDetailPage({ params: { id } }: { params: PageParams }) {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { hasPermission } = usePermissions();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManageStaff = hasPermission('manage_staff');

  const navigationActions: (PageNavigationAction | false)[] = [
    canManageStaff && {
      label: 'Edit Staff',
      href: `/dashboard/staff/${id}/edit`,
      icon: PencilIcon,
      variant: 'secondary' as const
    },
    canManageStaff && {
      label: deleting ? 'Deleting...' : 'Delete Staff',
      onClick: () => setShowDeleteConfirm(true),
      icon: TrashIcon,
      variant: 'danger' as const,
      disabled: deleting
    }
  ];

  useEffect(() => {
    const fetchStaff = async () => {
      if (!firestore || !id) return;

      try {
        const docRef = doc(firestore as Firestore, 'staff', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setStaff({
            id: docSnap.id,
            ...data,
            dateOfBirth: data.dateOfBirth?.toDate(),
            employedSince: data.employedSince?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          } as Staff);
        } else {
          setError('Staff member not found');
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        setError('Failed to load staff member');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [firestore, id]);

  const handleDelete = async () => {
    if (!firestore || !staff) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(firestore as Firestore, 'staff', staff.id));
      router.push('/dashboard/staff');
    } catch (error) {
      console.error('Error deleting staff:', error);
      setError('Failed to delete staff member');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageNavigation title="Staff Details" />
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
        <PageNavigation title="Staff Details" />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Staff member not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageNavigation
        title={`${staff.firstName} ${staff.lastName}`}
        actions={navigationActions}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{staff.email}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{staff.phone}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">{staff.role}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  staff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {staff.status}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm text-gray-900">{format(staff.dateOfBirth, 'PPP')}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Employed Since</dt>
              <dd className="mt-1 text-sm text-gray-900">{format(staff.employedSince, 'PPP')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {staff.address.street}<br />
                {staff.address.city}, {staff.address.postalCode}<br />
                {staff.address.country}
              </dd>
            </div>
            {canManageStaff && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Bank Details</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div>Account Holder: {staff.bankDetails.accountHolder}</div>
                  <div>IBAN: {staff.bankDetails.iban}</div>
                  {staff.bankDetails.bankName && (
                    <div>Bank: {staff.bankDetails.bankName}</div>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <ConfirmationDialog
        open={showDeleteConfirm}
        title="Delete Staff Member"
        message={`Are you sure you want to delete ${staff.firstName} ${staff.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
