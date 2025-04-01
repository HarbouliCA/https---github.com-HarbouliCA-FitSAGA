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

  // Use a ref to track if component is mounted to prevent play() after unmount
  const isMounted = useRef(true);

  // Add a ref to track if a play operation is in progress
  const playInProgress = useRef(false);

  // Set isMounted on component mount
  useEffect(() => {
    // Ensure the ref is set to true when the component is mounted
    isMounted.current = true;
    
    // Set up cleanup when component unmounts
    return () => {
      console.log("VideoPlayer unmounting - cleaning up");
      isMounted.current = false;
      // Pause video when unmounting to prevent play interruption errors
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

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

  // Make sure video exists and can be played after initialization
  useEffect(() => {
    if (!loading && videoUrl && videoRef.current) {
      console.log("Video is loaded and ready to check autoplay status");
      
      // If we're supposed to be autoplaying, try to play the video
      if (autoplay) {
        // Use setTimeout to ensure DOM is fully updated
        setTimeout(() => {
          if (isMounted.current && videoRef.current) {
            console.log("Attempting delayed autoplay after load");
            safePlayVideo();
          }
        }, 100);
      }
    }
  }, [loading, videoUrl, autoplay]);

  // Handle external workout control - with improved initialization timing
  useEffect(() => {
    console.log("External workout active changed:", externalWorkoutActive, "current state:", workoutActive);
    
    if (typeof externalWorkoutActive !== 'undefined') {
      if (externalWorkoutActive !== workoutActive) {
        console.log(`Changing workout state from ${workoutActive} to ${externalWorkoutActive}`);
        setWorkoutActive(externalWorkoutActive);
        
        if (externalWorkoutActive && !workoutActive) {
          // External start workout command
          console.log("Starting workout from external command");
          setCurrentSet(1);
          setCurrentRep(1);
          setWorkoutComplete(false);
          setIsResting(false);
          setWorkoutPaused(false);
          
          // Only try to play if the video is ready
          if (videoRef.current && videoUrl) {
            console.log("Setting video to start at beginning");
            videoRef.current.currentTime = 0;
            // Use a small timeout to ensure state is updated before playing
            setTimeout(() => {
              if (isMounted.current && videoRef.current) {
                console.log("Attempting to play video after state update");
                safePlayVideo();
              }
            }, 200);
          } else {
            console.log("Video ref not available or videoUrl missing:", 
              videoRef.current ? "Video element exists" : "No video element", 
              videoUrl ? "URL exists" : "No URL");
          }
        } else if (!externalWorkoutActive && workoutActive) {
          // External stop workout command
          console.log("Stopping workout from external command");
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      }
    }
  }, [externalWorkoutActive, workoutActive, videoUrl]);
  
  // Handle external pause state
  useEffect(() => {
    // Check if external pause/resume functions exist
    if (externalPauseWorkout !== undefined && externalResumeWorkout !== undefined) {
      // Listen for external pause/resume commands and sync with internal state
      const originalPauseState = workoutPaused;
      
      // If we have external commands, check if we need to update
      if (videoRef.current) {
        if (workoutPaused && !videoRef.current.paused) {
          // We should be paused but aren't - pause the video
          videoRef.current.pause();
        } else if (!workoutPaused && videoRef.current.paused && workoutActive && !isResting && isMounted.current) {
          // We should be playing but aren't
          safePlayVideo();
        }
      }
    }
  }, [workoutPaused, isResting, workoutActive, externalPauseWorkout, externalResumeWorkout]);

  // Safe play function to prevent play() calls after unmount
  const safePlayVideo = async () => {
    console.log("safePlayVideo called, video ref:", videoRef.current ? "exists" : "null");
    
    // Force isMounted to true since we're in an active component context
    isMounted.current = true;
    
    // If already playing or play is in progress, don't try to play again
    if (playInProgress.current || (videoRef.current && !videoRef.current.paused)) {
      console.log("Play already in progress or video already playing, ignoring duplicate play request");
      return;
    }
    
    if (videoRef.current) {
      try {
        console.log("Attempting to play video");
        
        // Set lock to prevent concurrent play attempts
        playInProgress.current = true;
        
        // Set volume to 0 initially to help with autoplay restrictions
        videoRef.current.volume = 0.0;
        videoRef.current.muted = true;
        
        // Use await to properly catch any play() errors
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Video playback started successfully");
              // Gradually increase volume once playing successfully
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.muted = false;
                  // Increase volume gradually
                  const volumeInterval = setInterval(() => {
                    if (videoRef.current && videoRef.current.volume < 1.0) {
                      videoRef.current.volume = Math.min(1.0, videoRef.current.volume + 0.1);
                    } else {
                      clearInterval(volumeInterval);
                    }
                  }, 200);
                }
              }, 1000);
              
              // Release lock
              playInProgress.current = false;
            })
            .catch(err => {
              // Release lock on error
              playInProgress.current = false;
              
              // Only log as warning, not as error to reduce console noise
              console.warn("Video play failed:", err.message);
              
              // If autoplay is blocked, make the manual play button more prominent
              if (err.name === "NotAllowedError") {
                console.log("Autoplay blocked by browser. User interaction required.");
              }
            });
        } else {
          // Release lock if play() didn't return a promise
          playInProgress.current = false;
        }
      } catch (err) {
        // Release lock on error
        playInProgress.current = false;
        console.warn('Failed to play video:', err);
      }
    } else {
      console.error('Video reference not available for playback');
    }
  };

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

  // Rest timer countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isResting && restTimeRemaining > 0 && !workoutPaused) {
      // Countdown timer for rest periods
      timer = setTimeout(() => {
        if (isMounted.current) {
          setRestTimeRemaining(prev => prev - 1);
          console.log(`Rest time remaining: ${restTimeRemaining - 1}s, workoutComplete: ${workoutComplete}`);
        }
      }, 1000);
    } else if (isResting && restTimeRemaining === 0 && isMounted.current) {
      console.log("Rest period complete:", workoutComplete ? "after exercise" : "between sets");
      setIsResting(false);
      
      if (workoutComplete) {
        // Exercise is complete (final rest after all sets)
        console.log('⭐ Exercise complete with rest period finished, moving to next exercise!');
        
        // Reset workout states before moving to next exercise
        setWorkoutActive(false);
        setWorkoutPaused(false);
        setCurrentSet(1);
        setCurrentRep(1);
        
        if (onComplete) {
          // Small timeout to ensure UI updates before transition
          setTimeout(() => {
            if (isMounted.current) {
              console.log('⭐ Calling onComplete to move to next exercise');
              onComplete();
            }
          }, 500);
        }
      } else if (workoutActive && !workoutPaused) {
        // Rest between sets is complete, continue with the next set
        console.log('Rest between sets complete, starting next set');
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          safePlayVideo();
        }
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isResting, restTimeRemaining, workoutActive, workoutComplete, workoutPaused, onComplete]);

  // Handle video ending event - manage reps and sets
  const handleVideoEnd = () => {
    if (!isMounted.current) return;
    
    console.log('Video ended, workout active:', workoutActive, 'workout paused:', workoutPaused);
    
    if (workoutActive && !workoutPaused) {
      if (currentRep < exercise.repetitions) {
        // Move to next rep
        console.log(`Completed rep ${currentRep}/${exercise.repetitions}`);
        setCurrentRep(prev => prev + 1);
        
        // Restart video
        if (videoRef.current && isMounted.current) {
          videoRef.current.currentTime = 0;
          safePlayVideo();
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
          // All sets complete - Final exercise is done
          console.log(`All sets complete! Skipping final rest and completing exercise immediately.`);
          
          // Reset workout states immediately
          setWorkoutActive(false);
          setWorkoutPaused(false);
          setCurrentSet(1);
          setCurrentRep(1);
          setWorkoutComplete(true);
          
          // Don't start rest time, immediately call onComplete
          if (onComplete) {
            console.log('⭐ Exercise complete! Calling onComplete immediately to move to next exercise or show completion');
            setTimeout(() => {
              if (isMounted.current) {
                onComplete();
              }
            }, 500);
          }
        }
      }
    } else if (!workoutComplete && !workoutActive && onComplete) {
      // Normal video play completed (not in workout mode)
      console.log('Normal video play completed, calling onComplete');
      onComplete();
    }
  };

  // Exposed workout control functions for parent components
  const startWorkout = () => {
    console.log('Starting workout:', exercise);
    setWorkoutActive(true);
    setWorkoutPaused(false);
    setCurrentSet(1);
    setCurrentRep(1);
    setWorkoutComplete(false);
    setIsResting(false);
    
    if (videoRef.current && isMounted.current) {
      videoRef.current.currentTime = 0;
      safePlayVideo();
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
    
    // Wait for any play operation to complete before pausing
    if (playInProgress.current) {
      console.log('Play in progress, scheduling pause after play completes');
      // Schedule pause after a small delay to ensure play completes first
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
        setWorkoutPaused(true);
      }, 100);
    } else {
      // Pause immediately if no play is in progress
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setWorkoutPaused(true);
    }
    
    // Notify external caller if callback provided
    if (externalPauseWorkout) {
      externalPauseWorkout();
    }
  };

  const resumeWorkout = () => {
    console.log('Resuming workout');
    setWorkoutPaused(false);
    
    if (videoRef.current && workoutActive && !isResting && isMounted.current) {
      safePlayVideo();
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

  // Watch for autoplay prop changes to start/stop video accordingly
  useEffect(() => {
    console.log("Autoplay prop changed:", autoplay, "current play in progress:", playInProgress.current);
    
    if (autoplay && videoRef.current && isMounted.current) {
      // If we should be playing but not yet playing
      if (videoRef.current.paused && !playInProgress.current) {
        console.log("Autoplay true - scheduling video playback");
        // Use setTimeout to avoid immediate play which can cause conflicts
        setTimeout(() => {
          if (isMounted.current && videoRef.current && videoRef.current.paused) {
            console.log("Executing delayed autoplay");
            safePlayVideo();
          }
        }, 150);
      }
    } else if (!autoplay && videoRef.current && !videoRef.current.paused) {
      console.log("Autoplay false - pausing video");
      // Only pause if we're not in a play operation
      if (!playInProgress.current) {
        videoRef.current.pause();
      } else {
        console.log("Play in progress, scheduling pause after delay");
        setTimeout(() => {
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
        }, 200);
      }
    }
  }, [autoplay]);

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
        </div>
      )}
      
      {/* Manual play button overlay - improved version with better visibility */}
      {!isResting && (videoRef.current?.paused || !videoRef.current) && (autoplay || workoutActive) && (
        <div 
          onClick={() => {
            console.log("Manual play button clicked");
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              safePlayVideo();
            }
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer z-50"
        >
          <div className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
              <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
            </svg>
          </div>
          <div className="absolute bottom-8 text-white bg-black/60 px-4 py-2 rounded text-sm">
            Click to play video
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className={`w-full ${compactMode ? 'max-h-[240px] object-contain' : ''}`}
        controls={!workoutActive} // Hide controls in workout mode
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnd}
        onError={handleVideoError}
        data-testid="workout-video"
      >
        <source src={videoUrl || ''} type="video/mp4" />
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