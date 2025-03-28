import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize Firebase
cred = credentials.Certificate(r'D:\My Startup Projects\fitsaga\admin-portal\scripts\credentials.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Test a simple read operation
collection_ref = db.collection('videoMetadata')
docs = collection_ref.limit(5).get()
logging.info(f"Successfully retrieved {len(list(docs))} documents")

# Test a simple write operation (to a test document)
test_doc = db.collection('script_tests').document('test_doc')
test_doc.set({
    'test_timestamp': firestore.SERVER_TIMESTAMP,
    'test_message': 'Connection is working'
})
logging.info("Successfully wrote test document")

print("Firebase connection test completed successfully") 