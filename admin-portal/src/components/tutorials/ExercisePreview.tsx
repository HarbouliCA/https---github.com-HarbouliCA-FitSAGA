'use client';

import { useState } from 'react';
import { Exercise } from '@/interfaces/tutorial';
import VideoPlayer from './VideoPlayer';
import Image from 'next/image';

interface ExercisePreviewProps {
  exercise: Exercise;
}

export default function ExercisePreview({ exercise }: ExercisePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {isPlaying ? (
        <VideoPlayer 
          exercise={exercise} 
          onComplete={() => setIsPlaying(false)}
          autoplay={true}
        />
      ) : (
        <div className="relative">
          <div className="aspect-video bg-gray-100 relative">
            {exercise.thumbnailUrl ? (
              <Image
                src={exercise.thumbnailUrl}
                alt={exercise.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-400">No thumbnail</span>
              </div>
            )}
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-blue-500 ml-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-medium text-lg">{exercise.name}</h3>
        
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Sets:</span> {exercise.sets}
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Reps:</span> {exercise.repetitions}
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Rest between sets:</span> {formatTime(exercise.restTimeBetweenSets)}
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Rest after:</span> {formatTime(exercise.restTimeAfterExercise)}
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 flex justify-between">
          <span>{exercise.activity}</span>
          <span>{exercise.type}</span>
          <span>{exercise.bodyPart}</span>
        </div>
      </div>
    </div>
  );
} 