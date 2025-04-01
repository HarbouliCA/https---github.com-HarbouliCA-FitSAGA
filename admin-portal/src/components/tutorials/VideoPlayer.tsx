'use client';

import { useState, useRef, useEffect } from 'react';
import { Exercise } from '@/interfaces/tutorial';
import azureStorageService from '@/services/azureStorageService';

interface VideoPlayerProps {
  exercise: Exercise;
  onComplete?: () => void;
  autoplay?: boolean;
}

export default function VideoPlayer({ exercise, onComplete, autoplay = false }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [attemptedUrls, setAttemptedUrls] = useState<string[]>([]);
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

  const handleVideoEnd = () => {
    if (onComplete) {
      onComplete();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-gray-100 rounded-lg h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center bg-gray-100 rounded-lg h-64 p-4">
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
      <div className="flex justify-center items-center bg-gray-100 rounded-lg h-64">
        <div className="text-red-500">Video not available</div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden">
      {fallbackMode && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-2 py-1 m-2 rounded z-10">
          Fallback Mode
        </div>
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full"
        controls
        autoPlay={autoplay}
        onEnded={handleVideoEnd}
        onError={handleVideoError}
        playsInline
      >
        Your browser does not support the video tag.
      </video>
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="text-white">
          <h3 className="font-medium">{exercise.name}</h3>
          <div className="text-sm opacity-80">
            {exercise.sets} sets × {exercise.repetitions} reps
          </div>
        </div>
      </div>
    </div>
  );
} 