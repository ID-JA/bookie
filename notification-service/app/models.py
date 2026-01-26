from pydantic import BaseModel, EmailStr
from typing import Optional, Literal

class NotificationRequest(BaseModel):
    email: EmailStr
    name: str = "Guest"
    type: Literal['reservation', 'cancellation', 'checkout', 'init']
    
    # Optional fields if we want to allow custom messages in the future, 
    # but for now logic is hardcoded based on type as per original script
