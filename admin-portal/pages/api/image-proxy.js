import { BlobServiceClient } from '@azure/storage-blob';

export default async function handler(req, res) {
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  try {
    // Check if the path already contains a SAS token
    const hasSasToken = path.includes('?sv=');
    
    let url;
    
    if (hasSasToken) {
      // If path already has SAS token, use it directly
      // We don't need the Azure BlobClient in this case
      url = `https://sagafit.blob.core.windows.net/sagathumbnails/${path}`;
      console.log('Using direct URL with existing SAS token');
    } else {
      // Connect to Azure using environment variables
      const connectionString = process.env.local.AZURE_STORAGE_CONNECTION_STRING;
      const containerName = 'sagathumbnails';
      
      // Initialize the BlobServiceClient
      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      const containerClient = blobServiceClient.getContainerClient(containerName);
      
      // Encode the path only once
      const encodedPath = encodeURIComponent(path);
      const blobClient = containerClient.getBlobClient(encodedPath);
      
      // Append SAS token to the URL
      const sasToken = process.env.local.AZURE_SAS_TOKEN;
      url = `${blobClient.url}?${sasToken}`;
    }
    
    console.log('Full URL:', url);
    
    // Fetch the blob using the URL
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch blob:', response.status, response.statusText);
      throw new Error('Failed to fetch blob');
    }
    
    const contentType = response.headers.get('Content-Type');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    response.body.pipe(res);
    
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
}

function getVideoThumbnailUrl(videoId, videoName) {
  // Extract the user ID and folder from the video path if needed
  const userId = videoId.split('_')[0]; // Assuming ID format like 10011090_18687781
  const folder = "día 1"; // You might need to determine this dynamically
  
  // Construct the thumbnail URL with SAS token
  const sasToken = "sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupyx&se=2026-03-28T00:57:42Z&st=2025-03-27T16:57:42Z&spr=https&sig=1JGypgmG5KAhlZkzw1IpNlzNSf30ysb4PA3PJYh4bAo%3D";
  
  // You might need to determine the thumbnail filename based on the video name
  // This example assumes thumbnails are PNG with same base name as video
  const thumbnailFilename = videoName.replace('.mp4', '.png');
  
  return `https://sagafit.blob.core.windows.net/sagathumbnails/${userId}/${encodeURIComponent(folder)}/images/${thumbnailFilename}?${sasToken}`;
} 