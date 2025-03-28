'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import TutorialForm from '@/components/tutorials/TutorialForm';
import { redirect } from 'next/navigation';

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
        <h1 className="text-2xl font-bold">Create New Tutorial</h1>
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
