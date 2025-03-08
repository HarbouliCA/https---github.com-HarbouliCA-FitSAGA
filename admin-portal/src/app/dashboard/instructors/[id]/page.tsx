'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Instructor, InstructorSession } from '@/types';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  PencilSquareIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function InstructorDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [assignedSessions, setAssignedSessions] = useState<InstructorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchInstructor = async () => {
      if (!firestore) return;

      try {
        const instructorDoc = await getDoc(doc(firestore as Firestore, 'instructors', id));
        
        if (!instructorDoc.exists()) {
          setError('Instructor not found');
          return;
        }

        const data = instructorDoc.data();
        setInstructor({
          ...data,
          uid: instructorDoc.id,
          dateOfBirth: data.dateOfBirth?.toDate(),
          workingSince: data.workingSince?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastActive: data.lastActive?.toDate()
        } as Instructor);

        // Fetch assigned sessions
        const sessionsQuery = query(
          collection(firestore as Firestore, 'sessions'),
          where('instructorId', '==', id),
          where('status', 'in', ['scheduled', 'in_progress'])
        );

        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessions = sessionsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          startTime: doc.data().startTime?.toDate(),
          endTime: doc.data().endTime?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        } as InstructorSession));

        setAssignedSessions(sessions);
      } catch (err) {
        console.error('Error fetching instructor:', err);
        setError('Failed to load instructor details');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructor();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/instructors/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete instructor');
      }

      router.push('/dashboard/instructors');
    } catch (err) {
      console.error('Error deleting instructor:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete instructor');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Failed to load instructor'}</p>
        <Link href="/dashboard/instructors" className="btn-secondary mt-4">
          Back to Instructors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/instructors"
            className="btn-secondary flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{instructor.fullName}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/dashboard/instructors/${id}/edit`}
            className="btn-primary flex items-center"
          >
            <PencilSquareIcon className="h-5 w-5 mr-1" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-danger"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Instructor'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Delete Instructor</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this instructor? This action cannot be undone.
              All associated data including sessions and activities will also be deleted.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{instructor.fullName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{instructor.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{instructor.telephone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Working Since</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {instructor.workingSince.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {instructor.dateOfBirth.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    instructor.accessStatus === 'green'
                      ? 'bg-green-100 text-green-800'
                      : instructor.accessStatus === 'red'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {instructor.accessStatus === 'green' ? 'Active' : instructor.accessStatus === 'red' ? 'Inactive' : 'Pending'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{instructor.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Bank Name</label>
                  <p className="mt-1 text-sm text-gray-900">{instructor.bankDetails.bankName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Holder</label>
                  <p className="mt-1 text-sm text-gray-900">{instructor.bankDetails.accountHolder}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Number</label>
                  <p className="mt-1 text-sm text-gray-900">{instructor.bankDetails.accountNumber}</p>
                </div>
                {instructor.bankDetails.iban && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">IBAN</label>
                    <p className="mt-1 text-sm text-gray-900">{instructor.bankDetails.iban}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Sessions */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Assigned Sessions</h3>
                <Link
                  href={`/dashboard/sessions?instructor=${id}`}
                  className="btn-secondary text-sm"
                >
                  View All
                </Link>
              </div>
              {assignedSessions.length > 0 ? (
                <div className="space-y-4">
                  {assignedSessions.slice(0, 5).map((session) => (
                    <Link
                      key={session.id}
                      href={`/dashboard/sessions/${session.id}`}
                      className="block p-4 border rounded-md hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{session.activityName}</p>
                          <p className="text-sm text-gray-500">
                            {session.startTime.toLocaleString()} - {session.endTime.toLocaleString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          session.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No upcoming sessions assigned</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/dashboard/sessions/create?instructor=${id}`}
                  className="btn-secondary w-full justify-center"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Assign Session
                </Link>
                <Link
                  href={`/dashboard/activities?instructor=${id}`}
                  className="btn-secondary w-full justify-center"
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                  View Activities
                </Link>
                <Link
                  href={`/dashboard/forum?instructor=${id}`}
                  className="btn-secondary w-full justify-center"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  View Forum Posts
                </Link>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Member Since</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {instructor.createdAt.toLocaleDateString()}
                  </p>
                </div>
                {instructor.lastActive && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Active</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {instructor.lastActive.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Portal Access</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-900">Web Portal & Mobile App</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
