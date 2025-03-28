const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const csvParser = require('csv-parser');

// Load from .env.local instead of .env
dotenv.config({ path: '.env.local' });

// Azure Storage configuration
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const containerName = 'sagathumbnails';

// CSV files
const metadataFile = process.argv[2] || './complete-metadata.csv';
const baseDirectory = process.argv[3] || './src/assets/videofitness';
const outputFile = process.argv[4] || './azure-metadata.csv';

// Create the Azure clients
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Debug mode
const DEBUG = true;

async function uploadThumbnails() {
  console.log(`Starting upload of thumbnails...`);
  
  // Validate environment variables and files
  if (!accountName || !accountKey) {
    console.error('Missing Azure Storage credentials. Please check your environment variables.');
    process.exit(1);
  }
  
  if (!fs.existsSync(metadataFile)) {
    console.error(`Metadata file ${metadataFile} does not exist.`);
    process.exit(1);
  }
  
  try {
    // Check if container exists, create if it doesn't
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      console.log(`Container ${containerName} does not exist. Creating...`);
      await containerClient.create();
      console.log(`Container ${containerName} created with private access.`);
    }
    
    // Read the metadata CSV directly
    console.log(`Processing metadata from ${metadataFile}...`);
    
    const metadataRows = [];
    const header = fs.readFileSync(metadataFile, 'utf8').split('\n')[0];
    
    // Parse the CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(metadataFile)
        .pipe(csvParser({
          headers: ['name', 'path', 'activity', 'type', 'bodyPart', 'description', 'thumbnailUrl'],
          skipLines: 1
        }))
        .on('data', (data) => metadataRows.push(data))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`Read ${metadataRows.length} rows from metadata CSV`);
    
    if (DEBUG) {
      console.log(`First few rows:`);
      for (let i = 0; i < Math.min(3, metadataRows.length); i++) {
        console.log(JSON.stringify(metadataRows[i]));
      }
    }
    
    // Collect thumbnails to upload (those that have a local path but not a URL)
    const thumbnailsToUpload = [];
    
    for (let i = 0; i < metadataRows.length; i++) {
      const row = metadataRows[i];
      
      // Skip if there's already a URL (starts with http)
      if (row.thumbnailUrl && row.thumbnailUrl.toLowerCase().startsWith('http')) {
        continue;
      }
      
      // Check if there's a local thumbnail path
      if (row.thumbnailUrl && row.thumbnailUrl.trim() !== '') {
        const thumbnailPath = path.join(baseDirectory, row.thumbnailUrl.trim());
        
        if (fs.existsSync(thumbnailPath)) {
          thumbnailsToUpload.push({
            videoName: row.name,
            thumbnailPath: thumbnailPath,
            relativePath: row.thumbnailUrl.trim(),
            index: i
          });
        } else if (DEBUG) {
          console.log(`Thumbnail path exists in CSV but file not found: ${thumbnailPath}`);
        }
      }
    }
    
    console.log(`Found ${thumbnailsToUpload.length} thumbnails to upload out of ${metadataRows.length} videos.`);
    
    if (thumbnailsToUpload.length === 0) {
      console.log("No thumbnails found to upload. Exiting.");
      return;
    }
    
    // Upload thumbnails to Azure
    console.log(`Uploading ${thumbnailsToUpload.length} thumbnails to Azure...`);
    
    let uploadedCount = 0;
    let errorCount = 0;
    const updatedRows = [...metadataRows];
    
    for (let i = 0; i < thumbnailsToUpload.length; i++) {
      const { videoName, thumbnailPath, relativePath, index } = thumbnailsToUpload[i];
      
      try {
        if (!fs.existsSync(thumbnailPath)) {
          console.error(`File not found: ${thumbnailPath}`);
          errorCount++;
          continue;
        }
        
        console.log(`[${i+1}/${thumbnailsToUpload.length}] Uploading ${relativePath} for video "${videoName}"...`);
        
        // Create blob client
        const blobName = relativePath;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        // Use stream upload
        const fileStream = fs.createReadStream(thumbnailPath);
        const fileSize = fs.statSync(thumbnailPath).size;
        
        await blockBlobClient.uploadStream(fileStream, undefined, undefined, {
          blobHTTPHeaders: {
            blobContentType: 'image/' + path.extname(thumbnailPath).substring(1)
          },
          metadata: {
            fileName: path.basename(thumbnailPath),
            videoName: videoName,
            uploadDate: new Date().toISOString()
          }
        });
        
        // Generate SAS token for the blob
        const sasUrl = await generateSasUrl(blockBlobClient);
        
        console.log(`✓ Uploaded ${relativePath} successfully (${(fileSize / 1024).toFixed(2)} KB)`);
        
        // Update the metadata row with the Azure URL
        updatedRows[index].thumbnailUrl = sasUrl;
        
        uploadedCount++;
      } catch (error) {
        console.error(`✗ Error uploading ${thumbnailPath}:`, error.message);
        errorCount++;
      }
    }
    
    // Write updated metadata to output file
    if (uploadedCount > 0 && outputFile) {
      const csvContent = [header];
      
      for (const row of updatedRows) {
        const values = Object.values(row).map(val => {
          if (val && typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val || '';
        });
        csvContent.push(values.join(','));
      }
      
      fs.writeFileSync(outputFile, csvContent.join('\n'));
      console.log(`\nUpdated metadata CSV written to ${outputFile} with Azure URLs.`);
    }
    
    console.log(`\nUpload complete. Results:`);
    console.log(`- Successfully uploaded: ${uploadedCount}/${thumbnailsToUpload.length} thumbnails`);
    console.log(`- Failed uploads: ${errorCount}/${thumbnailsToUpload.length} thumbnails`);
    
    if (errorCount > 0) {
      console.log('Some files failed to upload. Please check the logs for details.');
    }
  } catch (error) {
    console.error('Error in upload process:', error.message);
    process.exit(1);
  }
}

// Helper functions for SAS URL generation (unchanged)
async function generateSasUrl(blockBlobClient) {
  const startsOn = new Date();
  const expiresOn = new Date(startsOn);
  expiresOn.setFullYear(expiresOn.getFullYear() + 10); // Valid for 10 years
  
  const sasOptions = {
    containerName: containerName,
    blobName: blockBlobClient.name,
    permissions: "r", // Read permission only
    startsOn: startsOn,
    expiresOn: expiresOn,
  };
  
  const sasToken = await generateBlobSasToken(
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
  process.exit(1);
}); 