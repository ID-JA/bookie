import os
import certifi
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')

try:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client.get_database()
    logs_collection = db['email_logs']
    print(f"✅ Connected to MongoDB Atlas: {db.name}")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    # In a real app we might not want to exit strictly, but for now we follow pattern
    # sys.exit(1) 
    pass

def get_logs_collection():
    return logs_collection
