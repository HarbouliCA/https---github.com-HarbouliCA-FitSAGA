'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Session, Activity } from '@/types';
import Link from 'next/link';
import { PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activities, setActivities] = useState<{ [key: string]: Activity }>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined' || !firestore) return;

    const fetchActivities = async () => {
      try {
        const activitiesQuery = query(
          collection(firestore as Firestore, 'activities')
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesMap: { [key: string]: Activity } = {};

        activitiesSnapshot.forEach((doc) => {
          activitiesMap[doc.id] = { id: doc.id, ...doc.data() } as Activity;
        });

        setActivities(activitiesMap);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
  }, []);

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined' || !firestore) return;

    const fetchSessions = async () => {
      setLoading(true);
      try {
        let sessionsQuery;
        const now = new Date();

        if (selectedDate) {
          const selectedDateObj = new Date(selectedDate);
          const nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);

          sessionsQuery = query(
            collection(firestore as Firestore, 'sessions'),
            where('startTime', '>=', selectedDateObj),
            where('startTime', '<', nextDay),
            orderBy('startTime')
          );
        } else if (filter === 'upcoming') {
          sessionsQuery = query(
            collection(firestore as Firestore, 'sessions'),
            where('startTime', '>=', now),
            orderBy('startTime')
          );
        } else if (filter === 'past') {
          sessionsQuery = query(
            collection(firestore as Firestore, 'sessions'),
            where('startTime', '<', now),
            orderBy('startTime', 'desc')
          );
        } else {
          sessionsQuery = query(
            collection(firestore as Firestore, 'sessions'),
            orderBy('startTime')
          );
        }

        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessionsList: Session[] = [];

        sessionsSnapshot.forEach((doc) => {
          const data = doc.data();
          sessionsList.push({
            id: doc.id,
            ...data,
            startTime: data.startTime?.toDate(),
            endTime: data.endTime?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          } as Session);
        });

        setSessions(sessionsList);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [filter, selectedDate]);

  const handleFilterChange = (newFilter: 'upcoming' | 'past' | 'all') => {
    setFilter(newFilter);
    setSelectedDate('');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="page-title">Sessions</h1>
        <Link
          href="/sessions/create"
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Session
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => handleFilterChange('upcoming')}
            className={`px-3 py-1 rounded-md ${
              filter === 'upcoming'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => handleFilterChange('past')}
            className={`px-3 py-1 rounded-md ${
              filter === 'past'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 rounded-md ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="input-field py-1"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No sessions found for the selected criteria.
            </div>
          ) : (
            sessions.map((session) => {
              const activity = activities[session.activityId];
              const isUpcoming = new Date() < session.startTime;

              return (
                <div
                  key={session.id}
                  className={`card overflow-hidden border-l-4 ${
                    isUpcoming ? 'border-l-green-500' : 'border-l-gray-400'
                  }`}
                >
                  <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold">{session.title}</h3>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                          {activity?.name || 'Unknown Activity'}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <p>
                          <span className="font-medium">Date:</span>{' '}
                          {session.startTime.toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium">Time:</span>{' '}
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </p>
                        <p>
                          <span className="font-medium">Capacity:</span>{' '}
                          {session.bookedCount || 0} / {session.capacity}
                        </p>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {session.description}
                      </p>
                    </div>

                    <div className="mt-4 md:mt-0 flex items-center space-x-2">
                      <Link
                        href={`/sessions/${session.id}`}
                        className="btn-outline-sm"
                      >
                        View
                      </Link>
                      <Link
                        href={`/sessions/${session.id}/edit`}
                        className="btn-outline-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
