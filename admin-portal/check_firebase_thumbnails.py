import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import pandas as pd

# Initialize Firebase
cred = credentials.Certificate(r'D:\My Startup Projects\fitsaga\admin-portal\scripts\credentials.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Query the videoMetadata collection
videos_ref = db.collection('videoMetadata')
videos = videos_ref.get()

# Count videos with and without thumbnails
total_count = 0
missing_thumbnail_count = 0
has_thumbnail_count = 0

video_data = []
for video in videos:
    data = video.to_dict()
    video_id = video.id
    total_count += 1
    
    thumbnail_url = data.get('thumbnailUrl', '')
    if not thumbnail_url:
        missing_thumbnail_count += 1
    else:
        has_thumbnail_count += 1
    
    video_data.append({
        'videoId': video_id,
        'name': data.get('name', ''),
        'path': data.get('path', ''),
        'has_thumbnail': bool(thumbnail_url)
    })

# Print the summary
print(f"Total videos: {total_count}")
print(f"Videos with thumbnails: {has_thumbnail_count}")
print(f"Videos missing thumbnails: {missing_thumbnail_count}")

# Create a DataFrame for easier analysis
df = pd.DataFrame(video_data)
print("\nSample of videos missing thumbnails:")
print(df[df['has_thumbnail'] == False].head())

# Check if we can match these against the thumbnails CSV
thumbnails_df = pd.read_csv(r'D:\My Startup Projects\fitsaga\admin-portal\azure-thumbnails-result.csv')
print("\nSample of available thumbnails:")
print(thumbnails_df.head())

# Try to match the first few unmatched videos
print("\nAttempting to match a few videos:")
for i, row in df[df['has_thumbnail'] == False].head().iterrows():
    video_name = row['name']
    # Try different matching strategies
    matches = thumbnails_df[thumbnails_df['videoId'].str.contains(video_name.replace(' ', '_'), case=False)]
    if not matches.empty:
        print(f"Found match for {video_name}: {matches['thumbnailUrl'].iloc[0]}")
    else:
        # Try another approach - match by extracting video name from path
        video_filename = row['path'].split('/')[-1] if '/' in row['path'] else ''
        matches = thumbnails_df[thumbnails_df['videoId'].str.contains(video_filename, case=False)]
        if not matches.empty:
            print(f"Found match using path for {video_name}: {matches['thumbnailUrl'].iloc[0]}")
        else:
            print(f"No match found for {video_name}") 