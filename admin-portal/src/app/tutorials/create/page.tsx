'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ui/ImageUploader';

type FormValues = {
  name: string;
  section: 'musculation' | 'diete';
  description: string;
};

export default function CreateTutorialPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const router = useRouter();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    setError('');

    try {
      if (!firestore) {
        throw new Error('Firebase services not initialized');
      }
      
      // Create tutorial in Firestore
      const tutorialData = {
        name: data.name,
        section: data.section,
        description: data.description,
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Initialize empty arrays for both exercises and diet plans
        exercises: data.section === 'musculation' ? [] : [],
        dietPlans: data.section === 'diete' ? [] : []
      };
      
      const docRef = await addDoc(collection(firestore as Firestore, 'tutorials'), tutorialData);
      
      router.push(`/tutorials/${docRef.id}`);
      
    } catch (error: any) {
      console.error('Error creating tutorial:', error);
      setError(error.message || 'Failed to create tutorial');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
  };

  const handleImageError = (errorMessage: string) => {
    setError(`Image upload error: ${errorMessage}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Tutorial</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Tutorial Name
            </label>
            <input
              id="name"
              type="text"
              {...register('name', { required: 'Tutorial name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter tutorial name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="section">
              Section
            </label>
            <select
              id="section"
              {...register('section', { required: 'Section is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a section</option>
              <option value="musculation">Musculation</option>
              <option value="diete">Diete</option>
            </select>
            {errors.section && (
              <p className="text-red-500 text-xs mt-1">{errors.section.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              placeholder="Enter tutorial description"
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
              Tutorial Image
            </label>
            <ImageUploader 
              folder="tutorials"
              onImageUploaded={handleImageUploaded}
              onError={handleImageError}
            />
            <p className="text-gray-500 text-xs mt-1">
              Upload an image for the tutorial (optional). Recommended size: 800x600 pixels.
            </p>
            {imageUrl && (
              <div className="mt-2">
                <p className="text-green-500 text-xs">Image uploaded successfully!</p>
                <img 
                  src={imageUrl} 
                  alt="Tutorial preview" 
                  className="mt-2 h-40 w-auto object-cover rounded"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
            >
              {isSubmitting ? 'Creating...' : 'Create Tutorial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
