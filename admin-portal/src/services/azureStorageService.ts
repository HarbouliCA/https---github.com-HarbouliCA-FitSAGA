import { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions } from '@azure/storage-blob';

class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string = 'sagafitvideos';

  constructor() {
    const accountName = process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_NAME || '';
    const accountKey = process.env.NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_KEY || '';
    
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
  }

  async getVideoUrl(videoId: string): Promise<string> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlobClient(videoId);
      
      const permissions = new BlobSASPermissions();
      permissions.read = true;
      
      // Generate a SAS token that expires in 1 hour
      const sasUrl = await blobClient.generateSasUrl({
        permissions: permissions,
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000),
      });
      
      return sasUrl;
    } catch (error) {
      console.error('Error getting video URL:', error);
      throw new Error('Failed to get video URL');
    }
  }

  async getThumbnailUrl(thumbnailId: string): Promise<string> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlobClient(`thumbnails/${thumbnailId}`);
      
      const permissions = new BlobSASPermissions();
      permissions.read = true;
      
      // Generate a SAS token that expires in 1 hour
      const sasUrl = await blobClient.generateSasUrl({
        permissions: permissions,
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000),
      });
      
      return sasUrl;
    } catch (error) {
      console.error('Error getting thumbnail URL:', error);
      throw new Error('Failed to get thumbnail URL');
    }
  }
}

const azureStorageService = new AzureStorageService();
export default azureStorageService; 