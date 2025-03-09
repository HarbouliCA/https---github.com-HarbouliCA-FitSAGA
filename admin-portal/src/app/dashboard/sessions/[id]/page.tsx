'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Session } from '@/types';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!firestore || !params.id) return;

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
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || new Date(),
          recurring: data.recurring ? {
            ...data.recurring,
            endDate: data.recurring.endDate?.toDate() || new Date()
          } : null
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
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="container mx-auto px-4 py-6">
      <PageNavigation
        title={session.title || session.activityName}
        actions={[
          {
            label: 'Back to Sessions',
            href: '/dashboard/sessions',
            variant: 'secondary'
          },
          {
            label: 'Delete Session',
            onClick: () => setShowDeleteModal(true),
            variant: 'danger'
          }
        ]}
      />

      <div className="mt-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 grid md:grid-cols-2 gap-6">
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
                  <label className="block text-sm font-medium text-gray-500">Enrolled Count</label>
                  <div className="mt-1 text-sm text-gray-900">{session.enrolledCount} participants</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Instructor</label>
                  <div className="mt-1 text-sm text-gray-900">{session.instructorName}</div>
                </div>
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

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Session"
        description="Are you sure you want to delete this session? This action cannot be undone."
        actions={[
          {
            label: 'Cancel',
            onClick: () => setShowDeleteModal(false),
            variant: 'secondary',
            disabled: isDeleting
          },
          {
            label: 'Delete',
            onClick: handleDelete,
            variant: 'danger',
            disabled: isDeleting
          }
        ]}
      />
    </div>
  );
}