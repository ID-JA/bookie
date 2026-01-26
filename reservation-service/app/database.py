# app/database.py
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Get URI from env, default to localhost if missing
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "reservations")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
booking_collection = db["bookings"] # Using "bookings" as the collection name
room_collection = db["rooms"]       # NEW collection