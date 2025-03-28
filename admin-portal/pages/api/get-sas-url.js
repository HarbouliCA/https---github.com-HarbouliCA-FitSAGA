import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

export default async function handler(req, res) {
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  try {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    
    if (!accountName || !accountKey || !containerName) {
      throw new Error('Azure Storage credentials are not properly configured');
    }
    
    // Create shared key credential
    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    // Create SAS token with read permission
    const sasOptions = {
      containerName,
      blobName: path,
      permissions: BlobSASPermissions.parse("r"), // Read only
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000) // Expires in 1 hour
    };

    // Generate the SAS token
    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();

    // Construct the full URL
    const sasUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${path}?${sasToken}`;
    
    // Return the SAS URL
    res.status(200).json({ url: sasUrl });
    
  } catch (error) {
    console.error('Error generating SAS URL:', error);
    res.status(500).json({ error: 'Failed to generate SAS URL' });
  }
} 