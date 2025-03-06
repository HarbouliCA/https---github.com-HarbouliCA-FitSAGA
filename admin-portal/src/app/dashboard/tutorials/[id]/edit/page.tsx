'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import PageNavigation from '@/components/ui/PageNavigation';
import Image from 'next/image';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

type FormData = Omit<Tutorial, 'id'>;

export default function EditTutorialPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!firestore) return;

      try {
        const tutorialDoc = await getDoc(doc(firestore as Firestore, 'tutorials', params.id));
        
        if (!tutorialDoc.exists()) {
          setError('Tutorial not found');
          setLoading(false);
          return;
        }

        const data = tutorialDoc.data();
        setCurrentThumbnailUrl(data.thumbnailUrl);
        setCurrentVideoUrl(data.videoUrl);
        reset({
          ...data,
          createdAt: data.createdAt?.toDate()
        } as FormData);
      } catch (error) {
        console.error('Error fetching tutorial:', error);
        setError('Failed to load tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [params.id, reset]);

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!firestore) return;
    
    setSaving(true);
    try {
      // TODO: Upload new thumbnail and video to Azure Blob Storage if changed
      const updatedTutorial = {
        ...data,
        duration: Number(data.duration),
        thumbnailUrl: thumbnailPreview ? 'placeholder-new-thumbnail-url' : currentThumbnailUrl,
        videoUrl: videoFile ? 'placeholder-new-video-url' : currentVideoUrl
      };

      await updateDoc(doc(firestore as Firestore, 'tutorials', params.id), updatedTutorial);
      router.push(`/dashboard/tutorials/${params.id}`);
    } catch (error) {
      console.error('Error updating tutorial:', error);
      setError('Failed to update tutorial');
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
            onClick={() => router.push('/dashboard/tutorials')}
            className="text-red-700 font-medium hover:text-red-800 mt-2"
          >
            Back to Tutorials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageNavigation
        backUrl={`/dashboard/tutorials/${params.id}`}
        backLabel="Back to Tutorial"
        title="Edit Tutorial"
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
                <label className="block text-sm font-medium text-gray-700">Author</label>
                <input
                  type="text"
                  {...register('author', { required: 'Author is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                <input
                  type="number"
                  {...register('duration', { 
                    required: 'Duration is required',
                    min: { value: 1, message: 'Duration must be at least 1 minute' }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                <select
                  {...register('difficulty', { required: 'Difficulty is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                {errors.difficulty && (
                  <p className="mt-1 text-sm text-red-600">{errors.difficulty.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Days</label>
              {/* TODO: Add dynamic form fields for tutorial days */}
              <div className="mt-2 text-sm text-gray-500">
                Days and exercises can be managed in the tutorial detail page after creating the tutorial.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Image</label>
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {thumbnailPreview ? (
                      <div className="relative w-full h-48">
                        <Image
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ) : currentThumbnailUrl ? (
                      <div className="relative w-full h-48">
                        <Image
                          src={currentThumbnailUrl}
                          alt="Current thumbnail"
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ) : (
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tutorial Video</label>
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {videoFile ? (
                      <div className="text-sm text-gray-900 font-medium">
                        Selected: {videoFile.name}
                      </div>
                    ) : currentVideoUrl ? (
                      <div className="text-sm text-gray-900 font-medium">
                        Current video: {currentVideoUrl.split('/').pop()}
                      </div>
                    ) : (
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">MP4, WebM up to 100MB</p>
                  </div>
                </div>
              </div>
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
