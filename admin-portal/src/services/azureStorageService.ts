import { BlobServiceClient } from '@azure/storage-blob';

class AzureStorageService {
  private containerName: string = 'sagafitvideos';
  private accountName: string;
  private sasToken: string;

  constructor() {
    this.accountName = process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_NAME || '';
    this.sasToken = process.env.NEXT_PUBLIC_AZURE_STORAGE_SAS_TOKEN || '';
  }

  // Helper to create full URL with SAS token
  private getFullUrl(path: string): string {
    return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${path}?${this.sasToken}`;
  }

  async getVideoUrl(videoId: string): Promise<string> {
    try {
      if (!this.accountName || !this.sasToken) {
        throw new Error("Azure Storage credentials are not configured");
      }

      return this.getFullUrl(videoId);
    } catch (error) {
      console.error('Error getting video URL:', error);
      throw new Error('Failed to get video URL');
    }
  }

  async getThumbnailUrl(thumbnailId: string): Promise<string> {
    try {
      if (!this.accountName || !this.sasToken) {
        throw new Error("Azure Storage credentials are not configured");
      }

      return this.getFullUrl(`thumbnails/${thumbnailId}`);
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