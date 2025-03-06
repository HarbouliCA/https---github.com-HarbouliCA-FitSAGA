'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, Firestore, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { ForumThread } from '@/types';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import PageNavigation from '@/components/ui/PageNavigation';
import { useAuth } from '@/context/AuthContext';

type FormData = Omit<ForumThread, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'authorId' | 'authorName' | 'replyCount' | 'lastActivity'>;

export default function CreateForumThreadPage() {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard/forum');
    }
  }, [isAdmin, router]);

  const onSubmit = async (data: FormData) => {
    if (!firestore || !user || !isAdmin) {
      setError('You must be an admin to create threads');
      return;
    }
    
    setSaving(true);
    try {
      const timestamp = serverTimestamp();
      const newThread = {
        ...data,
        authorId: user.uid,
        authorName: user.name,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastActivity: timestamp,
        status: 'open',
        replies: [],
        replyCount: 0,
        likes: 0
      };

      const docRef = await addDoc(collection(firestore as Firestore, 'forum_threads'), newThread);
      router.push(`/dashboard/forum/${docRef.id}`);
    } catch (error) {
      console.error('Error creating thread:', error);
      setError('Failed to create thread. Please make sure you have proper permissions.');
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageNavigation
        backUrl="/dashboard/forum"
        backLabel="Back to Forum"
        title="Create Thread"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

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
                  <option value="question">Question</option>
                  <option value="discussion">Discussion</option>
                  <option value="general">General</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
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
                {saving ? 'Creating...' : 'Create Thread'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
