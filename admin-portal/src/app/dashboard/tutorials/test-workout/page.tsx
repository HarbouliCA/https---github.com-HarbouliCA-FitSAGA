'use client';

import { useState } from 'react';
import VideoPlayer from '@/components/tutorials/VideoPlayer';
import { Exercise } from '@/interfaces/tutorial';

export default function TestWorkoutPage() {
  const [exerciseConfig, setExerciseConfig] = useState<Exercise>({
    id: 'test-exercise',
    videoId: '10011090_18687781_2023_cw003.mp4',
    name: 'Test Exercise',
    activity: 'Jumping Jacks',
    type: 'Cardio',
    bodyPart: 'Full Body',
    repetitions: 10,
    sets: 3,
    restTimeBetweenSets: 30,
    restTimeAfterExercise: 60,
    thumbnailUrl: ''
  });

  const handleConfigChange = (field: keyof Exercise, value: string | number) => {
    setExerciseConfig(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Test Workout Mode</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <VideoPlayer
            exercise={exerciseConfig}
            onComplete={() => console.log('Exercise completed!')}
            autoplay={false}
          />

          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Instructions</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Click "Start Workout" to begin the workout session</li>
              <li>The video will play {exerciseConfig.repetitions} times for each rep</li>
              <li>After all reps are completed, a rest timer of {exerciseConfig.restTimeBetweenSets}s will start</li>
              <li>The workout will continue for {exerciseConfig.sets} sets</li>
              <li>After the final set, a {exerciseConfig.restTimeAfterExercise}s rest timer will appear</li>
              <li>You can stop the workout at any time with the "Stop Workout" button</li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Exercise Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video ID
              </label>
              <input
                type="text"
                value={exerciseConfig.videoId}
                onChange={(e) => handleConfigChange('videoId', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exercise Name
              </label>
              <input
                type="text"
                value={exerciseConfig.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repetitions
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={exerciseConfig.repetitions}
                onChange={(e) => handleConfigChange('repetitions', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sets
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={exerciseConfig.sets}
                onChange={(e) => handleConfigChange('sets', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rest Between Sets (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={exerciseConfig.restTimeBetweenSets}
                onChange={(e) => handleConfigChange('restTimeBetweenSets', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rest After Exercise (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={exerciseConfig.restTimeAfterExercise}
                onChange={(e) => handleConfigChange('restTimeAfterExercise', e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 