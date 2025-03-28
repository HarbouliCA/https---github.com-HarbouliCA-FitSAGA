const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const csvParser = require('csv-parser');
const { stringify } = require('csv-stringify/sync');

// Load from .env.local instead of .env
dotenv.config({ path: '.env.local' });

// Azure Storage configuration
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const containerName = 'sagathumbnails';

// Paths
const videoDetailsPath = process.argv[2] || './scripts/video_details_modified.csv';
const baseDirectory = process.argv[3] || './src/assets/videofitness';
const outputPath = process.argv[4] || './azure-thumbnails-result.csv';

// Create the Azure clients
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Debug mode
const DEBUG = true;

// Statistics
const stats = {
  totalEntries: 0,
  thumbnailsFound: 0,
  thumbnailsNotFound: 0,
  thumbnailsUploaded: 0,
  thumbnailsFailedUpload: 0,
  alreadyExisting: 0
};

async function uploadThumbnails() {
  console.log(`Starting thumbnail upload process...`);
  console.log(`Using video details from: ${videoDetailsPath}`);
  console.log(`Base directory: ${baseDirectory}`);
  
  // Validate environment variables and files
  if (!accountName || !accountKey) {
    console.error('Missing Azure Storage credentials. Please check your environment variables.');
    process.exit(1);
  }
  
  if (!fs.existsSync(videoDetailsPath)) {
    console.error(`Video details file ${videoDetailsPath} does not exist.`);
    process.exit(1);
  }
  
  if (!fs.existsSync(baseDirectory)) {
    console.error(`Base directory ${baseDirectory} does not exist.`);
    process.exit(1);
  }
  
  try {
    // Check if container exists, create if it doesn't
    console.log(`Checking if container ${containerName} exists...`);
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      console.log(`Container ${containerName} does not exist. Creating...`);
      await containerClient.create();
      console.log(`Container ${containerName} created with private access.`);
    } else {
      console.log(`Container ${containerName} already exists.`);
    }
    
    // Step 1: Read the modified video details CSV
    console.log(`Reading thumbnail details from ${videoDetailsPath}...`);
    const videoDetails = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(videoDetailsPath)
        .pipe(csvParser())
        .on('data', (data) => videoDetails.push(data))
        .on('end', resolve)
        .on('error', reject);
    });
    
    stats.totalEntries = videoDetails.length;
    console.log(`Read ${videoDetails.length} rows from video details CSV`);
    
    // Step 2: Process each entry and upload thumbnails
    console.log(`Starting thumbnail processing and upload...`);
    
    const results = [];
    
    for (let i = 0; i < videoDetails.length; i++) {
      const entry = videoDetails[i];
      const thumbnailId = entry.ThumbnailId;
      const videoId = entry.videoId;
      const planId = entry.plan_id;
      const dayName = entry.day_name;
      const thumbnailRelativePath = entry.ThumbnailPath;
      
      // Create result entry
      const resultEntry = {
        thumbnailId: thumbnailId,
        videoId: videoId,
        planId: planId,
        dayName: dayName,
        thumbnailFound: false,
        thumbnailUploaded: false,
        thumbnailUrl: ''
      };
      
      console.log(`\n[${i+1}/${videoDetails.length}] Processing: ${videoId} (Thumbnail ID: ${thumbnailId})`);
      
      // Skip if missing critical information
      if (!thumbnailId || !videoId || !planId) {
        console.log(`  - Missing critical information, skipping`);
        results.push(resultEntry);
        continue;
      }
      
      // Find the thumbnail file
      const possibleExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      let thumbnailPath = null;
      let thumbnailExt = null;
      
      // First try to find in the specific path from CSV
      if (thumbnailRelativePath) {
        const imageDir = path.join(baseDirectory, thumbnailRelativePath);
        console.log(`  - Looking for thumbnail in: ${imageDir}`);
        
        if (fs.existsSync(imageDir)) {
          for (const ext of possibleExtensions) {
            const testPath = path.join(imageDir, `${thumbnailId}${ext}`);
            if (fs.existsSync(testPath)) {
              thumbnailPath = testPath;
              thumbnailExt = ext;
              console.log(`  - Found thumbnail: ${testPath}`);
              break;
            }
          }
        } else {
          console.log(`  - Image directory does not exist: ${imageDir}`);
        }
      }
      
      // If not found, try to find in the plan/day directory
      if (!thumbnailPath) {
        const planDayPath = path.join(baseDirectory, planId, dayName);
        const imageDir = path.join(planDayPath, 'images');
        
        console.log(`  - Looking for thumbnail in alternate location: ${imageDir}`);
        
        if (fs.existsSync(imageDir)) {
          for (const ext of possibleExtensions) {
            const testPath = path.join(imageDir, `${thumbnailId}${ext}`);
            if (fs.existsSync(testPath)) {
              thumbnailPath = testPath;
              thumbnailExt = ext;
              console.log(`  - Found thumbnail in alternate location: ${testPath}`);
              break;
            }
          }
        } else {
          console.log(`  - Alternate image directory does not exist: ${imageDir}`);
        }
      }
      
      // Update stats and result
      if (thumbnailPath) {
        stats.thumbnailsFound++;
        resultEntry.thumbnailFound = true;
        
        // Upload to Azure
        try {
          console.log(`  - Uploading thumbnail to Azure...`);
          
          // Create blob name with structure: planId/dayName/images/thumbnailId.ext
          const blobName = `${planId}/${dayName}/images/${thumbnailId}${thumbnailExt}`;
          const blockBlobClient = containerClient.getBlockBlobClient(blobName);
          
          // Check if blob already exists
          const blobExists = await blockBlobClient.exists();
          if (blobExists) {
            console.log(`  - Blob already exists, overwriting: ${blobName}`);
            stats.alreadyExisting++;
          }
          
          // Upload the file with overwrite option
          const uploadOptions = {
            overwrite: true,
            blobHTTPHeaders: {
              blobContentType: `image/${thumbnailExt.substring(1)}` // Remove the dot from extension
            }
          };
          
          await blockBlobClient.uploadFile(thumbnailPath, uploadOptions);
          console.log(`  - Upload successful`);
          
          // Generate SAS URL
          const sasUrl = await generateBlobSasUrl(blockBlobClient);
          console.log(`  - Generated SAS URL with 10-year expiration`);
          
          // Update result
          resultEntry.thumbnailUploaded = true;
          resultEntry.thumbnailUrl = sasUrl;
          stats.thumbnailsUploaded++;
          
        } catch (error) {
          console.error(`  - Error uploading thumbnail: ${error.message}`);
          stats.thumbnailsFailedUpload++;
        }
      } else {
        console.log(`  - No thumbnail found for ${videoId}`);
        stats.thumbnailsNotFound++;
      }
      
      results.push(resultEntry);
      
      // Show progress every 100 items
      if ((i + 1) % 100 === 0 || i === videoDetails.length - 1) {
        console.log(`\nProgress: ${i + 1}/${videoDetails.length} (${Math.round((i + 1) / videoDetails.length * 100)}%)`);
        console.log(`  - Found: ${stats.thumbnailsFound}`);
        console.log(`  - Not found: ${stats.thumbnailsNotFound}`);
        console.log(`  - Uploaded: ${stats.thumbnailsUploaded}`);
        console.log(`  - Failed uploads: ${stats.thumbnailsFailedUpload}`);
        console.log(`  - Overwritten: ${stats.alreadyExisting}`);
      }
    }
    
    // Write results to CSV
    console.log(`\nWriting results to ${outputPath}...`);
    const csvOutput = stringify(results, { header: true });
    fs.writeFileSync(outputPath, csvOutput);
    
    // Final stats
    console.log(`\nUpload process complete.`);
    console.log(`Summary:`);
    console.log(`  - Total entries: ${stats.totalEntries}`);
    console.log(`  - Thumbnails found: ${stats.thumbnailsFound} (${Math.round(stats.thumbnailsFound / stats.totalEntries * 100)}%)`);
    console.log(`  - Thumbnails not found: ${stats.thumbnailsNotFound} (${Math.round(stats.thumbnailsNotFound / stats.totalEntries * 100)}%)`);
    console.log(`  - Thumbnails uploaded: ${stats.thumbnailsUploaded} (${Math.round(stats.thumbnailsUploaded / stats.thumbnailsFound * 100)}% of found)`);
    console.log(`  - Failed uploads: ${stats.thumbnailsFailedUpload}`);
    console.log(`  - Existing thumbnails overwritten: ${stats.alreadyExisting}`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    process.exit(1);
  }
}

async function generateBlobSasUrl(blockBlobClient) {
  // Generate a SAS token that's valid for 10 years
  const startsOn = new Date();
  const expiresOn = new Date(startsOn);
  expiresOn.setFullYear(expiresOn.getFullYear() + 10);
  
  const sasOptions = {
    containerName,
    blobName: blockBlobClient.name,
    permissions: "r", // Read permission only
    startsOn: startsOn,
    expiresOn: expiresOn,
  };
  
  const sasToken = generateBlobSasToken(
    sasOptions,
    sharedKeyCredential
  );
  
  return `${blockBlobClient.url}?${sasToken}`;
}

function generateBlobSasToken(options, credential) {
  const { containerName, blobName, permissions, startsOn, expiresOn } = options;
  
  const signedPermissions = permissions;
  const signedStart = formatDateForSas(startsOn);
  const signedExpiry = formatDateForSas(expiresOn);
  const signedResource = "b"; // b for blob
  
  const canonicalName = `/${accountName}/${containerName}/${blobName}`;
  
  const stringToSign = [
    signedPermissions,
    signedStart,
    signedExpiry,
    canonicalName,
    "", // signed identifier
    "", // signed IP
    "https", // protocol
    "", // signed version
    signedResource
  ].join('\n');
  
  const signature = credential.computeHMACSHA256(stringToSign);
  
  return [
    `sv=2020-08-04`,
    `sr=${signedResource}`,
    `sp=${signedPermissions}`,
    `st=${signedStart}`,
    `se=${signedExpiry}`,
    `spr=https`,
    `sig=${signature}`
  ].join('&');
}

function formatDateForSas(date) {
  return date.toISOString()
    .replace(/\.\d+Z$/, 'Z') // Remove milliseconds
    .replace(/:/g, '%3A')    // Encode colons
    .replace(/\+/g, '%2B');  // Encode plus
}

uploadThumbnails().catch((error) => {
  console.error('Unhandled error:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}); 