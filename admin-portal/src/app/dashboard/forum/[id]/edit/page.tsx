'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { ForumThread } from '@/types';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import PageNavigation from '@/components/ui/PageNavigation';

type FormData = Omit<ForumThread, 'id'>;

export default function EditForumThreadPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    const fetchThread = async () => {
      if (!firestore) return;

      try {
        const threadDoc = await getDoc(doc(firestore as Firestore, 'forum_threads', params.id));
        
        if (!threadDoc.exists()) {
          setError('Thread not found');
          setLoading(false);
          return;
        }

        const data = threadDoc.data();
        reset({
          ...data,
          createdAt: data.createdAt?.toDate()
        } as FormData);
      } catch (error) {
        console.error('Error fetching thread:', error);
        setError('Failed to load thread');
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [params.id, reset]);

  const onSubmit = async (data: FormData) => {
    if (!firestore) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(firestore as Firestore, 'forum_threads', params.id), data);
      router.push(`/dashboard/forum/${params.id}`);
    } catch (error) {
      console.error('Error updating thread:', error);
      setError('Failed to update thread');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/dashboard/forum')}
            className="text-red-700 font-medium hover:text-red-800 mt-2"
          >
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageNavigation
        backUrl={`/dashboard/forum/${params.id}`}
        backLabel="Back to Thread"
        title="Edit Thread"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select category</option>
                  <option value="general">General</option>
                  <option value="exercise">Exercise</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="wellness">Wellness</option>
                  <option value="equipment">Equipment</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  {...register('status', { required: 'Status is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                {...register('content', { required: 'Content is required' })}
                rows={8}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
