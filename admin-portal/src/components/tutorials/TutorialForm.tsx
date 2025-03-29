'use client';

import { useState, useEffect } from 'react';
import { Tutorial, Day } from '@/interfaces/tutorial';
import tutorialService from '@/services/tutorialService';
import DayManager from './DayManager';
import { useRouter } from 'next/navigation';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Describe the tutorial..."
              />
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