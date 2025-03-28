'use client';

import { useState } from 'react';
import { Tutorial, Day } from '@/interfaces/tutorial';
import ExercisePreview from './ExercisePreview';
import tutorialService from '@/services/tutorialService';

interface TutorialPreviewProps {
  tutorial: Tutorial;
}

export default function TutorialPreview({ tutorial }: TutorialPreviewProps) {
  const [activeDay, setActiveDay] = useState<number>(0);

  const calculateTotalExercises = (): number => {
    return tutorial.days.reduce((total, day) => total + day.exercises.length, 0);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">{tutorial.title}</h1>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
            {tutorial.category}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
            {tutorial.difficulty}
          </span>
        </div>
        
        <p className="mt-4 text-gray-600">
          {tutorial.description || 'No description provided.'}
        </p>
        
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <div>
            <span className="font-medium">{tutorial.days.length}</span> days
          </div>
          <div>
            <span className="font-medium">{calculateTotalExercises()}</span> exercises
          </div>
          <div>
            <span className="font-medium">{formatDuration(tutorialService.calculateTotalDuration(tutorial))}</span> total duration
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex flex-wrap gap-2 border-b mb-6">
          {tutorial.days.map((day, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-t-md ${
                activeDay === index
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setActiveDay(index)}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>
        
        {tutorial.days.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                Day {tutorial.days[activeDay].dayNumber}: {tutorial.days[activeDay].title}
              </h2>
              {tutorial.days[activeDay].description && (
                <p className="mt-2 text-gray-600">
                  {tutorial.days[activeDay].description}
                </p>
              )}
            </div>
            
            <div className="space-y-6">
              {tutorial.days[activeDay].exercises.map((exercise, index) => (
                <div key={index}>
                  <div className="mb-2 font-medium text-gray-500">
                    Exercise {index + 1}
                  </div>
                  <ExercisePreview exercise={exercise} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 