# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routes import router as reservation_router
from app.database import client

# Lifecycle event to manage database connection
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Print a message or check connection
    print("Starting up... Connected to MongoDB Atlas")
    yield
    # Shutdown: Close connection
    client.close()

app = FastAPI(lifespan=lifespan)

# Include the reservation routes
app.include_router(reservation_router)

@app.get("/")
def read_root():
    return {"message": "Hotel Reservation Microservice is Running"}