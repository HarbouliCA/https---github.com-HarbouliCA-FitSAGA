'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Activity } from '@/types/activity';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ActivitiesPage() {
  const { firestore } = useFirebase();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!firestore) return;

      try {
        const querySnapshot = await getDocs(collection(firestore as Firestore, 'activities'));
        const activitiesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            type: data.type || 'ENTREMIENTO_PERSONAL',
            duration: Number(data.duration) || 60,
            capacity: Number(data.capacity) || 10,
            difficulty: data.difficulty || 'beginner',
            creditValue: Number(data.creditValue) || 1,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } satisfies Activity;
        });
        setActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [firestore]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageNavigation 
          title="Activities"
          actions={[
            {
              label: 'Add Activity',
              href: '/dashboard/activities/create',
              icon: PlusIcon
            }
          ]}
        />
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageNavigation 
          title="Activities"
          actions={[
            {
              label: 'Add Activity',
              href: '/dashboard/activities/create',
              icon: PlusIcon
            }
          ]}
        />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const activityTypeDisplay = {
    'ENTREMIENTO_PERSONAL': 'Personal Training',
    'KICK_BOXING': 'Kick Boxing',
    'SALE_FITNESS': 'Fitness Room',
    'CLASES_DERIGIDAS': 'Group Classes'
  };

  return (
    <div className="space-y-6">
      <PageNavigation 
        title="Activities"
        actions={[
          {
            label: 'Add Activity',
            href: '/dashboard/activities/create',
            icon: PlusIcon
          }
        ]}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No activities found. Click "Add Activity" to create your first activity.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <li key={activity.id} className="hover:bg-gray-50">
                <Link
                  href={`/dashboard/activities/${activity.id}`}
                  className="block p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{activity.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{activity.description}</p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {activityTypeDisplay[activity.type]}
                        </span>
                        <span className="text-sm text-gray-500">
                          {activity.duration} minutes
                        </span>
                        <span className="text-sm text-gray-500">
                          {activity.capacity} people
                        </span>
                        <span className="capitalize text-sm text-gray-500">
                          {activity.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
