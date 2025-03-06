'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

type DietPlan = {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function DietPlansPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);

  useEffect(() => {
    const fetchTutorial = async () => {
      try {
        const tutorialDoc = await getDoc(doc(firestore as Firestore, 'tutorials', params.id));
        if (!tutorialDoc.exists()) {
          setError('Tutorial not found');
          return;
        }

        const data = tutorialDoc.data();
        setTutorial({ ...data, id: tutorialDoc.id } as Tutorial);
        setDietPlans(data.dietPlans || []);
      } catch (error) {
        console.error('Error fetching tutorial:', error);
        setError('Failed to load tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [params.id]);

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
        <div className="error-message">
          <p>{error}</p>
          <Link href="/tutorials" className="text-primary-600 hover:text-primary-700">
            Back to Tutorials
          </Link>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link
              href={`/tutorials/${params.id}`}
              className="text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Diet Plans</h1>
          </div>
          <Link
            href={`/tutorials/${params.id}/diet-plans/add`}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Diet Plan
          </Link>
        </div>

        {dietPlans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No diet plans yet</p>
            <Link
              href={`/tutorials/${params.id}/diet-plans/add`}
              className="text-primary-600 hover:text-primary-700"
            >
              Create your first diet plan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dietPlans.map((plan) => (
              <Link
                key={plan.id}
                href={`/tutorials/${params.id}/diet-plans/${plan.id}`}
                className="block group"
              >
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 transition-shadow hover:shadow-md">
                  {plan.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={plan.imageUrl}
                        alt={plan.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-primary-600">
                      {plan.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {plan.description}
                    </p>
                    <div className="mt-4 text-xs text-gray-500">
                      Updated {new Date(plan.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
