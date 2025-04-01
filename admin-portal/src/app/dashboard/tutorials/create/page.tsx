'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import TutorialForm from '@/components/tutorials/TutorialForm';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function CreateTutorialPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
    } else {
      setIsLoading(false);
    }
  }, [session, status]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href="/dashboard/tutorials"
            className="mr-4 p-2 rounded-md hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Create New Tutorial</h1>
        </div>
        <p className="text-gray-600">
          Create a new fitness tutorial with multiple days of exercises.
        </p>
      </div>

      <TutorialForm 
        authorId={session?.user?.id || ''} 
        authorName={session?.user?.name || undefined}
      />
    </div>
  );
}
