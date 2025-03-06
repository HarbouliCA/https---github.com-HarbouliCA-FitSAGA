'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ImageUploader from '@/components/ui/ImageUploader';

type FormValues = {
  name: string;
  section: 'musculation' | 'diete';
  description: string;
};

export default function EditTutorialPage({ params }: { params: { id: string } }) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined' || !firestore) return;
    
    const fetchTutorial = async () => {
      setIsSubmitting(true);
      try {
        const tutorialDoc = await getDoc(doc(firestore as Firestore, 'tutorials', params.id));
        
        if (!tutorialDoc.exists()) {
          setError('Tutorial not found');
          return;
        }
        
        const data = tutorialDoc.data();
        const tutorialData = {
          ...data,
          id: tutorialDoc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Tutorial;
        
        setTutorial(tutorialData);
        setCurrentImageUrl(tutorialData.imageUrl || '');
        
        // Set form values
        setValue('name', tutorialData.name);
        setValue('section', tutorialData.section);
        setValue('description', tutorialData.description);
        
      } catch (error: any) {
        console.error('Error fetching tutorial:', error);
        setError(error.message || 'Failed to fetch tutorial');
      } finally {
        setIsSubmitting(false);
      }
    };
    
    fetchTutorial();
  }, [params.id, setValue]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    setError('');

    try {
      if (!firestore) {
        throw new Error('Firebase services not initialized');
      }

      // Update tutorial in Firestore
      const tutorialRef = doc(firestore as Firestore, 'tutorials', params.id);
      await updateDoc(tutorialRef, {
        name: data.name,
        section: data.section,
        description: data.description,
        imageUrl: currentImageUrl || null,
        updatedAt: new Date()
      });
      
      router.push(`/tutorials/${params.id}`);
      
    } catch (error: any) {
      console.error('Error updating tutorial:', error);
      setError(error.message || 'Failed to update tutorial');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUploaded = (url: string) => {
    setCurrentImageUrl(url);
  };

  const handleImageError = (errorMessage: string) => {
    setError(`Image upload error: ${errorMessage}`);
  };

  if (!tutorial && !error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/tutorials/${params.id}`} className="text-primary-600 hover:text-primary-700 flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Tutorial
        </Link>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Tutorial</h1>
        
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
              disabled={tutorial?.exercises?.length || tutorial?.dietPlans?.length ? true : false}
            >
              <option value="musculation">Musculation</option>
              <option value="diete">Diete</option>
            </select>
            {errors.section && (
              <p className="text-red-500 text-xs mt-1">{errors.section.message}</p>
            )}
            {(tutorial?.exercises?.length || tutorial?.dietPlans?.length) && (
              <p className="text-gray-500 text-xs mt-1">
                Section cannot be changed because this tutorial already has {tutorial.section === 'musculation' ? 'exercises' : 'diet plans'}.
              </p>
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
              Upload a new image for the tutorial (optional). Recommended size: 800x600 pixels.
            </p>
            {currentImageUrl && (
              <div className="mt-2">
                <p className="text-green-500 text-xs">Current image:</p>
                <img 
                  src={currentImageUrl} 
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
