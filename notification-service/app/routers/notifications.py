from fastapi import APIRouter, HTTPException
from app.models import NotificationRequest
from app.services.notification import process_and_send_notification

router = APIRouter()

@router.post("/send", summary="Send a notification")
def send_notification(request: NotificationRequest):
    """
    Send a notification via email.
    """
    data = request.model_dump()
    success = process_and_send_notification(data)
    
    if not success:
        # We return 500 if email sending fails, or maybe 202 if we just queued it?
        # For now, strict failure since it's synchronous
        raise HTTPException(status_code=500, detail="Failed to send notification")
    
    return {"message": "Notification sent successfully"}
