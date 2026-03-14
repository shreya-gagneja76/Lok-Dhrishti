from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from routes.auth import router as auth_router
from routes.complaints import router as complaint_router
from database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

# Create uploads folder
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="Lok Dhrishti API", version="1.0.0")

# CORS — allow both local and deployed frontend
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routes
app.include_router(auth_router, prefix="/api")
app.include_router(complaint_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Lok Dhrishti API is running!"}