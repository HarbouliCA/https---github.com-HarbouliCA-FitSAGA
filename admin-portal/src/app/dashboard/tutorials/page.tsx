'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, Firestore, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import Link from 'next/link';
import PageNavigation from '@/components/ui/PageNavigation';
import Image from 'next/image';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTutorials = async () => {
      if (!firestore) return;

      try {
        const q = query(collection(firestore as Firestore, 'tutorials'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const tutorialsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Tutorial[];

        setTutorials(tutorialsData);
      } catch (error) {
        console.error('Error fetching tutorials:', error);
        setError('Failed to load tutorials');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  const actions = (
    <Link
      href="/dashboard/tutorials/create"
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    >
      <PlusIcon className="h-5 w-5 mr-2" />
      Create Tutorial
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageNavigation
        title="Tutorials"
        backUrl="/dashboard"
        backLabel="Back to Dashboard"
        actions={actions}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => (
          <Link
            key={tutorial.id}
            href={`/dashboard/tutorials/${tutorial.id}`}
            className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            {tutorial.thumbnailUrl ? (
              <div className="relative h-48 w-full">
                <Image
                  src={tutorial.thumbnailUrl}
                  alt={tutorial.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No thumbnail</span>
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                    {tutorial.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    by {tutorial.author}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tutorial.category === 'exercise'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {tutorial.category}
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {tutorial.description}
              </p>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">
                    {tutorial.duration} min
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tutorial.difficulty === 'beginner'
                      ? 'bg-green-100 text-green-800'
                      : tutorial.difficulty === 'intermediate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {tutorial.difficulty}
                  </span>
                </div>
                <span className="text-gray-500">
                  {tutorial.days?.length || 0} days
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {tutorials.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tutorials</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new tutorial.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/tutorials/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Tutorial
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
