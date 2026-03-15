from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from pydantic import BaseModel
import bcrypt
import os
import urllib.request
import urllib.error
import json

from database import get_db
from models import User

router = APIRouter(tags=["Authentication"])

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey123lokdhrishti")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
MAIL_FROM = "Lok Dhrishti <onboarding@resend.dev>"

def send_email(to_email: str, subject: str, body: str):
    if not RESEND_API_KEY:
        print(f"[EMAIL SKIPPED] No Resend API key")
        return
    try:
        payload = json.dumps({
            "from": MAIL_FROM,
            "to": [to_email],
            "subject": subject,
            "html": body
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as res:
            print(f"[EMAIL SENT] To: {to_email} | Status: {res.status}")
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")

# ================= PYDANTIC MODELS =================
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# ================= PASSWORD UTILS =================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# ================= TOKEN UTILS =================
def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=expires_minutes)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ================= AUTH DEPENDENCIES =================
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ================= REGISTER =================
@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        username=request.username,
        email=request.email,
        password=hash_password(request.password),
        role="user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    send_email(
        request.email,
        "Welcome to Lok Dhrishti!",
        f"""<h2>Welcome to Lok Dhrishti, {request.username}!</h2>
        <p>Your account has been created successfully.</p>
        <p>You can now submit civic complaints and track their resolution.</p>
        <br><p>— Team Lok Dhrishti</p>"""
    )
    return {"message": "User registered successfully"}

# ================= LOGIN =================
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "username": user.username
    }

# ================= GET CURRENT USER =================
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role
    }

# ================= FORGOT PASSWORD =================
@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        return {"message": "If this email is registered, a reset link has been sent."}
    token = create_access_token({"sub": user.email, "type": "reset"}, expires_minutes=15)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password/{token}"
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    send_email(
        user.email,
        "Lok Dhrishti — Reset Your Password",
        f"""<h2>Password Reset Request</h2>
        <p>Hi {user.username},</p>
        <p>Click the link below to reset your password. Expires in <b>15 minutes</b>.</p>
        <p><a href="{reset_link}" style="background:#1d4ed8;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a></p>
        <p>If you did not request this, ignore this email.</p>
        <br><p>— Team Lok Dhrishti</p>"""
    )
    return {"message": "If this email is registered, a reset link has been sent."}

# ================= RESET PASSWORD =================
@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email or payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter(User.email == email).first()
    if not user or user.reset_token != request.token:
        raise HTTPException(status_code=400, detail="Invalid token")
    if user.reset_token_expiry and datetime.utcnow() > user.reset_token_expiry:
        raise HTTPException(status_code=400, detail="Token expired")
    user.password = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    send_email(
        user.email,
        "Lok Dhrishti — Password Changed",
        f"""<h2>Password Changed Successfully</h2>
        <p>Hi {user.username}, your password was reset successfully.</p>
        <br><p>— Team Lok Dhrishti</p>"""
    )
    return {"message": "Password reset successful"}