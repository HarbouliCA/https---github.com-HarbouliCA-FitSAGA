const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load from .env.local instead of .env
dotenv.config({ path: '.env.local' });

// Debug - print values to check (remove in production)
console.log('Account Name:', process.env.AZURE_STORAGE_ACCOUNT_NAME);
console.log('Container Name:', process.env.AZURE_STORAGE_CONTAINER_NAME);
console.log('Account Key exists:', process.env.AZURE_STORAGE_ACCOUNT_KEY ? 'Yes' : 'No');

// Azure Storage configuration
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const containerName = 'sagafitvideos';

// Local directory containing videos
const videoDirectory = process.argv[2] || './videos';

// Create a shared key credential
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

// Create the BlobServiceClient
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

// Get a reference to the container
const containerClient = blobServiceClient.getContainerClient(containerName);

async function uploadVideos() {
  console.log(`Starting upload of videos from ${videoDirectory} to ${containerName} container...`);
  
  // Validate environment variables
  if (!accountName || !accountKey) {
    console.error('Missing Azure Storage credentials. Please check your environment variables.');
    process.exit(1);
  }
  
  // Validate video directory
  if (!fs.existsSync(videoDirectory)) {
    console.error(`Directory ${videoDirectory} does not exist.`);
    process.exit(1);
  }
  
  try {
    // Check if container exists, create if it doesn't
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      console.log(`Container ${containerName} does not exist. Creating...`);
      await containerClient.create();
      console.log(`Container ${containerName} created.`);
    }
    
    // Get all files recursively
    const getAllFiles = (dirPath, arrayOfFiles = []) => {
      const files = fs.readdirSync(dirPath);
      
      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
          arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
          // Only include video files
          const ext = path.extname(filePath).toLowerCase();
          if (['.mp4', '.mov', '.avi', '.wmv', '.mkv'].includes(ext)) {
            arrayOfFiles.push(filePath);
          }
        }
      });
      
      return arrayOfFiles;
    };
    
    const videoFiles = getAllFiles(videoDirectory);
    const totalFiles = videoFiles.length;
    console.log(`Found ${totalFiles} video files to upload.`);
    
    if (totalFiles === 0) {
      console.log('No video files found. Exiting.');
      return;
    }
    
    // Upload each file
    let uploadedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < videoFiles.length; i++) {
      const filePath = videoFiles[i];
      try {
        // Create a relative path for the blob name (to preserve folder structure)
        const relativePath = path.relative(videoDirectory, filePath);
        const blobName = relativePath.replace(/\\/g, '/'); // Use forward slashes for blob names
        
        console.log(`[${i+1}/${totalFiles}] Uploading ${filePath} to ${blobName}...`);
        
        // Create blob client
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        // Use stream upload instead of loading entire file into memory
        const fileStream = fs.createReadStream(filePath);
        const fileSize = fs.statSync(filePath).size;
        
        await blockBlobClient.uploadStream(fileStream, undefined, undefined, {
          metadata: {
            fileName: path.basename(filePath),
            uploadDate: new Date().toISOString()
          }
        });
        
        console.log(`✓ Uploaded ${blobName} successfully (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
        uploadedCount++;
      } catch (error) {
        console.error(`✗ Error uploading ${filePath}:`, error?.message || String(error));
        errorCount++;
      }
    }
    
    console.log(`\nUpload complete. Results:`);
    console.log(`- Successfully uploaded: ${uploadedCount}/${totalFiles} files`);
    console.log(`- Failed uploads: ${errorCount}/${totalFiles} files`);
    
    if (errorCount > 0) {
      console.log('Some files failed to upload. Please check the logs for details.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error in upload process:', error?.message || String(error));
    process.exit(1);
  }
}

uploadVideos().catch((error) => {
  console.error('Unhandled error:', error?.message || String(error));
  process.exit(1);
}); 