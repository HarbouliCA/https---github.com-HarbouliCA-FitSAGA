import { BlobServiceClient } from '@azure/storage-blob';

class AzureStorageService {
  private defaultContainers: string[] = ['sagafitvideos', 'sagathumbnails', 'saga-videos', 'sagavideos'];
  private accountName: string;
  private sasToken: string;

  constructor() {
    this.accountName = process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_NAME || '';
    this.sasToken = process.env.NEXT_PUBLIC_AZURE_STORAGE_SAS_TOKEN || '';
  }

  // Helper to create full URL with SAS token
  private getFullUrl(container: string, path: string): string {
    // Properly encode path segments while preserving slashes
    const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
    return `https://${this.accountName}.blob.core.windows.net/${container}/${encodedPath}?${this.sasToken}`;
  }

  async getVideoUrl(videoId: string): Promise<string> {
    if (!this.accountName || !this.sasToken) {
      throw new Error("Azure Storage credentials are not configured");
    }

    if (!videoId) {
      throw new Error("Video ID is required");
    }

    console.log("Fetching video URL for ID:", videoId);
    
    // First try to construct a URL using the known working pattern
    const userIdMatch = videoId.match(/^(\d+)_/);
    const filenameMatch = videoId.match(/(\d{4}_cw\d{3}\.mp4)$/i);
    
    if (userIdMatch && filenameMatch) {
      const userId = userIdMatch[1];
      const filename = filenameMatch[1];
      
      // Directly use the known working pattern (userId/día 1/filename.mp4)
      const workingPattern = `${userId}/día 1/${filename}`;
      try {
        console.log(`Trying known working pattern: ${workingPattern}`);
        const url = this.getFullUrl('sagafitvideos', workingPattern);
        
        // Test if this URL works
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log('Known pattern works!');
          return url;
        }
      } catch (error) {
        console.log('Known pattern failed, will try fallbacks');
      }
    }
    
    // Build a list of possible paths to try if the direct pattern failed
    const pathsToTry: string[] = [videoId];
    
    // Extract user ID and other parts from the video ID
    if (userIdMatch) {
      const userId = userIdMatch[1];
      
      // Add user ID folder path
      pathsToTry.push(`${userId}/${videoId}`);
      
      // Try to extract just the filename using the pattern from the direct URL
      if (filenameMatch) {
        const filename = filenameMatch[1];
        
        // Try the exact pattern from the example URL
        pathsToTry.push(`${userId}/día 1/${filename}`);
        pathsToTry.push(`${userId}/ día 1/${filename}`);
        pathsToTry.push(`${userId}/${filename}`);
        pathsToTry.push(`${userId}/videos/${filename}`);
        pathsToTry.push(`${userId}/día 1/videos/${filename}`);
      }
    }
    
    console.log("Path variations to try:", pathsToTry);

    // Try each container with each path until we find a working URL
    for (const container of this.defaultContainers) {
      for (const path of pathsToTry) {
        try {
          const url = this.getFullUrl(container, path);
          console.log(`Trying video URL: ${container}/${path}`);
          
          // Try to fetch HEAD to check if the video exists
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            console.log(`Found video in container: ${container}, path: ${path}`);
            return url;
          }
        } catch (error) {
          // Continue to the next container/path
          console.log(`Failed to fetch from ${container}/${path}`);
        }
      }
    }

    // If we get here, we didn't find the video in any container/path
    // Check if we can generate a URL based on the example format
    if (userIdMatch && filenameMatch) {
      const userId = userIdMatch[1];
      const filename = filenameMatch[1];
      
      // Just return the exact URL pattern from the example as a last resort
      console.log("No working URL found, returning URL with expected pattern as fallback");
      return this.getFullUrl('sagafitvideos', `${userId}/día 1/${filename}`);
    }
    
    // Return the URL with the first container as a final fallback
    console.log("Video not found in any container, returning default URL");
    return this.getFullUrl(this.defaultContainers[0], videoId);
  }

  async getThumbnailUrl(thumbnailId: string): Promise<string> {
    try {
      if (!this.accountName || !this.sasToken) {
        throw new Error("Azure Storage credentials are not configured");
      }

      // Try multiple containers for thumbnails too
      for (const container of this.defaultContainers) {
        const path = thumbnailId.startsWith('thumbnails/') ? 
          thumbnailId : `thumbnails/${thumbnailId}`;
          
        const url = this.getFullUrl(container, path);
        
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            return url;
          }
        } catch (error) {
          // Continue to next container
        }
      }
      
      // Return default URL as fallback
      return this.getFullUrl('sagathumbnails', `thumbnails/${thumbnailId}`);
    } catch (error) {
      console.error('Error getting thumbnail URL:', error);
      throw new Error('Failed to get thumbnail URL');
    }
  }

  // Use this method to get proxy URLs for thumbnails
  async getThumbnailProxyUrl(thumbnailId: string): Promise<string> {
    try {
      if (!thumbnailId) {
        return '';
      }

      const path = thumbnailId.startsWith('thumbnails/') ? 
        thumbnailId : `thumbnails/${thumbnailId}`;

      // Use our image proxy API instead of direct Azure URL
      return `/api/image-proxy?path=${encodeURIComponent(path)}`;
    } catch (error) {
      console.error('Error getting thumbnail proxy URL:', error);
      return '';
    }
  }
}

const azureStorageService = new AzureStorageService();
export default azureStorageService; 