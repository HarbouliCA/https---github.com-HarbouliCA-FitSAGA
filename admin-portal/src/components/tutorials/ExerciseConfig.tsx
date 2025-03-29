'use client';

import { useState, useEffect } from 'react';
import { Exercise, VideoMetadata } from '@/interfaces/tutorial';
import VideoBrowser from './VideoBrowser';
import Image from 'next/image';

interface ExerciseConfigProps {
  exercise?: Exercise;
  onSave: (exercise: Exercise) => void;
  onCancel: () => void;
}

export default function ExerciseConfig({ exercise, onSave, onCancel }: ExerciseConfigProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [repetitions, setRepetitions] = useState<number>(exercise?.repetitions || 10);
  const [sets, setSets] = useState<number>(exercise?.sets || 3);
  const [restBetweenSets, setRestBetweenSets] = useState<number>(exercise?.restTimeBetweenSets || 30);
  const [restAfterExercise, setRestAfterExercise] = useState<number>(exercise?.restTimeAfterExercise || 60);
  const [showVideoBrowser, setShowVideoBrowser] = useState<boolean>(false);
  
  useEffect(() => {
    if (exercise && exercise.videoId) {
      setSelectedVideo({
        videoId: exercise.videoId,
        name: exercise.name,
        activity: exercise.activity,
        type: exercise.type,
        bodyPart: exercise.bodyPart || '',
        bodypart: undefined,
        thumbnailUrl: exercise.thumbnailUrl || '',
        filename: ''
      });
    }
  }, [exercise]);

  const handleSelectVideo = (video: VideoMetadata) => {
    setSelectedVideo(video);
    setShowVideoBrowser(false);
  };

  // Function to convert Azure thumbnail URLs to our proxy URLs
  const getThumbnailProxyUrl = (thumbnailUrl: string) => {
    if (!thumbnailUrl) return '';
    
    try {
      // Extract the base path without the SAS token
      const [basePath] = thumbnailUrl.split('?');
      
      // First decode the URL in case it's already encoded
      const decodedPath = decodeURIComponent(basePath);
      
      // Try to extract the path after the container name
      // For URLs like: https://sagafit.blob.core.windows.net/sagathumbnails/10031897/ día 1/images/3177842281.png
      const blobMatch = decodedPath.match(/\/\/[^\/]+\.blob\.core\.windows\.net\/[^\/]+\/(.+)$/);
      if (blobMatch) {
        const exactPath = blobMatch[1];
        return `/api/image-proxy?path=${encodeURIComponent(exactPath)}`;
      }
      
      // For other URLs, use the previous approach
      const containerMatch = decodedPath.match(/(?:sagathumbnails\/|images\/|thumbnails\/)(.+)$/i);
      if (!containerMatch) {
        // If no container pattern found, use the full path
        return `/api/image-proxy?path=${encodeURIComponent(decodedPath)}`;
      }
      
      const path = containerMatch[1];
      
      // Return the proxy URL with the encoded path
      return `/api/image-proxy?path=${encodeURIComponent(path)}`;
    } catch (error) {
      console.error('Error processing thumbnail URL:', error);
      return '';
    }
  };

  const handleSave = () => {
    if (!selectedVideo) {
      alert('Please select a video for this exercise');
      return;
    }

    const newExercise: Exercise = {
      id: exercise?.id,
      videoId: selectedVideo.videoId,
      name: selectedVideo.name,
      activity: selectedVideo.activity,
      type: selectedVideo.type,
      bodyPart: selectedVideo.bodyPart || selectedVideo.bodypart || 'Unknown',
      repetitions,
      sets,
      restTimeBetweenSets: restBetweenSets,
      restTimeAfterExercise: restAfterExercise,
      thumbnailUrl: selectedVideo.thumbnailUrl
    };

    onSave(newExercise);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {exercise ? 'Edit Exercise' : 'Add New Exercise'}
      </h2>

      {showVideoBrowser ? (
        <VideoBrowser onSelectVideo={handleSelectVideo} />
      ) : (
        <div className="space-y-6">
          {/* Selected Video Display */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Selected Video</h3>
              <button
                onClick={() => setShowVideoBrowser(true)}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                {selectedVideo ? 'Change Video' : 'Select Video'}
              </button>
            </div>

            {selectedVideo ? (
              <div className="flex items-center space-x-4">
                {selectedVideo.thumbnailUrl && (
                  <div className="w-24 h-24 relative bg-gray-100 rounded">
                    <img
                      src={getThumbnailProxyUrl(selectedVideo.thumbnailUrl)}
                      alt={selectedVideo.name}
                      className="object-cover w-full h-full rounded"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-medium">{selectedVideo.name}</h4>
                  <div className="text-sm text-gray-500 mt-1">
                    <div>{selectedVideo.activity}</div>
                    <div className="flex space-x-2 mt-1">
                      <span>{selectedVideo.type}</span>
                      <span>•</span>
                      <span>{selectedVideo.bodyPart || selectedVideo.bodypart}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                No video selected. Click "Select Video" to choose an exercise video.
              </div>
            )}
          </div>

          {/* Exercise Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repetitions
              </label>
              <input
                type="number"
                min="1"
                value={repetitions}
                onChange={(e) => setRepetitions(parseInt(e.target.value) || 1)}
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
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rest Between Sets (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={restBetweenSets}
                onChange={(e) => setRestBetweenSets(parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rest After Exercise (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={restAfterExercise}
                onChange={(e) => setRestAfterExercise(parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={!selectedVideo}
            >
              Save Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 