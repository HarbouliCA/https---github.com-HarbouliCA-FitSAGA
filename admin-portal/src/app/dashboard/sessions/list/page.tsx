'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PlusIcon, CalendarIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { useFirebase } from '@/contexts/FirebaseContext';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { Session, ActivityType, activityDisplayNames } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

const SessionListPage = () => {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [instructorFilter, setInstructorFilter] = useState<string>('');
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
            instructorId: data.instructorId || '',
            instructorName: data.instructorName || '',
            instructorPhotoURL: data.instructorPhotoURL,
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

  // Filter sessions by instructor if filter is set
  const filteredSessions = instructorFilter
    ? sessions.filter(session => session.instructorId === instructorFilter)
    : sessions;

  // Get unique instructors for filter dropdown
  const uniqueInstructors = Array.from(new Set(sessions.map(session => ({
    id: session.instructorId,
    name: session.instructorName
  })).filter(instructor => instructor.id && instructor.name)));

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
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              All Sessions
            </h3>
            <div className="flex items-center space-x-4">
              <select
                value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
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
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
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
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/sessions/${session.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{session.activityName}</div>
                    <div className="text-sm text-gray-500">{formatActivityType(session.activityType)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {session.instructorId ? (
                      <Link
                        href={`/dashboard/instructors/${session.instructorId}`}
                        className="flex items-center space-x-3 hover:text-primary-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {session.instructorPhotoURL ? (
                          <Image
                            src={session.instructorPhotoURL}
                            alt={session.instructorName}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <UserCircleIcon className="h-8 w-8 text-gray-400" />
                        )}
                        <span className="text-sm">{session.instructorName}</span>
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-500">No instructor assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(session.startTime, 'MMM d, yyyy')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(session.startTime, 'h:mm a')} - {format(session.endTime, 'h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.enrolledCount} / {session.capacity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(session.status)}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/sessions/${session.id}/edit`);
                      }}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionListPage;
