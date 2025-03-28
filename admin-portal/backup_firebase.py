import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import datetime

# Initialize Firebase
cred = credentials.Certificate(r'D:\My Startup Projects\fitsaga\admin-portal\scripts\credentials.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Export the videos collection
videos_ref = db.collection('videos')
videos = videos_ref.get()

backup_data = {}
for video in videos:
    backup_data[video.id] = video.to_dict()

# Save to a timestamped file
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
with open(f'firebase_videos_backup_{timestamp}.json', 'w') as f:
    json.dump(backup_data, f, indent=2)

print(f"Backup complete. Saved {len(backup_data)} video documents.") 