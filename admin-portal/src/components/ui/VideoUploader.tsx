'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface VideoUploaderProps {
  folder: string;
  onVideoUploaded: (url: string) => void;
  onError: (error: string) => void;
  currentVideoUrl?: string;
  className?: string;
}

export default function VideoUploader({ 
  folder, 
  onVideoUploaded, 
  onError, 
  currentVideoUrl,
  className = '' 
}: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(currentVideoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      onError('Please select a valid video file');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      onError('Video file size must be less than 100MB');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    
    try {
      if (!storage) {
        throw new Error('Firebase storage not initialized');
      }
      
      // Create a unique filename to avoid collisions
      const fileName = `${file.name}-${Date.now()}`;
      const storageRef = ref(storage as FirebaseStorage, `${folder}/${fileName}`);
      
      // Create a preview URL for the selected file
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      
      // Upload the file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Listen for state changes, errors, and completion of the upload
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(progress);
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('Upload error:', error);
          onError(error.message || 'Failed to upload video');
          setIsUploading(false);
          // Revert to the current video URL if upload fails
          setPreviewUrl(currentVideoUrl);
        },
        async () => {
          // Handle successful upload
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onVideoUploaded(downloadURL);
            setPreviewUrl(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            onError('Failed to get video URL');
            // Revert to the current video URL if getting URL fails
            setPreviewUrl(currentVideoUrl);
          } finally {
            setIsUploading(false);
            setProgress(0);
            // Clean up the temporary preview URL
            URL.revokeObjectURL(previewUrl);
          }
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Failed to upload video');
      setIsUploading(false);
      setProgress(0);
      // Revert to the current video URL if upload fails
      setPreviewUrl(currentVideoUrl);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {previewUrl && (
        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video
            src={previewUrl}
            controls
            className="w-full h-full"
          />
          {!isUploading && (
            <button
              type="button"
              onClick={() => {
                setPreviewUrl('');
                onVideoUploaded('');
              }}
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-center w-full">
        <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:border-primary-500">
          <div className="flex flex-col items-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              {isUploading ? `Uploading... ${progress}%` : 'Click to upload or drag and drop'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              MP4, WebM or Ogg (Max 100MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="video/*"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      </div>
      
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
