'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { useFirebase } from '@/contexts/FirebaseContext';
import { collection, getDocs } from 'firebase/firestore';
import { Session, ActivityType, activityDisplayNames } from '@/types';

const SessionListPage = () => {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

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
            activityType: activityType || 'CLASES_DERIGIDAS', // Default value if undefined
            activityName: data.activityName || 'Unnamed Activity',
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate() || new Date(),
            capacity: Number(data.capacity) || 10,
            enrolledCount: Number(data.enrolledCount) || 0,
            status: data.status || 'scheduled'
          } satisfies Session;
        });

        // Sort sessions by start time, most recent first
        fetchedSessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        
        setSessions(fetchedSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [firestore]);

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
    return activityDisplayNames[type];
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/sessions/${session.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {session.activityName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatActivityType(session.activityType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(session.startTime, 'PPp')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={session.enrolledCount >= session.capacity ? 'text-red-600' : 'text-green-600'}>
                      {session.enrolledCount}/{session.capacity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(session.status)}`}>
                      {session.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/sessions/${session.id}`);
                      }}
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
    </div>
  );
};

export default SessionListPage;
