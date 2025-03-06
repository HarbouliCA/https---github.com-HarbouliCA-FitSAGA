'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Session } from '@/types';
import SessionCalendar from '@/components/sessions/SessionCalendar';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!firestore) return;
      
      try {
        const sessionsRef = collection(firestore as Firestore, 'sessions');
        const q = query(sessionsRef, where('startTime', '>=', new Date()));
        const querySnapshot = await getDocs(q);
        const sessionData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Session[];
        setSessions(sessionData);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSessions();
  }, []);

  const handleSessionSelect = (session: Session) => {
    router.push(`/dashboard/sessions/${session.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Sessions Calendar</h1>
        <button
          onClick={() => router.push('/dashboard/sessions/create')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Session
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[600px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <SessionCalendar 
          sessions={sessions} 
          onSelectEvent={handleSessionSelect} 
        />
      )}
    </div>
  );
}