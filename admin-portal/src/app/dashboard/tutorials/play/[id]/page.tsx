'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useParams, redirect } from 'next/navigation';
import tutorialService from '@/services/tutorialService';
import { Tutorial, Exercise } from '@/interfaces/tutorial';
import TutorialProgress from '@/components/tutorials/TutorialProgress';
import ExerciseTimer from '@/components/tutorials/ExerciseTimer';
import VideoPlayer from '@/components/tutorials/VideoPlayer';
import CompletionCelebration from '@/components/tutorials/CompletionCelebration';
import Link from 'next/link';

export default function PlayTutorialPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
    } else {
      const fetchTutorial = async () => {
        try {
          if (!params) {
            setError('Invalid tutorial ID');
            setIsLoading(false);
            return;
          }
          
          const id = Array.isArray(params.id) ? params.id[0] : params.id;
          
          if (!id) {
            setError('Invalid tutorial ID');
            setIsLoading(false);
            return;
          }
          
          const tutorialData = await tutorialService.getTutorialById(id);
          
          if (!tutorialData) {
            setError('Tutorial not found');
            return;
          }
          
          setTutorial(tutorialData);
        } catch (err) {
          console.error(err);
          setError('Failed to load tutorial');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTutorial();
    }
  }, [session, status, params?.id]);
  
  const handleExerciseComplete = () => {
    if (!tutorial) return;
    
    const currentDay = tutorial.days[currentDayIndex];
    
    if (currentExerciseIndex < currentDay.exercises.length - 1) {
      // Move to next exercise in current day
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else if (currentDayIndex < tutorial.days.length - 1) {
      // Move to first exercise of next day
      setCurrentDayIndex(currentDayIndex + 1);
      setCurrentExerciseIndex(0);
    } else {
      // Tutorial completed
      setShowCompletion(true);
    }
  };
  
  const handleRestartTutorial = () => {
    setCurrentDayIndex(0);
    setCurrentExerciseIndex(0);
    setShowCompletion(false);
  };
  
  const getCurrentExercise = (): Exercise | null => {
    if (!tutorial) return null;
    
    try {
      return tutorial.days[currentDayIndex].exercises[currentExerciseIndex];
    } catch (e) {
      return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }
  
  if (!tutorial) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
          Tutorial not found
        </div>
      </div>
    );
  }
  
  const currentExercise = getCurrentExercise();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{tutorial.title}</h1>
        <div className="flex space-x-4">
          <Link
            href={`/dashboard/tutorials/view/${tutorial.id}`}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Exit Workout
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <TutorialProgress
            tutorial={tutorial}
            currentDayIndex={currentDayIndex}
            currentExerciseIndex={currentExerciseIndex}
            onDayChange={setCurrentDayIndex}
            onExerciseChange={setCurrentExerciseIndex}
          />
          
          {currentExercise && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">
                Day {tutorial.days[currentDayIndex].dayNumber}: {tutorial.days[currentDayIndex].title}
              </h2>
              
              <div className="flex justify-between mb-6">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-2 rounded-md ${
                    isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isPlaying ? 'Stop' : 'Start'}
                </button>
                
                {isPlaying && (
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                )}
              </div>
              
              {isPlaying && (
                <ExerciseTimer
                  exercise={currentExercise}
                  onComplete={handleExerciseComplete}
                  isActive={isPlaying}
                  isPaused={isPaused}
                />
              )}
            </div>
          )}
        </div>
        
        <div className="lg:col-span-2">
          {currentExercise ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <VideoPlayer
                exercise={currentExercise}
                autoplay={isPlaying && !isPaused}
              />
              
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{currentExercise.name}</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-500">Sets</div>
                    <div className="font-medium">{currentExercise.sets}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-500">Reps</div>
                    <div className="font-medium">{currentExercise.repetitions}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-500">Rest Between Sets</div>
                    <div className="font-medium">{currentExercise.restTimeBetweenSets}s</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-500">Rest After Exercise</div>
                    <div className="font-medium">{currentExercise.restTimeAfterExercise}s</div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <div>{currentExercise.activity}</div>
                  <div>{currentExercise.type}</div>
                  <div>{currentExercise.bodyPart}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-xl font-medium mb-2">No Exercise Selected</h2>
              <p className="text-gray-600 mb-4">
                Select an exercise from the progress tracker to begin.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {showCompletion && (
        <CompletionCelebration
          tutorial={tutorial}
          onRestart={handleRestartTutorial}
        />
      )}
    </div>
  );
} 