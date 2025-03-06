'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Activity } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ACTIVITY_TYPES = {
  kingboxing: 'Kingboxing',
  yoga: 'Yoga',
  musculation: 'Musculation',
  free_access: 'Free Access',
  other: 'Other'
} as const;

type ActivityType = keyof typeof ACTIVITY_TYPES;

const formatActivityType = (type: string | undefined): string => {
  if (!type || !(type in ACTIVITY_TYPES)) return ACTIVITY_TYPES.other;
  return ACTIVITY_TYPES[type as ActivityType];
};

export default function ActivityPage({ params }: { params: { id: string } }) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined' || !firestore) return;

    const fetchActivity = async () => {
      setLoading(true);
      setError(null);
      try {
        const activityDoc = await getDoc(doc(firestore as Firestore, 'activities', params.id));
        
        if (!activityDoc.exists()) {
          setError('Activity not found');
          return;
        }

        const data = activityDoc.data();
        setActivity({
          ...data,
          id: activityDoc.id,
          type: data.type || 'other',
          creditValue: data.creditValue || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Activity);
      } catch (error) {
        console.error('Error fetching activity:', error);
        setError('Failed to load activity details');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore as Firestore, 'activities', params.id));
      router.push('/activities');
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link href="/activities" className="text-red-700 underline hover:text-red-600">
                Return to Activities
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activity) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/activities" className="text-gray-500 hover:text-gray-700">
            ← Back to Activities
          </Link>
          <h1 className="page-title">{activity.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Link
            href={`/activities/${activity.id}/edit`}
            className="btn-secondary flex items-center"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-danger flex items-center"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {activity.imageUrl && (
          <div className="h-64 bg-gray-200">
            <img
              src={activity.imageUrl}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Activity Type</p>
              <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm capitalize">
                {formatActivityType(activity.type)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Credit Value</p>
              <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                {activity.creditValue} Credits
              </span>
            </div>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{activity.description}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-500">
              <div>
                Created: {activity.createdAt.toLocaleDateString()}
              </div>
              <div>
                Last Updated: {activity.updatedAt.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
