from fastapi import FastAPI
from app.routers import notifications

app = FastAPI(
    title="Notification Service",
    description="Microservice for handling notifications (Email, etc.)",
    version="1.0.0"
)

app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

@app.get("/")
def health_check():
    return {"status": "ok", "service": "notification-service"}
