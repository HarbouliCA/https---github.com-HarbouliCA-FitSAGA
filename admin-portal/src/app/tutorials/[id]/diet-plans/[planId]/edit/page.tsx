'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type DietPlan = {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function EditDietPlanPage({ params }: { params: { id: string; planId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    imageUrl: '',
  });

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
        setFormData({
          title: plan.title || '',
          description: plan.description || '',
          content: plan.content || '',
          imageUrl: plan.imageUrl || '',
        });
      } catch (error) {
        console.error('Error fetching diet plan:', error);
        setError('Failed to load diet plan');
      } finally {
        setLoading(false);
      }
    };

    fetchDietPlan();
  }, [params.id, params.planId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dietPlan) return;

    try {
      setSaving(true);
      const tutorialRef = doc(firestore as Firestore, 'tutorials', params.id);
      const tutorialDoc = await getDoc(tutorialRef);
      
      if (!tutorialDoc.exists()) {
        setError('Tutorial not found');
        return;
      }

      const tutorialData = tutorialDoc.data();
      const dietPlans = tutorialData.dietPlans || [];
      const planIndex = dietPlans.findIndex((p: DietPlan) => p.id === params.planId);
      
      if (planIndex === -1) {
        setError('Diet plan not found');
        return;
      }

      // Update the diet plan
      const updatedPlan = {
        ...dietPlans[planIndex],
        title: formData.title,
        description: formData.description,
        content: formData.content,
        imageUrl: formData.imageUrl || null,
        updatedAt: new Date().toISOString(),
      };

      dietPlans[planIndex] = updatedPlan;

      await updateDoc(tutorialRef, {
        dietPlans,
      });

      router.push(`/tutorials/${params.id}/diet-plans/${params.planId}`);
    } catch (error) {
      console.error('Error updating diet plan:', error);
      setError('Failed to update diet plan');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/tutorials/${params.id}/diet-plans/${params.planId}`}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Diet Plan
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Diet Plan</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <input
                  type="text"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="max-h-40 rounded-md"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x150?text=Invalid+Image+URL';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <RichTextEditor
                  content={formData.content}
                  onChange={handleContentChange}
                  className="min-h-[300px]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href={`/tutorials/${params.id}/diet-plans/${params.planId}`}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
