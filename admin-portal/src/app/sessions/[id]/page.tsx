'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Session } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function SessionPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined' || !firestore) return;

    const fetchSession = async () => {
      setLoading(true);
      setError(null);
      try {
        const sessionDoc = await getDoc(doc(firestore as Firestore, 'sessions', params.id));
        
        if (!sessionDoc.exists()) {
          setError('Session not found');
          return;
        }

        const data = sessionDoc.data();
        // Ensure all date fields are properly converted
        const startTimeDate = data.startTime?.toDate?.() || new Date(data.startTime);
        const endTimeDate = data.endTime?.toDate?.() || new Date(data.endTime);
        const createdAtDate = data.createdAt?.toDate?.() || new Date(data.createdAt);
        const updatedAtDate = data.updatedAt?.toDate?.() || new Date(data.updatedAt);

        setSession({
          ...data,
          id: sessionDoc.id,
          startTime: startTimeDate,
          endTime: endTimeDate,
          createdAt: createdAtDate,
          updatedAt: updatedAtDate,
          capacity: data.capacity || 1,
          bookedCount: data.bookedCount || 0
        } as Session);
      } catch (error) {
        console.error('Error fetching session:', error);
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore as Firestore, 'sessions', params.id));
      router.push('/sessions');
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link href="/sessions" className="text-red-700 underline hover:text-red-600">
                Return to Sessions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/sessions" className="text-gray-500 hover:text-gray-700">
            ← Back to Sessions
          </Link>
          <h1 className="page-title">{session.title}</h1>
        </div>
        <div className="flex space-x-2">
          <Link
            href={`/sessions/${session.id}/edit`}
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
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Activity</p>
              <p className="text-lg font-medium">
                {session.activityName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Capacity</p>
              <p className="text-lg font-medium">
                {session.bookedCount} / {session.capacity} booked
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Start Time</p>
              <p className="text-lg font-medium">
                {session.startTime.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">End Time</p>
              <p className="text-lg font-medium">
                {session.endTime.toLocaleString()}
              </p>
            </div>
          </div>

          {session.description && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-gray-600 whitespace-pre-wrap">{session.description}</p>
            </div>
          )}

          {session.notes && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Notes</p>
              <p className="text-gray-600 whitespace-pre-wrap">{session.notes}</p>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-500">
              <div>
                Created: {session.createdAt.toLocaleDateString()}
              </div>
              <div>
                Last Updated: {session.updatedAt.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
