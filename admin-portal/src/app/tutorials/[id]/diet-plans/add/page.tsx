'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ImageUploader from '@/components/ui/ImageUploader';
import RichTextEditor from '@/components/ui/RichTextEditor';

type DietPlan = {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function AddDietPlanPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchTutorial = async () => {
      try {
        const tutorialDoc = await getDoc(doc(firestore as Firestore, 'tutorials', params.id));
        if (!tutorialDoc.exists()) {
          setError('Tutorial not found');
          return;
        }
        setTutorial({ ...tutorialDoc.data(), id: tutorialDoc.id } as Tutorial);
      } catch (error) {
        console.error('Error fetching tutorial:', error);
        setError('Failed to load tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (!title.trim()) {
        throw new Error('Title is required');
      }

      if (!description.trim()) {
        throw new Error('Description is required');
      }

      if (!content.trim()) {
        throw new Error('Content is required');
      }

      // Create the diet plan with proper types
      const dietPlan: DietPlan = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        imageUrl: imageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update the tutorial with the new diet plan
      await updateDoc(doc(firestore as Firestore, 'tutorials', params.id), {
        dietPlans: arrayUnion({
          ...dietPlan,
          createdAt: dietPlan.createdAt.toISOString(),
          updatedAt: dietPlan.updatedAt.toISOString(),
        }),
        updatedAt: new Date(),
      });

      // Redirect to the diet plans list page
      router.push(`/tutorials/${params.id}/diet-plans/list`);
    } catch (error) {
      console.error('Error saving diet plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to save diet plan');
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
        <div className="flex items-center mb-6">
          <Link
            href={`/tutorials/${params.id}/diet-plans`}
            className="text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add Diet Plan</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="form-label">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="form-label">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="form-input"
              required
            />
          </div>

          <div>
            <label htmlFor="image" className="form-label">
              Cover Image
            </label>
            <ImageUploader
              folder={`tutorials/${params.id}/diet-plans`}
              onImageUploaded={setImageUrl}
              onError={(error) => setError(error)}
              currentImageUrl={imageUrl}
            />
          </div>

          <div>
            <label htmlFor="content" className="form-label">
              Content *
            </label>
            <RichTextEditor
              content={content}
              onChange={(html) => setContent(html || '')}
              className="min-h-[400px]"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href={`/tutorials/${params.id}/diet-plans`}
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className={`btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Saving...' : 'Save Diet Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
