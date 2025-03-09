'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PlusIcon, CalendarIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { useFirebase } from '@/contexts/FirebaseContext';
import { collection, getDocs, deleteDoc, doc, writeBatch, query, where, getDoc, documentId, limit } from 'firebase/firestore';
import { Session, ActivityType, activityDisplayNames } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

export default function SessionListPage() {
  const router = useRouter();
  const { firestore, auth } = useFirebase();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [instructorFilter, setInstructorFilter] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // This function exactly follows the security rules pattern for isAdmin()
  const checkAdminStatus = async () => {
    if (!firestore || !auth?.currentUser) return false;
    
    try {
      // Step 1: Check if user is authenticated
      const isAuthenticated = auth.currentUser !== null;
      if (!isAuthenticated) return false;
      
      // Step 2: Check if user document exists
      const userRef = doc(firestore, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return false;
      
      // Step 3: Check if user role is admin
      const userData = userSnap.data();
      return userData?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const checkUserRole = async () => {
    if (!firestore || !auth?.currentUser) return { isAdmin: false, isInstructor: false };
    
    try {
      // Step 1: Check if user is authenticated
      const isAuthenticated = auth.currentUser !== null;
      if (!isAuthenticated) return { isAdmin: false, isInstructor: false };

      // Step 2: Check if user document exists
      const userRef = doc(firestore, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return { isAdmin: false, isInstructor: false };

      // Step 3: Check user role
      const userData = userSnap.data();
      const isAdmin = userData?.role === 'admin';
      const isInstructor = userData?.role === 'instructor';
      
      return { isAdmin, isInstructor };
    } catch (error) {
      console.error('Error checking user role:', error);
      return { isAdmin: false, isInstructor: false };
    }
  };

  const fetchSessions = async () => {
    if (!firestore || !auth?.currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const sessionsRef = collection(firestore, 'sessions');
      let querySnapshot;

      // Apply different queries based on user role
      if (isInstructor && !isAdmin) {
        // Instructors can only see their own sessions
        const instructorQuery = query(sessionsRef, where('instructorId', '==', auth.currentUser.uid));
        querySnapshot = await getDocs(instructorQuery);
      } else {
        // Admins and regular users can see all sessions
        querySnapshot = await getDocs(sessionsRef);
      }
      
      const fetchedSessions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          activityId: data.activityId || '',
          activityName: data.activityName || '',
          activityType: (data.activityType as ActivityType) || 'CLASES_DERIGIDAS',
          title: data.title || data.activityName || '',
          description: data.description || '',
          notes: data.notes || '',
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || new Date(),
          capacity: Number(data.capacity) || 10,
          enrolledCount: Number(data.enrolledCount) || 0,
          bookedCount: Number(data.enrolledCount) || 0,
          status: data.status || 'scheduled',
          instructorId: data.instructorId || '',
          instructorName: data.instructorName || '',
          instructor: data.instructorName || '',
          instructorPhotoURL: data.instructorPhotoURL || null,
          recurring: data.recurring ? {
            frequency: data.recurring.frequency,
            repeatEvery: Number(data.recurring.repeatEvery),
            endDate: data.recurring.endDate?.toDate() || new Date(),
            weekdays: data.recurring.weekdays,
            parentSessionId: data.recurring.parentSessionId
          } : null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } satisfies Session;
      });

      setSessions(fetchedSessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  // Test if we can actually delete a session
  const testDeletePermission = async () => {
    if (!firestore || !auth?.currentUser) return false;
    
    try {
      // First verify admin status
      const isAdminUser = await checkAdminStatus();
      if (!isAdminUser) return false;
      
      // Create a test query to check delete permission
      const sessionsRef = collection(firestore, 'sessions');
      const testQuery = query(sessionsRef, limit(1));
      const snapshot = await getDocs(testQuery);
      
      if (snapshot.empty) return true; // No sessions to test with, assume we have permission
      
      // Try to get a reference to the first session
      const sessionId = snapshot.docs[0].id;
      
      // We won't actually delete it, just check if we can access it
      const sessionRef = doc(firestore, 'sessions', sessionId);
      await getDoc(sessionRef);
      
      return true;
    } catch (error) {
      console.error('Error testing delete permission:', error);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!firestore || !auth?.currentUser) {
        setLoading(false);
        setIsAdmin(false);
        setIsInstructor(false);
        setSelectedSessions([]); // Clear selections if not authenticated
        return;
      }

      try {
        // First check admin status directly
        const adminStatus = await checkAdminStatus();
        console.log('Direct admin check:', adminStatus); // Debug log
        
        // Test delete permission
        const canDelete = await testDeletePermission();
        console.log('Can delete sessions:', canDelete); // Debug log
        
        // Then check all roles
        const { isAdmin: adminRoleStatus, isInstructor: instructorStatus } = await checkUserRole();
        console.log('User roles:', { admin: adminRoleStatus, instructor: instructorStatus }); // Debug log
        
        setIsAdmin(adminStatus && canDelete);
        setIsInstructor(instructorStatus);
        
        // Only admins can delete sessions according to Firebase rules
        if (!adminStatus || !canDelete) {
          setSelectedSessions([]); // Clear selections if not admin
        }
        
        // Always fetch sessions since they're readable by all authenticated users
        await fetchSessions();
      } catch (error) {
        console.error('Error during initialization:', error);
        setError('Failed to initialize page');
        setIsAdmin(false);
        setIsInstructor(false);
        setSelectedSessions([]); // Clear selections on error
      }
    };

    init();

    // Cleanup function
    return () => {
      setIsAdmin(false);
      setIsInstructor(false);
      setSessions([]);
      setSelectedSessions([]);
      setShowDeleteModal(false); // Ensure modal is closed on cleanup
    };
  }, [firestore, auth?.currentUser?.uid]);

  const handleDeleteSessions = async () => {
    if (!auth?.currentUser) {
      toast.error('You must be logged in to delete sessions');
      return;
    }

    try {
      // Recheck admin status directly before deletion
      const isAdminUser = await checkAdminStatus();
      console.log('Admin status before deletion:', isAdminUser); // Debug log
      
      if (!isAdminUser) {
        toast.error('Only administrators can delete sessions');
        setShowDeleteModal(false);
        setSelectedSessions([]); // Clear selections if admin status lost
        return;
      }

      if (selectedSessions.length === 0) {
        toast.error('Please select sessions to delete');
        return;
      }
      
      setIsDeleting(true);

      // Get the sessions to delete
      const sessionsToDelete = sessions.filter(session => selectedSessions.includes(session.id));
      
      // Check if any sessions are in progress or completed
      const invalidSessions = sessionsToDelete.filter(
        session => session.status === 'in_progress' || session.status === 'completed'
      );

      if (invalidSessions.length > 0) {
        const invalidSessionNames = invalidSessions
          .map(session => session.activityName)
          .join(', ');
        toast.error(`Cannot delete sessions that are in progress or completed: ${invalidSessionNames}`);
        setShowDeleteModal(false);
        setIsDeleting(false);
        return;
      }

      // Use the server-side API to delete sessions
      const response = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionIds: selectedSessions
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          if (result.invalidSessions) {
            const invalidNames = result.invalidSessions
              .map((s: any) => s.activityName)
              .join(', ');
            toast.error(`Cannot delete sessions that are in progress or completed: ${invalidNames}`);
          } else if (result.sessionsWithBookings) {
            const sessionsWithBookingIds = new Set(result.sessionsWithBookings);
            const sessionNames = sessionsToDelete
              .filter(session => sessionsWithBookingIds.has(session.id))
              .map(session => session.activityName)
              .join(', ');
            toast.error(`Cannot delete sessions with active bookings: ${sessionNames}. Please cancel all bookings first.`);
          } else {
            toast.error(result.error || 'Cannot delete sessions due to conflicts');
          }
        } else if (response.status === 403) {
          toast.error('You do not have permission to delete sessions. Only administrators can delete sessions.');
        } else {
          toast.error(result.error || 'Failed to delete sessions');
        }
        
        setShowDeleteModal(false);
        setIsDeleting(false);
        return;
      }
      
      // Success - update UI
      setSessions(sessions.filter(session => !selectedSessions.includes(session.id)));
      setSelectedSessions([]);
      
      toast.success(
        selectedSessions.length === 1
          ? 'Successfully deleted 1 session'
          : `Successfully deleted ${selectedSessions.length} sessions`
      );
      
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting sessions:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          toast.error('You do not have permission to delete sessions. Only administrators can delete sessions.');
        } else {
          toast.error(`Error: ${error.message}`);
        }
      } else {
        toast.error('An error occurred while deleting sessions. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter sessions by instructor if filter is set
  const filteredSessions = instructorFilter
    ? sessions.filter(session => session.instructorId === instructorFilter)
    : sessions;

  // Get unique instructors for filter dropdown
  const uniqueInstructors = Array.from(
    new Map(
      sessions
        .filter(session => session.instructorId && session.instructorName)
        .map(session => [session.instructorId, { id: session.instructorId, name: session.instructorName }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <PageNavigation 
        title="Sessions" 
        actions={[
          {
            label: 'Calendar View',
            icon: CalendarIcon,
            href: '/dashboard/sessions/calendar',
            variant: 'secondary' as const
          },
          ...(isAdmin ? [
            {
              label: 'Create Session',
              icon: PlusIcon,
              href: '/dashboard/sessions/create',
              variant: 'primary' as const
            }
          ] : [])
        ]}
      />
      
      <main className="flex-1 p-6">
        <div className="flex flex-col space-y-6">
          {/* Header with actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Delete Sessions button - only show if admin and sessions are selected */}
              {isAdmin && selectedSessions.length > 0 && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={isDeleting}
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Delete Selected ({selectedSessions.length})
                </button>
              )}
            </div>

            {/* Instructor filter dropdown */}
            <div className="flex items-center space-x-2">
              <label htmlFor="instructor-filter" className="text-sm font-medium text-gray-700">
                Filter by Instructor:
              </label>
              <select
                id="instructor-filter"
                value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">All Instructors</option>
                {uniqueInstructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sessions table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Select all checkbox - only show if admin */}
                  {isAdmin && (
                    <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 sm:left-6"
                        ref={selectAllCheckboxRef}
                        checked={selectedSessions.length === filteredSessions.length && filteredSessions.length > 0}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedSessions(
                            checked ? filteredSessions.map(session => session.id) : []
                          );
                        }}
                      />
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-sm text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No sessions found
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.id}>
                      {/* Checkbox column - only show if admin */}
                      {isAdmin && (
                        <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                          <input
                            type="checkbox"
                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 sm:left-6"
                            value={session.id}
                            checked={selectedSessions.includes(session.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedSessions(
                                checked
                                  ? [...selectedSessions, session.id]
                                  : selectedSessions.filter(id => id !== session.id)
                              );
                            }}
                          />
                        </td>
                      )}
                      {/* Session info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {session.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activityDisplayNames[session.activityType]}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Date & Time */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(session.startTime, 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(session.startTime, 'h:mm a')} - {format(session.endTime, 'h:mm a')}
                        </div>
                      </td>
                      {/* Instructor */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {session.instructorPhotoURL ? (
                            <Image
                              src={session.instructorPhotoURL}
                              alt={session.instructorName}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <UserCircleIcon className="h-8 w-8 text-gray-400" />
                          )}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {session.instructorName}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${session.status === 'scheduled' ? 'bg-green-100 text-green-800' : 
                            session.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                            session.status === 'completed' ? 'bg-gray-100 text-gray-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      {/* Capacity */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span>{session.enrolledCount} / {session.capacity}</span>
                          {session.enrolledCount >= session.capacity && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Full
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/sessions/${session.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </Link>
                        {isAdmin && (
                          <>
                            <span className="mx-2 text-gray-300">|</span>
                            <Link
                              href={`/dashboard/sessions/${session.id}/edit`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Edit
                            </Link>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        title="Delete Sessions"
        description={`Are you sure you want to delete ${selectedSessions.length} session${selectedSessions.length === 1 ? '' : 's'}? This action cannot be undone.`}
        actions={[
          {
            label: 'Cancel',
            onClick: () => setShowDeleteModal(false),
            disabled: isDeleting,
            variant: 'secondary'
          },
          {
            label: isDeleting ? 'Deleting...' : 'Delete',
            onClick: handleDeleteSessions,
            disabled: isDeleting,
            variant: 'danger'
          }
        ]}
      />
    </div>
  );
}
