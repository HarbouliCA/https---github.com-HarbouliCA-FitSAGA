# Fixing CORS Issues with Firebase Storage

This document explains how to fix the CORS (Cross-Origin Resource Sharing) issues when uploading images to Firebase Storage from your local development environment.

## The Problem

You're encountering CORS errors when trying to upload images to Firebase Storage:

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/v0/b/saga-fitness.firebasestorage.app/o?name=tutorials%2F...' 
from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

## Solutions

### 1. Update Firebase Storage Rules

If you're still experiencing CORS issues, try updating your Firebase Storage rules:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (saga-fitness)
3. Navigate to Storage in the left sidebar
4. Click on the "Rules" tab
5. Update your rules to allow uploads from authenticated users:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow read/write access to authenticated users
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. Configure CORS for Firebase Storage

If updating the rules doesn't solve the issue, you need to configure CORS for your Firebase Storage bucket:

1. Install the Firebase CLI if you haven't already:
   ```
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```
   firebase login
   ```

3. Create a `cors.json` file with the following content:
   ```json
   [
     {
       "origin": ["http://localhost:3000"],
       "method": ["GET", "POST", "PUT", "DELETE"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

4. Set the CORS configuration for your storage bucket:
   ```
   gsutil cors set cors.json gs://saga-fitness.firebasestorage.app
   ```

### 3. Using the ImageUploader Component

We've created a reusable `ImageUploader` component at `src/components/ui/ImageUploader.tsx` that:
- Handles image uploads with proper progress tracking
- Provides better error handling and user feedback
- Shows a preview of the uploaded image
- Makes image uploads optional

To use the `ImageUploader` component, follow these steps:

```jsx
import ImageUploader from '@/components/ui/ImageUploader';

// In your component:
const [imageUrl, setImageUrl] = useState('');

const handleImageUploaded = (url: string) => {
  setImageUrl(url);
};

const handleImageError = (errorMessage: string) => {
  setError(`Image upload error: ${errorMessage}`);
};

// In your JSX:
<ImageUploader 
  folder="tutorials"
  onImageUploaded={handleImageUploaded}
  onError={handleImageError}
/>
```

### 4. Additional Notes

- Make sure your Firebase project is properly configured with the correct API keys and permissions
- Ensure you're properly authenticated before attempting to upload files
- For production, consider implementing more restrictive Storage rules to enhance security
