'use client';

import { useState } from 'react';
import { importMetadataFromCSV } from '@/utils/csvImport';

export default function MetadataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ text: 'Please select a file', type: 'error' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const csvContent = e.target?.result as string;
        const result = await importMetadataFromCSV(csvContent);
        
        setMessage({
          text: result.message,
          type: result.success ? 'success' : 'error'
        });
        
        if (result.success) {
          setFile(null);
          if (document.getElementById('file-input') as HTMLInputElement) {
            (document.getElementById('file-input') as HTMLInputElement).value = '';
          }
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setMessage({ text: 'Error reading file', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Import Video Metadata</h2>
      <p className="text-gray-600 mb-4">
        Upload a CSV file containing video metadata. The CSV should have headers matching the required fields.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CSV File
          </label>
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Upload and Import'}
        </button>
        
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
} 