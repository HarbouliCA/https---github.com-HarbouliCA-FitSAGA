'use client';

import { useState } from 'react';
import { collection, addDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial, TutorialDay, Exercise } from '@/types';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import PageNavigation from '@/components/ui/PageNavigation';
import Image from 'next/image';
import { CloudArrowUpIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';

type FormData = Omit<Tutorial, 'id' | 'createdAt'>;

export default function CreateTutorialPage() {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const router = useRouter();
  
  const { register, handleSubmit, control, formState: { errors }, watch, setValue, getValues } = useForm<FormData>({
    defaultValues: {
      title: '',
      category: 'exercise',
      description: '',
      author: '',
      duration: 0,
      difficulty: 'beginner',
      days: [{
        id: uuidv4(),
        dayNumber: 1,
        title: '',
        description: '',
        exercises: []
      }],
      goals: [''],
      requirements: ['']
    }
  });

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

  const handleExerciseVideoChange = async (event: React.ChangeEvent<HTMLInputElement>, dayIndex: number, exerciseIndex: number) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Upload to Azure Blob Storage
      console.log('Video file selected:', file.name);
    }
  };

  const handleGoalChange = (index: number, value: string) => {
    const goals = [...(watch('goals') || [])];
    goals[index] = value;
    setValue('goals', goals, { shouldValidate: true });
  };

  const handleRequirementChange = (index: number, value: string) => {
    const requirements = [...(watch('requirements') || [])];
    requirements[index] = value;
    setValue('requirements', requirements, { shouldValidate: true });
  };

  const addExercise = (dayIndex: number) => {
    const days = getValues('days') || [];
    const newExercise: Exercise = {
      id: uuidv4(),
      name: '',
      description: '',
      instructions: [],
      videoUrl: '',
      duration: 0,
      difficulty: 'beginner'
    };
    
    const updatedDays = [...days];
    if (!updatedDays[dayIndex].exercises) {
      updatedDays[dayIndex].exercises = [];
    }
    updatedDays[dayIndex].exercises.push(newExercise);
    setValue('days', updatedDays, { shouldValidate: true });
  };

  const addDay = () => {
    const days = getValues('days') || [];
    const newDay: TutorialDay = {
      id: uuidv4(),
      dayNumber: days.length + 1,
      title: '',
      description: '',
      exercises: []
    };
    setValue('days', [...days, newDay], { shouldValidate: true });
  };

  const removeDay = (dayIndex: number) => {
    const days = getValues('days') || [];
    const updatedDays = days.filter((_, index) => index !== dayIndex).map((day, index) => ({
      ...day,
      dayNumber: index + 1
    }));
    setValue('days', updatedDays, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    if (!firestore) return;
    
    setSaving(true);
    try {
      // TODO: Upload thumbnail and videos to Azure Blob Storage
      const newTutorial = {
        ...data,
        createdAt: new Date(),
        thumbnailUrl: thumbnailPreview ? 'placeholder-thumbnail-url' : null,
      };

      const docRef = await addDoc(collection(firestore as Firestore, 'tutorials'), newTutorial);
      router.push(`/dashboard/tutorials/${docRef.id}`);
    } catch (error) {
      console.error('Error creating tutorial:', error);
      setError('Failed to create tutorial');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageNavigation
        backUrl="/dashboard/tutorials"
        backLabel="Back to Tutorials"
        title="Create Tutorial"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
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
              </div>
            </div>

            {/* Goals */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Goals</h2>
              <div className="space-y-4">
                {(watch('goals') || []).map((goal, index) => (
                  <div key={index} className="flex gap-4">
                    <input
                      {...register(`goals.${index}` as const)}
                      placeholder="Enter a goal"
                      className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setValue(`goals.${index}`, '', { shouldValidate: true })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setValue('goals', [...(watch('goals') || []), ''], { shouldValidate: true })}
                  className="flex items-center text-primary-600 hover:text-primary-700"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Goal
                </button>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Requirements</h2>
              <div className="space-y-4">
                {(watch('requirements') || []).map((requirement, index) => (
                  <div key={index} className="flex gap-4">
                    <input
                      {...register(`requirements.${index}` as const)}
                      placeholder="Enter a requirement"
                      className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setValue(`requirements.${index}`, '', { shouldValidate: true })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setValue('requirements', [...(watch('requirements') || []), ''], { shouldValidate: true })}
                  className="flex items-center text-primary-600 hover:text-primary-700"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Requirement
                </button>
              </div>
            </div>

            {/* Days */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tutorial Days</h2>
              <div className="space-y-6">
                {(watch('days') || []).map((day, dayIndex) => (
                  <div key={day.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-md font-medium">Day {dayIndex + 1}</h3>
                      {dayIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => removeDay(dayIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                          {...register(`days.${dayIndex}.title` as const, { required: 'Day title is required' })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          {...register(`days.${dayIndex}.description` as const)}
                          rows={2}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>

                      {/* Exercises */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Exercises</label>
                        <div className="space-y-4">
                          {(day.exercises || []).map((exercise: Exercise, exerciseIndex: number) => (
                            <div key={exerciseIndex} className="border border-gray-200 rounded p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Exercise Name</label>
                                  <input
                                    {...register(`days.${dayIndex}.exercises.${exerciseIndex}.name` as const)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Video</label>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleExerciseVideoChange(e, dayIndex, exerciseIndex)}
                                    className="mt-1 block w-full text-sm text-gray-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-primary-50 file:text-primary-700
                                      hover:file:bg-primary-100"
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700">Instructions</label>
                                  <textarea
                                    {...register(`days.${dayIndex}.exercises.${exerciseIndex}.instructions` as const)}
                                    rows={2}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addExercise(dayIndex)}
                            className="flex items-center text-primary-600 hover:text-primary-700"
                          >
                            <PlusIcon className="h-5 w-5 mr-1" />
                            Add Exercise
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addDay()}
                  className="flex items-center text-primary-600 hover:text-primary-700"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Day
                </button>
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
                {saving ? 'Creating...' : 'Create Tutorial'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
