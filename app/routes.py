# app/routes.py
# from app.database import booking_collection
from app.schemas import ReservationCreate, ReservationResponse
from fastapi import APIRouter, HTTPException, Query
from app.database import booking_collection, room_collection # Updated imports
from app.schemas import ReservationCreate, ReservationResponse, RoomCreate, RoomResponse
from datetime import date
from typing import List
from bson import ObjectId          # <--- REQUIRED for ObjectId(reservation_id)
from bson.errors import InvalidId # <--- Required to handle bad IDs
router = APIRouter()

# to use the api => http://localhost:8000/api/rooms /http://localhost:8000/api/reservations
# --- ROOM ROUTES ---

# 1. Add a new room to the hotel
@router.post("/rooms/", response_model=RoomResponse)
async def create_room(room: RoomCreate):
    # Check if room number already exists
    existing = await room_collection.find_one({"room_number": room.room_number})
    if existing:
        raise HTTPException(status_code=400, detail="Room number already exists")
    
    new_room = room.model_dump()
    result = await room_collection.insert_one(new_room)
    return {**new_room, "id": str(result.inserted_id)}

# 2. Find Available Rooms (The "Search Engine")
@router.get("/rooms/available", response_model=List[RoomResponse])
async def get_available_rooms(
    start_date: date = Query(...), 
    end_date: date = Query(...)
):
    # STEP 1: Find all rooms that are BOOKED during these dates
    # We look for any booking that overlaps with the requested range
    busy_cursor = booking_collection.find({
        "$or": [
            {
                "start_date": {"$lt": end_date.isoformat()}, 
                "end_date": {"$gt": start_date.isoformat()}
            }
        ],
        "status": {"$ne": "CANCELLED"}
    })
    
    # Create a list of "busy" room_ids
    busy_room_numbers = []
    async for booking in busy_cursor:
        busy_room_numbers.append(booking["room_id"])

    # STEP 2: Find rooms that are NOT in the busy list
    # $nin means "Not In"
    available_cursor = room_collection.find({
        "room_number": {"$nin": busy_room_numbers}
    })

    rooms = []
    async for room in available_cursor:
        rooms.append({**room, "id": str(room["_id"])})
        
    return rooms

@router.post("/reservations/", response_model=ReservationResponse)
async def create_reservation(booking: ReservationCreate):
    # 1. Check for overlapping reservations for this room
    # We query to see if any booking overlaps with the requested dates
    existing_booking = await booking_collection.find_one({
        "room_id": booking.room_id,
        "$or": [
            {
                "start_date": {"$lt": booking.end_date.isoformat()}, 
                "end_date": {"$gt": booking.start_date.isoformat()}
            }
        ],
        "status": {"$ne": "CANCELLED"}
    })
    
    if existing_booking:
        raise HTTPException(status_code=409, detail="Room is already booked for these dates.")

    # 2. Insert new reservation
    # Use model_dump() for Pydantic v2 compatibility
    new_booking = booking.model_dump() 
    
    # Convert dates to strings for MongoDB storage
    new_booking["start_date"] = new_booking["start_date"].isoformat()
    new_booking["end_date"] = new_booking["end_date"].isoformat()
    new_booking["status"] = "CONFIRMED"
    
    result = await booking_collection.insert_one(new_booking)
    
    # Return the new object with the generated ID
    return {**new_booking, "id": str(result.inserted_id)}

# --- USER BOOKINGS ---
@router.get("/reservations/user/{user_id}", response_model=List[ReservationResponse])
async def get_user_reservations(user_id: str):
    reservations = []
    # Find all bookings for this user
    cursor = booking_collection.find({"user_id": user_id})
    
    async for doc in cursor:
        # Convert the MongoDB ObjectId to a string so Pydantic can read it
        doc["id"] = str(doc["_id"])
        reservations.append(doc)
        
    return reservations

# --- CANCEL BOOKING ---
@router.put("/reservations/{reservation_id}/cancel")
async def cancel_reservation(reservation_id: str):
    try:
        # Convert string ID to MongoDB ObjectId
        oid = ObjectId(reservation_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid reservation ID format")

    # Update the status to CANCELLED
    result = await booking_collection.update_one(
        {"_id": oid},
        {"$set": {"status": "CANCELLED"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    return {"message": "Reservation cancelled successfully"}