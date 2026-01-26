from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from bson import ObjectId

class ReservationCreate(BaseModel):
    room_id: str
    user_id: str
    start_date: date
    end_date: date

    class Config:
        json_schema_extra = {
            "example": {
                "room_id": "101",
                "user_id": "user_123",
                "start_date": "2024-02-01",
                "end_date": "2024-02-05"
            }
        }

class ReservationResponse(ReservationCreate):
    id: str
    status: str

# --- NEW ROOM SCHEMAS ---
class RoomCreate(BaseModel):
    room_number: str
    room_type: str  # e.g., "Single", "Suite", "Sea View"
    price: float

class RoomResponse(RoomCreate):
    id: str