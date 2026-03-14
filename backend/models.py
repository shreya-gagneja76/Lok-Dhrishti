from sqlalchemy import Column, Integer, String, DateTime, Float
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id                 = Column(Integer, primary_key=True, index=True)
    username           = Column(String, nullable=False)
    email              = Column(String, unique=True, index=True, nullable=False)
    password           = Column(String, nullable=False)
    role               = Column(String, default="user")
    reset_token        = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)

class Complaint(Base):
    __tablename__ = "complaints"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category    = Column(String, nullable=False)
    location    = Column(String, nullable=False)
    latitude    = Column(Float, nullable=True)   # NEW: map pin
    longitude   = Column(Float, nullable=True)   # NEW: map pin
    media_url   = Column(String, nullable=True)  # NEW: image/video
    user_email  = Column(String, nullable=False)
    status      = Column(String, default="Pending")
    created_at  = Column(DateTime, default=datetime.utcnow)
