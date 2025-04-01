import { BlobServiceClient } from '@azure/storage-blob';

export default async function handler(req, res) {
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }
  
  try {
    // Get Azure Storage connection details from environment variables
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'sagafit';
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const sasToken = process.env.AZURE_STORAGE_SAS_TOKEN;
    
    if (!accountKey && !sasToken) {
      return res.status(500).json({ error: 'Missing Azure Storage credentials' });
    }
    
    // Create the BlobServiceClient
    const connectionString = accountKey 
      ? `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`
      : `BlobEndpoint=https://${accountName}.blob.core.windows.net;SharedAccessSignature=${sasToken}`;
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    // Create path variations to try
    const pathVariations = [];

    // Add the direct path requested
    pathVariations.push(path);
    
    // Try to extract parts if path looks like a thumbnail ID
    const thumbnailMatch = path.match(/thumbnails\/(\d+)_(\d+)_(\d{4}_(?:cw|bc)\d{3})/i);
    if (thumbnailMatch) {
      const userId = thumbnailMatch[1];
      const filename = thumbnailMatch[3];
      
      // Try different patterns for thumbnails
      pathVariations.push(`${userId}/día 1/images/${filename}.png`);
    }
    
    // Try these containers in order of likelihood
    const containerNames = ['sagathumbnails', 'sagafitvideos', 'sagafit-thumbnails'];
    
    let foundImage = false;
    let imageData = null;
    
    // Try each container and path combination
    for (const containerName of containerNames) {
      if (foundImage) break;
      
      const containerClient = blobServiceClient.getContainerClient(containerName);
      
      for (const pathVariation of pathVariations) {
        if (foundImage) break;
        
        console.log(`Trying thumbnail: ${containerName}/${pathVariation}`);
        
        try {
          const blobClient = containerClient.getBlobClient(pathVariation);
          const response = await blobClient.download(0);
          
          // If we got here, the blob exists
          console.log(`Found thumbnail in: ${containerName}/${pathVariation}`);
          foundImage = true;
          
          // Read the image data
          const chunks = [];
          const reader = response.readableStreamBody;
          
          if (!reader) {
            continue;
          }
          
          for await (const chunk of reader) {
            chunks.push(chunk);
          }
          
          imageData = Buffer.concat(chunks);
        } catch (err) {
          // Continue to next path if this one fails
          console.log(`Path not found: ${containerName}/${pathVariation}`);
        }
      }
    }
    
    if (!foundImage || !imageData) {
      console.log('No thumbnail found after trying all variations');
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Set cache control headers (cache for 1 day)
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Set content type based on file extension
    const isJpg = path.toLowerCase().endsWith('.jpg') || path.toLowerCase().endsWith('.jpeg');
    const isPng = path.toLowerCase().endsWith('.png');
    
    if (isJpg) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (isPng) {
      res.setHeader('Content-Type', 'image/png');
    } else {
      // Default to jpeg
      res.setHeader('Content-Type', 'image/jpeg');
    }
    
    // Send the image
    return res.send(imageData);
  } catch (error) {
    console.error('Error fetching image:', error);
    return res.status(500).json({ error: 'Failed to fetch image' });
  }
}

// Helper function to generate thumbnail URL using environment variables
export function getVideoThumbnailUrl(videoId, videoName) {
  // Extract the user ID from the video ID if it follows the pattern
  let userId = null;
  const userIdMatch = videoId.match(/^(\d+)_/);
  if (userIdMatch) {
    userId = userIdMatch[1];
  } else if (/^\d+$/.test(videoId.split('.')[0])) {
    // If the videoId is just a number with a file extension
    userId = videoId.split('.')[0];
  }
  
  // Get SAS token from environment variables
  const sasToken = process.env.AZURE_SAS_TOKEN;
  if (!sasToken) {
    throw new Error('Azure SAS token is not configured');
  }
  
  // Get account name
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!accountName) {
    throw new Error('Azure account name is not configured');
  }
  
  // Try to determine the thumbnail filename based on the video ID or name
  let thumbnailFilename;
  if (videoName) {
    // If we have a video name, use it to create the thumbnail name
    thumbnailFilename = videoName.replace(/\.(mp4|mov|avi|wmv)$/i, '.jpg');
  } else {
    // Otherwise, use the videoId
    thumbnailFilename = videoId.replace(/\.(mp4|mov|avi|wmv)$/i, '.jpg');
  }
  
  // Return the proxy URL rather than the direct URL
  return `/api/image-proxy?path=${encodeURIComponent(`thumbnails/${thumbnailFilename}`)}`;
} 