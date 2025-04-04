'use client';

import { useState, useEffect } from 'react';
import { Tutorial, Day, Exercise } from '@/interfaces/tutorial';

interface TutorialProgressProps {
  tutorial: Tutorial;
  currentDayIndex: number;
  currentExerciseIndex: number;
  onDayChange: (dayIndex: number) => void;
  onExerciseChange: (exerciseIndex: number) => void;
}

export default function TutorialProgress({ 
  tutorial, 
  currentDayIndex, 
  currentExerciseIndex, 
  onDayChange, 
  onExerciseChange 
}: TutorialProgressProps) {
  const [progress, setProgress] = useState(0);
  
  // Calculate overall progress
  useEffect(() => {
    const totalExercises = tutorial.days.reduce((total, day) => total + day.exercises.length, 0);
    
    let completedExercises = 0;
    for (let i = 0; i < tutorial.days.length; i++) {
      if (i < currentDayIndex) {
        // Previous days are complete
        completedExercises += tutorial.days[i].exercises.length;
      } else if (i === currentDayIndex) {
        // Current day - count completed exercises
        completedExercises += currentExerciseIndex;
      }
    }
    
    const calculatedProgress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
    setProgress(calculatedProgress);
  }, [tutorial, currentDayIndex, currentExerciseIndex]);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-lg">Tutorial Progress</h3>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm font-semibold">{Math.round(progress)}% Complete</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div 
          className="bg-blue-500 h-3 rounded-full transition-all duration-500 relative"
          style={{ width: `${progress}%` }}
        >
          {progress > 10 && (
            <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-white text-[10px] font-bold">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
        {tutorial.days.map((day, dayIndex) => (
          <div key={dayIndex} className="border-l-4 pl-3 py-1 mb-3" 
               style={{ borderColor: dayIndex === currentDayIndex ? '#3b82f6' : 
                        dayIndex < currentDayIndex ? '#10b981' : '#e5e7eb' }}>
            <div 
              className={`flex justify-between items-center cursor-pointer p-2 rounded ${
                dayIndex === currentDayIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => onDayChange(dayIndex)}
            >
              <div className="font-medium">Day {day.dayNumber}: {day.title}</div>
              <div className="text-sm">
                {dayIndex < currentDayIndex ? (
                  <span className="text-green-500 font-semibold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Completed
                  </span>
                ) : dayIndex === currentDayIndex ? (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                    In Progress
                  </span>
                ) : (
                  <span className="text-gray-400">Upcoming</span>
                )}
              </div>
            </div>
            
            {dayIndex === currentDayIndex && (
              <div className="ml-4 mt-2 space-y-2">
                {day.exercises.map((exercise, exerciseIndex) => (
                  <div 
                    key={exerciseIndex}
                    className={`flex justify-between items-center p-2 rounded cursor-pointer ${
                      exerciseIndex === currentExerciseIndex ? 'bg-blue-100 border-l-2 border-blue-500 pl-3' : 
                      exerciseIndex < currentExerciseIndex ? 'bg-green-50 border-l-2 border-green-500 pl-3' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onExerciseChange(exerciseIndex)}
                  >
                    <div className="flex items-center">
                      <span className={`mr-2 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        exerciseIndex === currentExerciseIndex ? 'bg-blue-500 text-white' :
                        exerciseIndex < currentExerciseIndex ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}>{exerciseIndex + 1}</span>
                      <span className={exerciseIndex < currentExerciseIndex ? 'text-gray-500' : ''}>{exercise.name}</span>
                    </div>
                    {exerciseIndex < currentExerciseIndex && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 