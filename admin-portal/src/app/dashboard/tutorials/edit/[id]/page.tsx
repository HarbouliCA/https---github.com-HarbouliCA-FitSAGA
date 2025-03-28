'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useParams, redirect } from 'next/navigation';
import TutorialForm from '@/components/tutorials/TutorialForm';
import tutorialService from '@/services/tutorialService';
import { Tutorial } from '@/interfaces/tutorial';

export default function EditTutorialPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
    } else {
      const fetchTutorial = async () => {
        try {
          if (!params) {
            setError('Invalid tutorial ID');
            setIsLoading(false);
            return;
          }
          
          const id = Array.isArray(params.id) ? params.id[0] : params.id;
          
          if (!id) {
            setError('Invalid tutorial ID');
            setIsLoading(false);
            return;
          }
          
          const tutorialData = await tutorialService.getTutorialById(id);
          
          if (!tutorialData) {
            setError('Tutorial not found');
            return;
          }
          
          // Check if user is the author
          if (tutorialData.authorId !== session.user?.id) {
            setError('You do not have permission to edit this tutorial');
            return;
          }
          
          setTutorial(tutorialData);
        } catch (err) {
          console.error(err);
          setError('Failed to load tutorial');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTutorial();
    }
  }, [session, status, params?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
          Tutorial not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Tutorial</h1>
        <p className="text-gray-600">
          Update your fitness tutorial content and exercises.
        </p>
      </div>

      <TutorialForm 
        tutorial={tutorial}
        authorId={session?.user?.id || ''} 
        authorName={session?.user?.name || undefined}
      />
    </div>
  );
} 