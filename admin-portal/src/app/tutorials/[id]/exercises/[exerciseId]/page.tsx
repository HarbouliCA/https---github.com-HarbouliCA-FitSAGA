'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import Link from 'next/link';
import { PencilIcon } from '@heroicons/react/24/outline';
import PageNavigation from '@/components/ui/PageNavigation';

type Exercise = {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  restTime: number;
  imageUrl?: string;
  videoUrl?: string;
};

export default function ExercisePage({ params }: { params: { id: string; exerciseId: string } }) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorialAndExercise = async () => {
      try {
        const tutorialDoc = await getDoc(doc(firestore as Firestore, 'tutorials', params.id));
        
        if (!tutorialDoc.exists()) {
          setError('Tutorial not found');
          setLoading(false);
          return;
        }
        
        const tutorialData = tutorialDoc.data();
        const tutorialWithId = {
          ...tutorialData,
          id: tutorialDoc.id,
          exercises: tutorialData.exercises || [],
          createdAt: tutorialData.createdAt?.toDate?.() || new Date(tutorialData.createdAt),
          updatedAt: tutorialData.updatedAt?.toDate?.() || new Date(tutorialData.updatedAt),
        } as Tutorial;
        
        setTutorial(tutorialWithId);
        
        // Find the exercise with the matching ID
        const foundExercise = tutorialWithId.exercises?.find(ex => ex.id === params.exerciseId);
        
        if (!foundExercise) {
          setError('Exercise not found');
          setLoading(false);
          return;
        }
        
        setExercise(foundExercise);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchTutorialAndExercise();
  }, [params.id, params.exerciseId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <Link href={`/tutorials/${params.id}`} className="text-red-700 font-medium hover:text-red-800 mt-2 inline-block">
            Back to Tutorial
          </Link>
        </div>
      </div>
    );
  }

  if (!tutorial || !exercise) return null;

  const actions = (
    <Link
      href={`/tutorials/${tutorial.id}/exercises/${exercise.id}/edit`}
      className="text-gray-400 hover:text-gray-600"
    >
      <PencilIcon className="h-5 w-5" />
    </Link>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <PageNavigation
          backUrl={`/tutorials/${tutorial.id}`}
          backLabel={`Back to ${tutorial.name}`}
          title={exercise.name}
          actions={actions}
        />

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6">
            <div className="prose prose-primary max-w-none mb-8">
              <p>{exercise.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Exercise Details</h2>
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Sets</span>
                    <span className="font-medium">{exercise.sets}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Reps</span>
                    <span className="font-medium">{exercise.reps}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Rest Time</span>
                    <span className="font-medium">{exercise.restTime} seconds</span>
                  </div>
                </div>
              </div>

              {exercise.imageUrl && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Reference Image</h2>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.name}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {exercise.videoUrl && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Demonstration Video</h2>
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    src={exercise.videoUrl}
                    title={`${exercise.name} demonstration`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
