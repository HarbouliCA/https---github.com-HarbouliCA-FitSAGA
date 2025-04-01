'use client';

import { useState, useEffect, useRef } from 'react';
import { Tutorial, Day } from '@/interfaces/tutorial';
import tutorialService from '@/services/tutorialService';
import DayManager from './DayManager';
import { useRouter } from 'next/navigation';
import azureStorageService from '@/services/azureStorageService';
import Image from 'next/image';

interface TutorialFormProps {
  tutorial?: Tutorial;
  authorId: string;
  authorName?: string;
}

export default function TutorialForm({ tutorial, authorId, authorName }: TutorialFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(tutorial?.title || '');
  const [description, setDescription] = useState(tutorial?.description || '');
  const [category, setCategory] = useState(tutorial?.category || '');
  const [difficulty, setDifficulty] = useState(tutorial?.difficulty || 'Beginner');
  const [days, setDays] = useState<Day[]>(tutorial?.days || []);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for image upload
  const [tutorialImage, setTutorialImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(tutorial?.imageUrl || null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Strength', 'Cardio', 'Flexibility', 'Balance', 'HIIT', 'Yoga', 'Pilates', 'Other'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  const handleAddDay = () => {
    const newDay: Day = {
      dayNumber: days.length + 1,
      title: `Day ${days.length + 1}`,
      description: '',
      exercises: []
    };
    
    setDays([...days, newDay]);
    setActiveDayIndex(days.length);
  };

  const handleUpdateDay = (updatedDay: Day, index: number) => {
    const updatedDays = [...days];
    updatedDays[index] = updatedDay;
    setDays(updatedDays);
  };

  const handleRemoveDay = (index: number) => {
    if (window.confirm('Are you sure you want to remove this day and all its exercises?')) {
      const updatedDays = days.filter((_, i) => i !== index).map((day, i) => ({
        ...day,
        dayNumber: i + 1
      }));
      
      setDays(updatedDays);
      
      if (activeDayIndex === index) {
        setActiveDayIndex(null);
      } else if (activeDayIndex !== null && activeDayIndex > index) {
        setActiveDayIndex(activeDayIndex - 1);
      }
    }
  };

  // Add image handling functions
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const fileType = file.type.toLowerCase();
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!validTypes.includes(fileType)) {
      setImageError('Please select a JPG, JPEG, or PNG image');
      return;
    }
    
    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setImageError('Image must be less than 2MB');
      return;
    }
    
    setTutorialImage(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveImage = () => {
    setTutorialImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setImageError(null);
    
    try {
      if (!title) throw new Error('Title is required');
      if (!category) throw new Error('Category is required');
      if (!difficulty) throw new Error('Difficulty is required');
      if (days.length === 0) throw new Error('At least one day is required');
      
      // Check if any day has no exercises
      const emptyDayIndex = days.findIndex(day => day.exercises.length === 0);
      if (emptyDayIndex !== -1) {
        throw new Error(`Day ${emptyDayIndex + 1} has no exercises`);
      }
      
      // Helper function to recursively remove undefined values
      const removeUndefined = (obj: any): any => {
        // If it's not an object, return as is if not undefined
        if (obj === undefined) return null;
        if (obj === null) return null;
        if (typeof obj !== 'object') return obj;
        
        // If it's an array, filter out undefined values and apply recursively
        if (Array.isArray(obj)) {
          return obj.map(item => removeUndefined(item));
        }
        
        // If it's an object, remove undefined properties and apply recursively
        const result: any = {};
        Object.keys(obj).forEach(key => {
          const value = removeUndefined(obj[key]);
          if (value !== undefined) {
            result[key] = value;
          }
        });
        return result;
      };
      
      // Sanitize data to remove any undefined values
      const sanitizeDays = days.map(day => ({
        // Only include id if it exists
        ...(day.id ? { id: day.id } : {}),
        dayNumber: day.dayNumber || 0,
        title: day.title || '',
        description: day.description || '',
        exercises: day.exercises.map(exercise => ({
          // Only include id if it exists
          ...(exercise.id ? { id: exercise.id } : {}),
          videoId: exercise.videoId || '',
          name: exercise.name || '',
          activity: exercise.activity || '',
          type: exercise.type || '',
          bodyPart: exercise.bodyPart || 'Unknown',
          repetitions: exercise.repetitions || 1,
          sets: exercise.sets || 1,
          restTimeBetweenSets: exercise.restTimeBetweenSets || 0,
          restTimeAfterExercise: exercise.restTimeAfterExercise || 0,
          thumbnailUrl: exercise.thumbnailUrl || ''
        }))
      }));
      
      let tutorialData: any = {
        title,
        description: description || '',
        category,
        difficulty,
        authorId: authorId || '',
        authorName: authorName || '',
        days: sanitizeDays
      };
      
      // Process image upload if we have a new image
      if (tutorialImage) {
        try {
          setImageLoading(true);
          
          // We need an ID for the tutorial to store the image
          // If it's a new tutorial, we'll use a temporary ID
          const tempId = tutorial?.id || `temp_${Date.now()}`;
          
          // Upload the image
          const imageUrl = await azureStorageService.uploadTutorialImage(tutorialImage, tempId);
          
          // Add the image URL to the tutorial data
          tutorialData.imageUrl = imageUrl;
          
          setImageLoading(false);
        } catch (imgErr: any) {
          setImageLoading(false);
          setImageError(imgErr.message || 'Failed to upload image');
          console.error('Image upload error:', imgErr);
          // Continue without the image
        }
      } else if (imagePreview && tutorial?.imageUrl) {
        // Keep the existing image URL if we didn't upload a new one
        tutorialData.imageUrl = tutorial.imageUrl;
      }
      
      // Final recursive clean to remove any nested undefined values
      tutorialData = removeUndefined(tutorialData);
      
      if (tutorial?.id) {
        await tutorialService.updateTutorial(tutorial.id, tutorialData);
      } else {
        await tutorialService.createTutorial(tutorialData);
      }
      
      router.push('/dashboard/tutorials');
    } catch (err: any) {
      setError(err.message || 'Failed to save tutorial');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tutorial Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Tutorial Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., 7-Day Full Body Workout"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* Add image upload section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tutorial Image
              </label>
              
              <div className="mt-1 flex flex-col space-y-4">
                {imagePreview && (
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Tutorial preview"
                      fill
                      className="object-cover"
                      priority
                    />
                    <button 
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {!imagePreview && (
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="tutorial-image"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="tutorial-image"
                            ref={fileInputRef}
                            name="tutorial-image"
                            type="file"
                            className="sr-only"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 2MB</p>
                    </div>
                  </div>
                )}
                
                {imageError && (
                  <p className="text-sm text-red-500">{imageError}</p>
                )}
                
                {imageLoading && (
                  <div className="flex items-center">
                    <div className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                    <span className="text-sm text-gray-500">Uploading image...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              >
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md min-h-[100px]"
                placeholder="Describe your tutorial..."
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Days Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Days ({days.length})</h2>
            <button
              type="button"
              onClick={handleAddDay}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Add Day
            </button>
          </div>
          
          {days.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
              No days added yet. Click "Add Day" to get started.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Day Tabs */}
              <div className="flex flex-wrap gap-2 border-b">
                {days.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`px-4 py-2 rounded-t-md ${
                      activeDayIndex === index
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => setActiveDayIndex(index)}
                  >
                    Day {day.dayNumber}
                    <span className="ml-2 text-xs">
                      ({day.exercises.length} exercises)
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Active Day Manager */}
              {activeDayIndex !== null && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveDay(activeDayIndex)}
                    className="absolute top-0 right-0 p-2 text-red-500 hover:text-red-700"
                  >
                    Remove Day
                  </button>
                  
                  <DayManager
                    day={days[activeDayIndex]}
                    onUpdate={(updatedDay) => handleUpdateDay(updatedDay, activeDayIndex)}
                  />
                </div>
              )}
              
              {activeDayIndex === null && days.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  Select a day tab above to manage its exercises.
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Error and Submit */}
        <div className="flex flex-col items-end space-y-4">
          {error && (
            <div className="w-full p-4 bg-red-50 text-red-500 rounded-md">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : tutorial?.id ? 'Update Tutorial' : 'Create Tutorial'}
          </button>
        </div>
      </form>
    </div>
  );
} 