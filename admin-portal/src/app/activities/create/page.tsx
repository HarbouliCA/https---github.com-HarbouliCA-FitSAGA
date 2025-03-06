'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { firestore, storage } from '@/lib/firebase';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type FormInputs = {
  name: string;
  description: string;
  type: 'kingboxing' | 'yoga' | 'musculation' | 'free_access' | 'other';
  creditValue: number;
  image: FileList;
};

export default function CreateActivityPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormInputs>({
    defaultValues: {
      type: 'other',
      creditValue: 1,
    }
  });
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      if (!firestore || !storage) {
        throw new Error('Firebase services not initialized');
      }

      let imageUrl = '';
      
      // Upload image if selected
      if (data.image && data.image.length > 0) {
        const file = data.image[0];
        const storageRef = ref(storage as FirebaseStorage, `activities/${file.name}-${Date.now()}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Create activity in Firestore
      const activityData = {
        name: data.name,
        description: data.description,
        type: data.type,
        creditValue: Number(data.creditValue),
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(firestore as Firestore, 'activities'), activityData);
      
      router.push('/activities');
      
    } catch (error: any) {
      console.error('Error creating activity:', error);
      setError(error.message || 'Failed to create activity');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/activities" className="text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="page-title">Create New Activity</h1>
      </div>
      
      <div className="card max-w-3xl">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="form-label">Activity Name</label>
              <input
                id="name"
                type="text"
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                {...register('name', { required: 'Activity name is required' })}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                rows={4}
                className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                {...register('description', { required: 'Description is required' })}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="type" className="form-label">Activity Type</label>
              <select
                id="type"
                className="input-field"
                {...register('type')}
              >
                <option value="kingboxing">Kingboxing</option>
                <option value="yoga">Yoga</option>
                <option value="musculation">Musculation</option>
                <option value="free_access">Free Access</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="creditValue" className="form-label">Credit Value</label>
              <input
                id="creditValue"
                type="number"
                className={`input-field ${errors.creditValue ? 'border-red-500' : ''}`}
                {...register('creditValue', { 
                  required: 'Credit value is required',
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: 'Credit value must be at least 1'
                  }
                })}
              />
              {errors.creditValue && (
                <p className="mt-1 text-sm text-red-600">{errors.creditValue.message}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label">Activity Image</label>
              <div className="mt-1 flex items-center">
                <div className="flex-shrink-0 h-32 w-32 border-2 border-dashed border-gray-300 rounded-md overflow-hidden bg-gray-100">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="ml-5">
                  <label
                    htmlFor="image-upload"
                    className="btn-outline cursor-pointer"
                  >
                    <span>Upload Image</span>
                    <input
                      id="image-upload"
                      name="image"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link href="/activities" className="btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
