'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Session } from '@/types';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@heroicons/react/24/outline';
import PageNavigation from '@/components/ui/PageNavigation';

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      if (!firestore) return;

      try {
        const sessionDoc = await getDoc(doc(firestore as Firestore, 'sessions', params.id));
        
        if (!sessionDoc.exists()) {
          setError('Session not found');
          setLoading(false);
          return;
        }

        const data = sessionDoc.data();
        setSession({
          id: sessionDoc.id,
          ...data,
          startTime: data.startTime?.toDate() || null,
          endTime: data.endTime?.toDate() || null,
          recurring: data.recurring ? {
            ...data.recurring,
            endDate: data.recurring.endDate?.toDate() || null
          } : undefined
        } as Session);
      } catch (error) {
        console.error('Error fetching session:', error);
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [params.id]);

  const handleDelete = async () => {
    if (!firestore || !session) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore as Firestore, 'sessions', session.id));
      router.push('/dashboard/sessions');
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/dashboard/sessions')}
            className="text-red-700 font-medium hover:text-red-800 mt-2"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const actions = (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => setShowDeleteModal(true)}
        className="text-red-400 hover:text-red-600"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageNavigation
        backUrl="/dashboard/sessions"
        backLabel="Back to Sessions"
        title={`Session ${session.id}`}
        actions={actions}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Session Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Activity</label>
                  <div className="mt-1 text-sm text-gray-900">
                    <div>{session.activityName}</div>
                    <div className="text-xs text-gray-500">ID: {session.activityId}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Title</label>
                  <div className="mt-1 text-sm text-gray-900">{session.title}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Time</label>
                  <div className="mt-1 text-sm text-gray-900">
                    <div>Start: {session.startTime?.toLocaleDateString() || 'No date'} {session.startTime?.toLocaleTimeString() || 'No time'}</div>
                    <div>End: {session.endTime?.toLocaleDateString() || 'No date'} {session.endTime?.toLocaleTimeString() || 'No time'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Capacity Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Capacity</label>
                  <div className="mt-1 text-sm text-gray-900">{session.capacity} participants</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Booked Count</label>
                  <div className="mt-1 text-sm text-gray-900">{session.bookedCount} participants</div>
                </div>
                {session.instructor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Instructor</label>
                    <div className="mt-1 text-sm text-gray-900">{session.instructor}</div>
                  </div>
                )}
                {session.recurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Recurring Schedule</label>
                    <div className="mt-1 text-sm text-gray-900">
                      <div>Frequency: {session.recurring.frequency}</div>
                      <div>Repeat every: {session.recurring.repeatEvery} {session.recurring.frequency}</div>
                      {session.recurring.weekdays && (
                        <div>Days: {session.recurring.weekdays.join(', ')}</div>
                      )}
                      <div>Until: {session.recurring.endDate?.toLocaleDateString() || 'No end date'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(session.description || session.notes) && (
              <div className="md:col-span-2">
                {session.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Description</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.description}</p>
                    </div>
                  </div>
                )}
                {session.notes && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Notes</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Session</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
