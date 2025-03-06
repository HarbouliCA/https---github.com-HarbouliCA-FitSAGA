'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Activity } from '@/types/activity';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/Modal';

export default function ActivityDetailPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const { firestore } = useFirebase();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!firestore) return;

      try {
        const docRef = doc(firestore as Firestore, 'activities', params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setActivity({
            id: docSnap.id,
            name: data.name || '',
            description: data.description || '',
            type: data.type || 'ENTREMIENTO_PERSONAL',
            duration: Number(data.duration) || 60,
            capacity: Number(data.capacity) || 10,
            difficulty: data.difficulty || 'beginner',
            creditValue: Number(data.creditValue) || 1,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        } else {
          setError('Activity not found');
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
        setError('Failed to load activity');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [firestore, params.id]);

  const handleDelete = async () => {
    if (!firestore || !activity?.id) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(firestore as Firestore, 'activities', activity.id));
      router.push('/dashboard/activities');
    } catch (error) {
      console.error('Error deleting activity:', error);
      setError('Failed to delete activity');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageNavigation 
          title="Activity Details"
          backUrl="/dashboard/activities"
        />
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="space-y-6">
        <PageNavigation 
          title="Activity Details"
          backUrl="/dashboard/activities"
        />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Activity not found'}</p>
        </div>
      </div>
    );
  }

  const activityTypeDisplay = {
    'ENTREMIENTO_PERSONAL': 'Personal Training',
    'KICK_BOXING': 'Kick Boxing',
    'SALE_FITNESS': 'Fitness Room',
    'CLASES_DERIGIDAS': 'Group Classes'
  }[activity.type];

  return (
    <div className="space-y-6">
      <PageNavigation 
        title={activity.name}
        backUrl="/dashboard/activities"
        actions={[
          {
            label: 'Edit',
            href: `/dashboard/activities/${activity.id}/edit`,
            icon: PencilIcon
          },
          {
            label: 'Delete',
            onClick: () => setShowDeleteModal(true),
            icon: TrashIcon,
            variant: 'danger'
          }
        ]}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Activity Information</h3>
        </div>
        <div className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{activityTypeDisplay}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="mt-1 text-sm text-gray-900">{activity.duration} minutes</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Capacity</dt>
              <dd className="mt-1 text-sm text-gray-900">{activity.capacity} people</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Difficulty</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{activity.difficulty}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Credit Value</dt>
              <dd className="mt-1 text-sm text-gray-900">{activity.creditValue} credits</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{activity.createdAt.toLocaleDateString()}</dd>
            </div>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900">{activity.description || 'No description provided.'}</dd>
          </div>
        </div>
      </div>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Activity"
        description="Are you sure you want to delete this activity? This action cannot be undone."
        actions={[
          {
            label: deleting ? 'Deleting...' : 'Delete',
            onClick: handleDelete,
            variant: 'danger',
            disabled: deleting
          },
          {
            label: 'Cancel',
            onClick: () => setShowDeleteModal(false),
            variant: 'secondary',
            disabled: deleting
          }
        ]}
      />
    </div>
  );
}
