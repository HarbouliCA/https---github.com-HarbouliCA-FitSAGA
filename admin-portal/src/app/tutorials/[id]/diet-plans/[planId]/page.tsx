'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';

type DietPlan = {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function DietPlanPage({ params }: { params: { id: string; planId: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);

  useEffect(() => {
    const fetchDietPlan = async () => {
      try {
        const tutorialDoc = await getDoc(doc(firestore as Firestore, 'tutorials', params.id));
        if (!tutorialDoc.exists()) {
          setError('Tutorial not found');
          return;
        }

        const data = tutorialDoc.data();
        const plan = data.dietPlans?.find((p: DietPlan) => p.id === params.planId);
        
        if (!plan) {
          setError('Diet plan not found');
          return;
        }

        setDietPlan(plan);
      } catch (error) {
        console.error('Error fetching diet plan:', error);
        setError('Failed to load diet plan');
      } finally {
        setLoading(false);
      }
    };

    fetchDietPlan();
  }, [params.id, params.planId]);

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
          <Link href={`/tutorials/${params.id}/diet-plans`} className="text-primary-600 hover:text-primary-700">
            Back to Diet Plans
          </Link>
        </div>
      </div>
    );
  }

  if (!dietPlan) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/tutorials/${params.id}/diet-plans`}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Diet Plans
          </Link>
        </div>

        <article className="space-y-8">
          {/* Header */}
          <header>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{dietPlan.title}</h1>
              <Link
                href={`/tutorials/${params.id}/diet-plans/${params.planId}/edit`}
                className="text-gray-400 hover:text-gray-600"
              >
                <PencilIcon className="h-5 w-5" />
              </Link>
            </div>
            <p className="text-lg text-gray-600">{dietPlan.description}</p>
            {dietPlan.imageUrl && (
              <div className="mt-6 rounded-lg overflow-hidden">
                <img
                  src={dietPlan.imageUrl}
                  alt={dietPlan.title}
                  className="w-full h-auto"
                />
              </div>
            )}
          </header>

          {/* Content */}
          <div className="prose prose-primary max-w-none">
            <div dangerouslySetInnerHTML={{ __html: dietPlan.content }} />
          </div>

          {/* Footer */}
          <footer className="text-sm text-gray-500 pt-4 border-t">
            <p>Last updated: {new Date(dietPlan.updatedAt).toLocaleDateString()}</p>
          </footer>
        </article>
      </div>
    </div>
  );
}
