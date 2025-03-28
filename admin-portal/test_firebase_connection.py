import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

try:
    # Initialize Firebase
    cred_path = r'D:\My Startup Projects\fitsaga\admin-portal\scripts\credentials.json'
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    # Test reading from videoMetadata collection
    collection_ref = db.collection('videoMetadata')
    docs = collection_ref.limit(3).get()
    doc_list = list(docs)
    
    logging.info(f"Successfully connected to Firebase")
    logging.info(f"Retrieved {len(doc_list)} documents from videoMetadata collection")
    
    if len(doc_list) > 0:
        sample_doc = doc_list[0].to_dict()
        logging.info(f"Sample document fields: {', '.join(sample_doc.keys())}")
    
    print("Firebase connection test completed successfully")

except Exception as e:
    logging.error(f"Test failed: {str(e)}")
    logging.exception("Detailed error information:") 