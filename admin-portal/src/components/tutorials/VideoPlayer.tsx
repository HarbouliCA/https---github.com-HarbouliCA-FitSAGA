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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        setLoading(true);
        const url = await azureStorageService.getVideoUrl(exercise.videoId);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-gray-100 rounded-lg h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="flex justify-center items-center bg-gray-100 rounded-lg h-64">
        <div className="text-red-500">{error || 'Video not available'}</div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full"
        controls
        autoPlay={autoplay}
        onEnded={handleVideoEnd}
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