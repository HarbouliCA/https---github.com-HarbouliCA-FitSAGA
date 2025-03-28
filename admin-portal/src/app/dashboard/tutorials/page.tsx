'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import tutorialService from '@/services/tutorialService';
import { Tutorial } from '@/interfaces/tutorial';
import Link from 'next/link';

export default function TutorialsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
    } else {
      const fetchTutorials = async () => {
        try {
          const tutorialsData = await tutorialService.getTutorialsByAuthor(session.user?.id || '');
          setTutorials(tutorialsData);
        } catch (err) {
          console.error(err);
          setError('Failed to load tutorials');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTutorials();
    }
  }, [session, status]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tutorial? This action cannot be undone.')) {
      try {
        await tutorialService.deleteTutorial(id);
        setTutorials(tutorials.filter(tutorial => tutorial.id !== id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete tutorial');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Your Tutorials</h1>
          <p className="text-gray-600">
            Manage your fitness tutorials and exercise plans.
          </p>
        </div>
        <Link 
          href="/dashboard/tutorials/create"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Create New Tutorial
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {tutorials.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-medium mb-2">No Tutorials Yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't created any tutorials yet. Get started by creating your first tutorial.
          </p>
          <Link 
            href="/dashboard/tutorials/create"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Your First Tutorial
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map(tutorial => (
            <div key={tutorial.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{tutorial.title}</h2>
                <div className="flex space-x-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                    {tutorial.category}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                    {tutorial.difficulty}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {tutorial.description || 'No description provided.'}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  <div>{tutorial.days.length} days</div>
                  <div>
                    {tutorial.days.reduce((total, day) => total + day.exercises.length, 0)} exercises
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="space-x-2">
                    <Link
                      href={`/dashboard/tutorials/view/${tutorial.id}`}
                      className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/tutorials/edit/${tutorial.id}`}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                    >
                      Edit
                    </Link>
                  </div>
                  <button
                    onClick={() => tutorial.id && handleDelete(tutorial.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
