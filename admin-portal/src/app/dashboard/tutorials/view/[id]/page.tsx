'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useParams, redirect } from 'next/navigation';
import tutorialService from '@/services/tutorialService';
import { Tutorial } from '@/interfaces/tutorial';
import TutorialPreview from '@/components/tutorials/TutorialPreview';
import Link from 'next/link';

export default function ViewTutorialPage() {
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

          const tutorialData = await tutorialService.getTutorialById(id);
          
          if (!tutorialData) {
            setError('Tutorial not found');
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Tutorial Preview</h1>
        <div className="flex space-x-4">
          <Link
            href="/dashboard/tutorials"
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Tutorials
          </Link>
          <Link
            href={`/dashboard/tutorials/play/${tutorial.id}`}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Start Workout
          </Link>
          {tutorial.authorId === session?.user?.id && (
            <Link
              href={`/dashboard/tutorials/edit/${tutorial.id}`}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Edit Tutorial
            </Link>
          )}
        </div>
      </div>

      <TutorialPreview tutorial={tutorial} />
    </div>
  );
} 