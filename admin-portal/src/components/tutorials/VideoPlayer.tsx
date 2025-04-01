'use client';

import { useState, useRef, useEffect } from 'react';
import { Exercise } from '@/interfaces/tutorial';
import azureStorageService from '@/services/azureStorageService';

interface VideoPlayerProps {
  exercise: Exercise;
  onComplete?: () => void;
  autoplay?: boolean;
  compactMode?: boolean;
  // Add new props for external workout control
  externalWorkoutActive?: boolean;
  externalStartWorkout?: () => void;
  externalStopWorkout?: () => void;
  externalPauseWorkout?: () => void;
  externalResumeWorkout?: () => void;
  onSetChange?: (set: number) => void;
  onRepChange?: (rep: number) => void;
  onRestingChange?: (isResting: boolean) => void;
}

export default function VideoPlayer({ 
  exercise, 
  onComplete, 
  autoplay = false,
  compactMode = false,
  externalWorkoutActive,
  externalStartWorkout,
  externalStopWorkout,
  externalPauseWorkout,
  externalResumeWorkout,
  onSetChange,
  onRepChange,
  onRestingChange
}: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [attemptedUrls, setAttemptedUrls] = useState<string[]>([]);
  
  // Workout state
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [workoutPaused, setWorkoutPaused] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper to generate alternative video URLs based on the pattern from direct example
  const generateAlternativeUrls = (videoId: string) => {
    const urls: string[] = [];
    
    // If the videoId has format like 10011090_18687781_2023_cw003.mp4
    const userIdMatch = videoId.match(/^(\d+)_/);
    const filenameMatch = videoId.match(/(\d{4}_cw\d{3}\.mp4)$/i);
    
    if (userIdMatch && filenameMatch) {
      const userId = userIdMatch[1];
      const filename = filenameMatch[1];
      
      // Get credentials from env
      const accountName = process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_NAME || 'sagafit';
      const sasToken = process.env.NEXT_PUBLIC_AZURE_STORAGE_SAS_TOKEN || '';
      
      // Create working URL pattern with proper encoding
      // Example: https://sagafit.blob.core.windows.net/sagafitvideos/10011090/d%C3%ADa%201/2023_cw003.mp4?SAS
      const directPattern = `https://${accountName}.blob.core.windows.net/sagafitvideos/${userId}/${encodeURIComponent('día 1')}/${filename}?${sasToken}`;
      urls.push(directPattern);
      
      // Add some variants with different containers
      urls.push(`https://${accountName}.blob.core.windows.net/sagavideos/${userId}/${encodeURIComponent('día 1')}/${filename}?${sasToken}`);
      urls.push(`https://${accountName}.blob.core.windows.net/videos/${userId}/${encodeURIComponent('día 1')}/${filename}?${sasToken}`);
    }
    
    return urls;
  };

  const fetchDirectUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      setFallbackMode(true);
      
      // Generate URLs using the confirmed working pattern
      const alternativeUrls = generateAlternativeUrls(exercise.videoId);
      
      // If we found potential URLs based on the pattern
      if (alternativeUrls.length > 0) {
        setAttemptedUrls(alternativeUrls);
        
        // Try the first URL (should be the most likely to work)
        const firstUrl = alternativeUrls[0];
        console.log('Using direct URL with known pattern:', firstUrl);
        setDirectUrl(firstUrl);
        setVideoUrl(firstUrl);
      } else {
        // Fallback to our service if pattern matching didn't work
        const standardUrl = await azureStorageService.getVideoUrl(exercise.videoId);
        console.log('Using standard URL from service:', standardUrl);
        setDirectUrl(standardUrl);
        setVideoUrl(standardUrl);
      }
    } catch (err) {
      console.error('Error fetching direct video URL:', err);
      setError('Failed to load video with direct method');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        setFallbackMode(false);
        
        // Generate alternative URLs in the background for potential fallback
        const alternatives = generateAlternativeUrls(exercise.videoId);
        setAttemptedUrls(alternatives);
        
        // Also get a direct URL in the background
        if (alternatives.length > 0) {
          setDirectUrl(alternatives[0]);
        } else {
          const direct = await azureStorageService.getVideoUrl(exercise.videoId);
          setDirectUrl(direct);
        }
        
        // Use the proxy endpoint
        const url = `/api/video-proxy?videoId=${encodeURIComponent(exercise.videoId)}`;
        console.log('Using video proxy URL:', url);
        
        setVideoUrl(url);
      } catch (err) {
        console.error('Error fetching video URL:', err);
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, [exercise.videoId]);

  // Notify parent of rep/set changes
  useEffect(() => {
    if (onSetChange) {
      onSetChange(currentSet);
    }
  }, [currentSet, onSetChange]);

  useEffect(() => {
    if (onRepChange) {
      onRepChange(currentRep);
    }
  }, [currentRep, onRepChange]);

  useEffect(() => {
    if (onRestingChange) {
      onRestingChange(isResting);
    }
  }, [isResting, onRestingChange]);

  // Handle external workout control
  useEffect(() => {
    if (typeof externalWorkoutActive !== 'undefined') {
      setWorkoutActive(externalWorkoutActive);
      
      if (externalWorkoutActive && !workoutActive) {
        // External start workout command
        setCurrentSet(1);
        setCurrentRep(1);
        setWorkoutComplete(false);
        setIsResting(false);
        setWorkoutPaused(false);
        
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play()
            .catch(err => console.error('Failed to autoplay video:', err));
        }
      } else if (!externalWorkoutActive && workoutActive) {
        // External stop workout command
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }
    }
  }, [externalWorkoutActive, workoutActive]);
  
  // Handle external pause/resume commands
  useEffect(() => {
    if (externalPauseWorkout && externalResumeWorkout) {
      // Handle pause state changes
      if (videoRef.current) {
        if (workoutPaused) {
          videoRef.current.pause();
        } else if (!isResting) {
          videoRef.current.play()
            .catch(err => console.error('Failed to resume video:', err));
        }
      }
    }
  }, [workoutPaused, externalPauseWorkout, externalResumeWorkout, isResting]);

  // Handle video ending event - manage reps and sets
  const handleVideoEnd = () => {
    console.log('Video ended, workout active:', workoutActive);
    
    if (workoutActive && !workoutPaused) {
      if (currentRep < exercise.repetitions) {
        // Move to next rep
        console.log(`Completed rep ${currentRep}/${exercise.repetitions}`);
        setCurrentRep(prev => prev + 1);
        
        // Restart video
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play()
            .catch(err => console.error('Failed to restart video after rep:', err));
        }
      } else {
        // Set of reps complete, check if there are more sets
        console.log(`Completed set ${currentSet}/${exercise.sets}`);
        
        if (currentSet < exercise.sets) {
          // Start rest timer between sets
          console.log(`Starting rest between sets: ${exercise.restTimeBetweenSets}s`);
          setIsResting(true);
          setRestTimeRemaining(exercise.restTimeBetweenSets);
          
          // Prepare for next set
          setCurrentRep(1);
          setCurrentSet(prev => prev + 1);
        } else {
          // All sets complete, start final rest period
          console.log(`Workout complete! Final rest: ${exercise.restTimeAfterExercise}s`);
          setIsResting(true);
          setRestTimeRemaining(exercise.restTimeAfterExercise);
          setWorkoutActive(false);
          setWorkoutComplete(true);
        }
      }
    } else if (!workoutComplete && onComplete) {
      // Normal video play completed (not in workout mode)
      onComplete();
    }
  };

  // Rest timer countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isResting && restTimeRemaining > 0 && !workoutPaused) {
      timer = setTimeout(() => {
        setRestTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (isResting && restTimeRemaining === 0) {
      setIsResting(false);
      
      // Resume workout if not complete
      if (workoutActive && videoRef.current && !workoutPaused) {
        console.log('Rest complete, starting next rep/set');
        videoRef.current.currentTime = 0;
        videoRef.current.play()
          .catch(err => console.error('Failed to play video after rest:', err));
      } else if (workoutComplete) {
        // Entire workout is finished
        console.log('Workout and rest period complete');
        if (onComplete) onComplete();
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isResting, restTimeRemaining, workoutActive, workoutComplete, workoutPaused, onComplete]);

  // Exposed workout control functions for parent components
  const startWorkout = () => {
    console.log('Starting workout:', exercise);
    setWorkoutActive(true);
    setWorkoutPaused(false);
    setCurrentSet(1);
    setCurrentRep(1);
    setWorkoutComplete(false);
    setIsResting(false);
    
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play()
        .catch(err => console.error('Failed to start workout:', err));
    }
    
    // Notify external caller if callback provided
    if (externalStartWorkout) {
      externalStartWorkout();
    }
  };

  const stopWorkout = () => {
    console.log('Stopping workout');
    setWorkoutActive(false);
    setWorkoutPaused(false);
    setIsResting(false);
    
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    // Notify external caller if callback provided
    if (externalStopWorkout) {
      externalStopWorkout();
    }
  };

  const pauseWorkout = () => {
    console.log('Pausing workout');
    setWorkoutPaused(true);
    
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    // Notify external caller if callback provided
    if (externalPauseWorkout) {
      externalPauseWorkout();
    }
  };

  const resumeWorkout = () => {
    console.log('Resuming workout');
    setWorkoutPaused(false);
    
    if (videoRef.current && workoutActive && !isResting) {
      videoRef.current.play()
        .catch(err => console.error('Failed to resume workout:', err));
    }
    
    // Notify external caller if callback provided
    if (externalResumeWorkout) {
      externalResumeWorkout();
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e);
    const videoElement = e.target as HTMLVideoElement;
    
    if (videoElement.error) {
      console.log('Video element error:', videoElement.error?.message);
    }
    
    console.log('Current videoURL:', videoUrl);
    
    if (!fallbackMode && directUrl) {
      // If proxy fails but we have a direct URL, try that
      console.log('Proxy failed, trying direct URL:', directUrl);
      setVideoUrl(directUrl);
      setFallbackMode(true);
    } else if (fallbackMode && attemptedUrls.length > 0) {
      // We're already in fallback mode, try the next URL in our list if available
      const currentIndex = attemptedUrls.indexOf(videoUrl || '');
      const nextUrl = currentIndex < attemptedUrls.length - 1 ? attemptedUrls[currentIndex + 1] : null;
      
      if (nextUrl) {
        console.log('Trying next alternative URL:', nextUrl);
        setVideoUrl(nextUrl);
      } else {
        setError(`Could not load video (${exercise.videoId}) after trying all available URLs.`);
      }
    } else {
      setError(`Could not load video (${exercise.videoId}). Please try again later.`);
    }
  };

  // Adjust classes based on compact mode
  const containerClasses = compactMode 
    ? "relative rounded-lg overflow-hidden max-h-[240px]" 
    : "relative rounded-lg overflow-hidden";

  if (loading) {
    return (
      <div className={`flex justify-center items-center bg-gray-100 rounded-lg ${compactMode ? 'h-40' : 'h-64'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col justify-center items-center bg-gray-100 rounded-lg ${compactMode ? 'h-40' : 'h-64'} p-4`}>
        <div className="text-red-500 mb-4">{error}</div>
        <div className="text-xs text-gray-500 mb-4 max-w-md overflow-auto">
          Video ID: {exercise.videoId}
        </div>
        <button 
          onClick={fetchDirectUrl}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Direct Link
        </button>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className={`flex justify-center items-center bg-gray-100 rounded-lg ${compactMode ? 'h-40' : 'h-64'}`}>
        <div className="text-red-500">Video not available</div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {fallbackMode && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-2 py-1 m-2 rounded z-10">
          Fallback Mode
        </div>
      )}
      
      {/* Workout Progress Display */}
      {workoutActive && (
        <div className="absolute top-0 left-0 right-0 bg-black/50 text-white p-2 flex justify-between text-sm z-20">
          <div>
            Set: <span className="font-bold">{currentSet}/{exercise.sets}</span>
          </div>
          <div>
            Rep: <span className="font-bold">{currentRep}/{exercise.repetitions}</span>
          </div>
        </div>
      )}
      
      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-30">
          <h3 className="text-xl font-semibold mb-2">
            {!workoutComplete ? "Rest Between Sets" : "Rest After Exercise"}
          </h3>
          <div className="text-5xl font-bold mb-4">{restTimeRemaining}s</div>
          <div className="text-sm mb-4">
            {!workoutComplete ? `Preparing for Set ${currentSet}` : "Great job! Workout complete."}
          </div>
          
          {/* Progress indicator */}
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-1000" 
              style={{ 
                width: `${(restTimeRemaining / (workoutComplete ? exercise.restTimeAfterExercise : exercise.restTimeBetweenSets)) * 100}%` 
              }}
            ></div>
          </div>
          
          {/* Pause/Resume rest timer */}
          {workoutPaused ? (
            <button 
              onClick={resumeWorkout}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Resume
            </button>
          ) : (
            <button 
              onClick={pauseWorkout}
              className="mt-4 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-100 text-sm"
            >
              Pause
            </button>
          )}
        </div>
      )}
      
      <video
        ref={videoRef}
        src={videoUrl}
        className={`w-full ${compactMode ? 'max-h-[240px] object-contain' : ''}`}
        controls={!workoutActive} // Hide controls in workout mode
        autoPlay={autoplay}
        onEnded={handleVideoEnd}
        onError={handleVideoError}
        playsInline
      >
        Your browser does not support the video tag.
      </video>
      
      {/* Video overlay and controls - hide in compact mode */}
      {!compactMode && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="text-white mb-3">
            <h3 className="font-medium">{exercise.name}</h3>
            <div className="text-sm opacity-80">
              {exercise.sets} sets × {exercise.repetitions} reps
            </div>
          </div>
          
          {/* Workout Controls - only show if not externally controlled */}
          {!externalStartWorkout && !externalStopWorkout && (
            <div className="flex space-x-3">
              {!workoutActive && !workoutComplete && (
                <button 
                  onClick={startWorkout}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Start Workout
                </button>
              )}
              
              {workoutActive && !workoutPaused && (
                <>
                  <button 
                    onClick={stopWorkout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Stop Workout
                  </button>
                  <button 
                    onClick={pauseWorkout}
                    className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-100 text-sm"
                  >
                    Pause
                  </button>
                </>
              )}
              
              {workoutActive && workoutPaused && (
                <>
                  <button 
                    onClick={stopWorkout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Stop Workout
                  </button>
                  <button 
                    onClick={resumeWorkout}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Resume
                  </button>
                </>
              )}
              
              {workoutComplete && (
                <button 
                  onClick={startWorkout}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Restart Workout
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 