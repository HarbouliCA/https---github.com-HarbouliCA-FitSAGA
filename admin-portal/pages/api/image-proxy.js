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
      const [basePath, sasToken] = path.split('?');
      url = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/sagathumbnails/${basePath}?${sasToken}`;
      console.log('Using direct URL with existing SAS token');
    } else {
      // Use the latest SAS token from environment variables
      const sasToken = process.env.AZURE_SAS_TOKEN;
      if (!sasToken) {
        throw new Error('Azure SAS token is not configured');
      }

      // Construct the URL with the new SAS token
      url = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/sagathumbnails/${path}?${sasToken}`;
    }
    
    console.log('Accessing URL:', url);
    
    // Fetch the blob using the URL
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch blob:', response.status, response.statusText);
      throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('Content-Type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send the buffer as the response
    res.send(Buffer.from(arrayBuffer));
    
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve image' });
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