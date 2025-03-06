'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import PageNavigation from '@/components/ui/PageNavigation';

export default function TutorialDetailPage() {
  const { id } = useParams();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!id || typeof id !== 'string' || !firestore) return;

      try {
        const tutorialRef = doc(firestore as Firestore, 'tutorials', id);
        const tutorialDoc = await getDoc(tutorialRef);

        if (!tutorialDoc.exists()) {
          setError('Tutorial not found');
          return;
        }

        const data = tutorialDoc.data();
        const tutorialData: Tutorial = {
          id: tutorialDoc.id,
          title: data.title,
          category: data.category,
          description: data.description,
          thumbnailUrl: data.thumbnailUrl,
          author: data.author,
          duration: data.duration,
          difficulty: data.difficulty,
          days: data.days || [],
          goals: data.goals || [],
          requirements: data.requirements || [],
          createdAt: data.createdAt?.toDate() || new Date()
        };

        setTutorial(tutorialData);
      } catch (error) {
        console.error('Error fetching tutorial:', error);
        setError('Failed to load tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard/tutorials"
            className="text-primary-600 hover:text-primary-700"
          >
            ← Back to Tutorials
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Tutorial not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageNavigation
        title={tutorial.title}
        backUrl="/dashboard/tutorials"
        backLabel="Back to Tutorials"
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {tutorial.thumbnailUrl && (
          <div className="relative h-64 w-full">
            <Image
              src={tutorial.thumbnailUrl}
              alt={tutorial.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tutorial.title}</h1>
              <p className="mt-1 text-gray-500">by {tutorial.author}</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              tutorial.category === 'exercise'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {tutorial.category}
            </span>
          </div>

          <p className="mt-4 text-gray-600">{tutorial.description}</p>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Duration</p>
              <p className="mt-1 text-lg font-medium">{tutorial.duration} min</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Difficulty</p>
              <p className="mt-1 text-lg font-medium capitalize">{tutorial.difficulty}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Days</p>
              <p className="mt-1 text-lg font-medium">{tutorial.days.length}</p>
            </div>
          </div>

          {tutorial.goals && tutorial.goals.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Goals</h2>
              <ul className="mt-4 space-y-2">
                {tutorial.goals.map((goal, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-5 w-5 text-green-500">•</span>
                    <span className="ml-2 text-gray-600">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tutorial.requirements && tutorial.requirements.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Requirements</h2>
              <ul className="mt-4 space-y-2">
                {tutorial.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-5 w-5 text-blue-500">•</span>
                    <span className="ml-2 text-gray-600">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Daily Schedule</h2>
            <div className="mt-4 space-y-6">
              {tutorial.days.map((day) => (
                <div key={day.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Day {day.dayNumber}: {day.title}
                  </h3>
                  <p className="mt-2 text-gray-600">{day.description}</p>

                  <div className="mt-4 space-y-4">
                    {day.exercises.map((exercise) => (
                      <div key={exercise.id} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                        <p className="mt-1 text-sm text-gray-600">{exercise.description}</p>
                        {exercise.videoUrl && (
                          <div className="mt-2">
                            <video
                              controls
                              className="w-full rounded-lg"
                              src={exercise.videoUrl}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                        {exercise.instructions && exercise.instructions.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-900">Instructions</h5>
                            <ol className="mt-2 list-decimal list-inside space-y-1">
                              {exercise.instructions.map((instruction, idx) => (
                                <li key={idx} className="text-sm text-gray-600">{instruction}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{exercise.duration} min</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            exercise.difficulty === 'beginner'
                              ? 'bg-green-100 text-green-800'
                              : exercise.difficulty === 'intermediate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {exercise.difficulty}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
