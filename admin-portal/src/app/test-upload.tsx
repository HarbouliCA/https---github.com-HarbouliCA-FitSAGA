'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';

export default function TestUploadPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
    setError('');
  };

  const handleImageError = (errorMessage: string) => {
    setError(`Image upload error: ${errorMessage}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Image Upload</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Upload Test Image
          </label>
          <ImageUploader 
            folder="test-uploads"
            onImageUploaded={handleImageUploaded}
            onError={handleImageError}
          />
          <p className="text-gray-500 text-xs mt-1">
            This is a test page to verify that image uploads are working correctly.
          </p>
          
          {imageUrl && (
            <div className="mt-4">
              <p className="text-green-500 text-sm mb-2">Image uploaded successfully!</p>
              <div className="border border-gray-300 rounded p-2">
                <p className="text-xs text-gray-500 mb-2">Image URL:</p>
                <p className="text-xs break-all bg-gray-100 p-2 rounded">{imageUrl}</p>
              </div>
              <img 
                src={imageUrl} 
                alt="Uploaded preview" 
                className="mt-4 max-w-full h-auto rounded"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
