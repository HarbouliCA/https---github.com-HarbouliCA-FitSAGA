'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useParams, redirect } from 'next/navigation';
import tutorialService from '@/services/tutorialService';
import { Tutorial, Exercise } from '@/interfaces/tutorial';
import TutorialProgress from '@/components/tutorials/TutorialProgress';
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
  
  // Workout state for UI display
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [isResting, setIsResting] = useState(false);
  
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
    
    console.log("⭐ Exercise complete callback received in PlayTutorialPage");
    const currentDay = tutorial.days[currentDayIndex];
    
    // Log the state for debugging
    console.log(`Current Day Index: ${currentDayIndex}, Current Exercise Index: ${currentExerciseIndex}`);
    console.log(`Days in tutorial: ${tutorial.days.length}, Exercises in current day: ${currentDay.exercises.length}`);
    
    if (currentExerciseIndex < currentDay.exercises.length - 1) {
      // Move to next exercise in current day
      setCurrentExerciseIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        console.log(`⭐ Moving from exercise ${prevIndex} to ${nextIndex} in day ${currentDayIndex}`);
        return nextIndex;
      });
      
      // Reset workout state
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSet(1);
      setCurrentRep(1);
      setIsResting(false);
      
      // Log the transition
      console.log("⭐ Reset workout state, ready for next exercise");
    } else if (currentDayIndex < tutorial.days.length - 1) {
      // Move to first exercise of next day
      console.log(`⭐ Current day ${currentDayIndex} completed, moving to day ${currentDayIndex + 1}`);
      setCurrentDayIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        console.log(`⭐ Moving from day ${prevIndex} to ${nextIndex}`);
        return nextIndex;
      });
      setCurrentExerciseIndex(0);
      
      // Reset workout state
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSet(1);
      setCurrentRep(1);
      setIsResting(false);
      
      // Log the transition
      console.log("⭐ Reset workout state, ready for first exercise of next day");
    } else {
      // Tutorial completed
      console.log("⭐ All exercises in all days completed! Showing completion celebration.");
      setShowCompletion(true);
      
      // Reset workout state
      setIsPlaying(false);
      setIsPaused(false);
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
  
  // Handle workout controls
  const startWorkout = () => {
    console.log("Starting workout from UI button");
    // Add a small delay to ensure the state changes are registered properly
    setTimeout(() => {
      if (!isPlaying) {
        setIsPlaying(true);
        setIsPaused(false);
        // Reset state
        setCurrentSet(1);
        setCurrentRep(1);
        setIsResting(false);
        
        // Immediately log state to verify it updated
        console.log("Updated state - isPlaying:", true, "isPaused:", false);
      } else {
        console.log("Workout already playing, ignoring start command");
      }
    }, 0);
  };
  
  const stopWorkout = () => {
    console.log("Stopping workout");
    setIsPlaying(false);
    setIsPaused(false);
    setIsResting(false);
  };
  
  const togglePause = () => {
    console.log(`${isPaused ? 'Resuming' : 'Pausing'} workout`);
    
    if (isPaused) {
      // Resume the workout
      setIsPaused(false);
    } else {
      // Pause the workout
      setIsPaused(true);
    }
  };
  
  // Update UI from VideoPlayer
  const handleSetChange = (set: number) => {
    setCurrentSet(set);
  };
  
  const handleRepChange = (rep: number) => {
    setCurrentRep(rep);
  };
  
  const handleRestingChange = (resting: boolean) => {
    setIsResting(resting);
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
                  onClick={() => {
                    console.log("Start/Stop button clicked");
                    if (isPlaying) {
                      stopWorkout();
                    } else {
                      startWorkout();
                    }
                  }}
                  className={`px-4 py-2 rounded-md flex items-center justify-center ${
                    isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  data-testid="workout-control-button"
                >
                  {isPlaying ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                        <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                      </svg>
                      Stop
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                      </svg>
                      Start
                    </>
                  )}
                </button>
                
                {isPlaying && (
                  <button
                    onClick={togglePause}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                  >
                    {isPaused ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                          <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                        </svg>
                        Resume
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                          <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                        </svg>
                        Pause
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {isPlaying && (
                <div className="mb-4">
                  <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm inline-block mb-3">
                    {isResting ? 'Resting' : 'Active'}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500">Set</div>
                      <div className="text-xl font-bold">{currentSet} / {currentExercise.sets}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500">Rep</div>
                      <div className="text-xl font-bold">{currentRep} / {currentExercise.repetitions}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-3 text-center">
                    {isResting ? 'Rest between sets' : 'Complete the current rep'}
                  </div>
                </div>
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
                onComplete={() => {
                  console.log("VideoPlayer signaled exercise completion");
                  handleExerciseComplete();
                }}
                externalWorkoutActive={isPlaying}
                externalStartWorkout={startWorkout}
                externalStopWorkout={stopWorkout}
                externalPauseWorkout={() => {
                  console.log("External pause requested");
                  setIsPaused(true);
                }}
                externalResumeWorkout={() => {
                  console.log("External resume requested");
                  setIsPaused(false);
                }}
                onSetChange={handleSetChange}
                onRepChange={handleRepChange}
                onRestingChange={handleRestingChange}
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