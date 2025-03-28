'use client';

import { useState, useEffect, useRef } from 'react';
import { Exercise } from '@/interfaces/tutorial';

interface ExerciseTimerProps {
  exercise: Exercise;
  onComplete: () => void;
  isActive: boolean;
  isPaused?: boolean;
}

export default function ExerciseTimer({ exercise, onComplete, isActive, isPaused = false }: ExerciseTimerProps) {
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Handle timer logic
  useEffect(() => {
    if (!isActive || isPaused || isCompleted) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    if (isResting) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setRestTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              timerRef.current = null;
              
              // After rest, move to next rep or set
              if (currentSet === exercise.sets && currentRep === exercise.repetitions) {
                // Exercise completed
                setIsCompleted(true);
                setTimeout(() => onComplete(), 1000);
                return 0;
              } else if (currentRep === exercise.repetitions) {
                // Set completed, move to next set
                setCurrentSet(prev => prev + 1);
                setCurrentRep(1);
                setIsResting(false);
                return 0;
              } else {
                // Rep completed, move to next rep
                setCurrentRep(prev => prev + 1);
                setIsResting(false);
                return 0;
              }
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      // Not resting, so we're in active exercise mode
      // In a real app, you might want to add a timer for each rep too
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          // After completing a rep
          if (currentRep === exercise.repetitions) {
            // Set completed
            if (currentSet === exercise.sets) {
              // Final rest after last set
              setIsResting(true);
              setRestTimeRemaining(exercise.restTimeAfterExercise);
            } else {
              // Rest between sets
              setIsResting(true);
              setRestTimeRemaining(exercise.restTimeBetweenSets);
            }
          } else {
            // Move to next rep
            setCurrentRep(prev => prev + 1);
          }
          timerRef.current = null;
        }, 3000); // Assuming each rep takes about 3 seconds
      }
    }
  }, [isActive, isPaused, isResting, currentSet, currentRep, exercise, onComplete, isCompleted]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">{exercise.name}</h3>
        {isCompleted ? (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
            Completed
          </span>
        ) : (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
            {isResting ? 'Resting' : 'Active'}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-md text-center">
          <div className="text-sm text-gray-500">Set</div>
          <div className="text-xl font-bold">{currentSet} / {exercise.sets}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-md text-center">
          <div className="text-sm text-gray-500">Rep</div>
          <div className="text-xl font-bold">{currentRep} / {exercise.repetitions}</div>
        </div>
      </div>
      
      {isResting && (
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Rest Time Remaining</div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-500 h-4 rounded-full transition-all duration-1000"
              style={{ 
                width: `${isResting ? 
                  (restTimeRemaining / (currentSet === exercise.sets ? 
                    exercise.restTimeAfterExercise : exercise.restTimeBetweenSets)) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="text-right mt-1 text-sm">{formatTime(restTimeRemaining)}</div>
        </div>
      )}
      
      <div className="text-sm text-gray-500 mt-2">
        {isResting ? 
          (currentSet === exercise.sets && currentRep === exercise.repetitions ? 
            'Final rest before next exercise' : 
            'Rest before next set') : 
          'Complete the current rep'}
      </div>
    </div>
  );
} 