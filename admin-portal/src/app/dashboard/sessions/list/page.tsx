'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PlusIcon, CalendarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { useFirebase } from '@/contexts/FirebaseContext';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { Session, ActivityType, activityDisplayNames } from '@/types';

const SessionListPage = () => {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!firestore) return;
      
      try {
        const sessionsRef = collection(firestore, 'sessions');
        const querySnapshot = await getDocs(sessionsRef);
        
        const fetchedSessions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const activityType = data.activityType as ActivityType;
          
          return {
            id: doc.id,
            activityId: data.activityId || '',
            activityType: activityType || 'CLASES_DERIGIDAS',
            activityName: data.activityName || 'Unnamed Activity',
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate() || new Date(),
            capacity: Number(data.capacity) || 10,
            enrolledCount: Number(data.enrolledCount) || 0,
            status: data.status || 'scheduled',
            recurring: data.recurring ? {
              frequency: data.recurring.frequency,
              repeatEvery: Number(data.recurring.repeatEvery),
              endDate: data.recurring.endDate?.toDate() || new Date(),
              weekdays: data.recurring.weekdays,
              parentSessionId: data.recurring.parentSessionId,
              timeSlots: data.recurring.timeSlots
            } : null,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } satisfies Session;
        });

        // Sort sessions by start time, most recent first
        fetchedSessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        
        setSessions(fetchedSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setError('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [firestore]);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = 
        selectedSessions.length > 0 && selectedSessions.length < sessions.length;
    }
  }, [selectedSessions, sessions]);

  const getStatusBadgeClass = (status: Session['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActivityType = (type: ActivityType): string => {
    if (!type) return 'Unknown Activity';
    return activityDisplayNames[type] || type;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSessions(sessions.map(session => session.id));
    } else {
      setSelectedSessions([]);
    }
  };

  const handleSelectSession = (e: React.ChangeEvent<HTMLInputElement>, sessionId: string) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedSessions([...selectedSessions, sessionId]);
    } else {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId));
    }
  };

  const handleDeleteSelected = async () => {
    if (!firestore || selectedSessions.length === 0) return;
    
    setIsDeleting(true);
    try {
      const batch = writeBatch(firestore);
      
      selectedSessions.forEach(sessionId => {
        const sessionRef = doc(firestore, 'sessions', sessionId);
        batch.delete(sessionRef);
      });
      
      await batch.commit();
      
      // Update the UI by removing deleted sessions
      setSessions(sessions.filter(session => !selectedSessions.includes(session.id)));
      setSelectedSessions([]);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting sessions:', error);
      setError('Failed to delete selected sessions');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageNavigation
          title="Sessions"
          actions={[
            {
              label: 'Calendar View',
              icon: CalendarIcon,
              href: '/dashboard/sessions',
              variant: 'secondary'
            },
            {
              label: 'New Session',
              icon: PlusIcon,
              href: '/dashboard/sessions/create',
              variant: 'primary'
            }
          ]}
        />
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageNavigation
          title="Sessions"
          actions={[
            {
              label: 'Calendar View',
              icon: CalendarIcon,
              href: '/dashboard/sessions',
              variant: 'secondary'
            },
            {
              label: 'New Session',
              icon: PlusIcon,
              href: '/dashboard/sessions/create',
              variant: 'primary'
            }
          ]}
        />
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PageNavigation
        title="Sessions"
        actions={[
          {
            label: 'Calendar View',
            icon: CalendarIcon,
            href: '/dashboard/sessions',
            variant: 'secondary'
          },
          {
            label: 'New Session',
            icon: PlusIcon,
            href: '/dashboard/sessions/create',
            variant: 'primary'
          }
        ]}
      />

      <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
        {selectedSessions.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedSessions.length} {selectedSessions.length === 1 ? 'session' : 'sessions'} selected
            </span>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-1.5" />
              Delete Selected
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    onChange={handleSelectAll}
                    checked={selectedSessions.length > 0 && selectedSessions.length === sessions.length}
                    ref={selectAllCheckboxRef}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className={`hover:bg-gray-50 ${selectedSessions.includes(session.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={selectedSessions.includes(session.id)}
                      onChange={(e) => handleSelectSession(e, session.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" onClick={() => router.push(`/dashboard/sessions/${session.id}`)}>
                    {session.activityName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => router.push(`/dashboard/sessions/${session.id}`)}>
                    {formatActivityType(session.activityType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => router.push(`/dashboard/sessions/${session.id}`)}>
                    {format(session.startTime, 'PPp')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => router.push(`/dashboard/sessions/${session.id}`)}>
                    <span className={session.enrolledCount >= session.capacity ? 'text-red-600' : 'text-green-600'}>
                      {session.enrolledCount}/{session.capacity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={() => router.push(`/dashboard/sessions/${session.id}`)}>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(session.status)}`}>
                      {session.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => router.push(`/dashboard/sessions/${session.id}`)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      View<span className="sr-only">, {session.activityName}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Sessions</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {selectedSessions.length} {selectedSessions.length === 1 ? 'session' : 'sessions'}? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${isDeleting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionListPage;
