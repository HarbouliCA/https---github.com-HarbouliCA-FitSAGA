'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, limit, orderBy, where, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { User, Activity, Session } from '@/types';
import { 
  UsersIcon, 
  ClipboardDocumentListIcon, 
  CalendarIcon,
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({
    userCount: 0,
    activityCount: 0,
    sessionCount: 0,
    recentUsers: [] as User[],
    recentActivities: [] as Activity[],
    upcomingSessions: [] as Session[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined' || !firestore) return;
    
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch user count
        const usersSnapshot = await getDocs(collection(firestore as Firestore, 'users'));
        const userCount = usersSnapshot.size;
        
        // Fetch recent users
        const recentUsersQuery = query(
          collection(firestore as Firestore, 'users'),
          orderBy('lastActive', 'desc'),
          limit(5)
        );
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        const recentUsers = recentUsersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            uid: doc.id,
            memberSince: data.memberSince?.toDate(),
            lastActive: data.lastActive?.toDate(),
            birthday: data.birthday?.toDate()
          } as User;
        });
        
        // Fetch activity count
        const activitiesSnapshot = await getDocs(collection(firestore as Firestore, 'activities'));
        const activityCount = activitiesSnapshot.size;
        
        // Fetch recent activities
        const recentActivitiesQuery = query(
          collection(firestore as Firestore, 'activities'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentActivitiesSnapshot = await getDocs(recentActivitiesQuery);
        const recentActivities = recentActivitiesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          } as Activity;
        });
        
        // Fetch session count
        const sessionsSnapshot = await getDocs(collection(firestore as Firestore, 'sessions'));
        const sessionCount = sessionsSnapshot.size;
        
        // Fetch upcoming sessions
        const now = new Date();
        const upcomingSessionsQuery = query(
          collection(firestore as Firestore, 'sessions'),
          orderBy('startTime', 'asc'),
          limit(5)
        );
        const upcomingSessionsSnapshot = await getDocs(upcomingSessionsQuery);
        const upcomingSessions = upcomingSessionsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              startTime: data.startTime?.toDate(),
              endTime: data.endTime?.toDate(),
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate()
            } as Session;
          })
          .filter(session => session.startTime > now);
        
        setStats({
          userCount,
          activityCount,
          sessionCount,
          recentUsers,
          recentActivities,
          upcomingSessions
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="page-title">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-white shadow-md rounded-lg p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <UsersIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">{stats.userCount}</p>
          </div>
        </div>
        
        <div className="card bg-white shadow-md rounded-lg p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Activities</p>
            <p className="text-2xl font-bold">{stats.activityCount}</p>
          </div>
        </div>
        
        <div className="card bg-white shadow-md rounded-lg p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <CalendarIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Sessions</p>
            <p className="text-2xl font-bold">{stats.sessionCount}</p>
          </div>
        </div>
      </div>
      
      {/* Recent Users */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Recent Users</h2>
          <Link href="/users" className="text-primary-600 hover:text-primary-800 text-sm flex items-center">
            View All
            <ArrowTrendingUpIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentUsers.map((user) => (
                <tr key={user.uid}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.credits}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.lastActive?.toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
              {stats.recentUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Upcoming Sessions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Upcoming Sessions</h2>
          <Link href="/sessions" className="text-primary-600 hover:text-primary-800 text-sm flex items-center">
            View All
            <ArrowTrendingUpIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.upcomingSessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{session.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {session.startTime?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {session.endTime?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.capacity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.bookedCount}</div>
                  </td>
                </tr>
              ))}
              {stats.upcomingSessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No upcoming sessions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
