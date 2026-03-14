from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Use DATABASE_URL from environment (PostgreSQL on Render)
# Falls back to SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lokdrishti.db")

# Render gives PostgreSQL URL starting with "postgres://" 
# but SQLAlchemy needs "postgresql://" — fix it
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs special arg, PostgreSQL doesn't
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()