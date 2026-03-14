from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

from database import get_db
from models import User

router = APIRouter(tags=["Authentication"])

SECRET_KEY = "supersecretkey123lokdhrishti"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# ================= EMAIL CONFIG =================
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM     = os.getenv("MAIL_FROM", "")

def send_email(to_email: str, subject: str, body: str):
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        print(f"[EMAIL SKIPPED - no credentials] To: {to_email} | {subject}")
        return
    try:
        msg = MIMEMultipart()
        msg["From"]    = MAIL_FROM
        msg["To"]      = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.sendmail(MAIL_FROM, to_email, msg.as_string())
        print(f"[EMAIL SENT] To: {to_email}")
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

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# ================= TOKEN UTILS =================

def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ================= AUTH DEPENDENCIES =================

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

# ================= REGISTER =================

@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        username=request.username,
        email=request.email,
        password=hash_password(request.password),
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_email(
        to_email=request.email,
        subject="Welcome to Lok Dhrishti!",
        body=f"""<h2>Welcome to Lok Dhrishti, {request.username}!</h2>
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )

    return {
        "access_token": access_token,
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
    reset_link = f"http://localhost:3000/reset-password/{token}"

    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    send_email(
        to_email=user.email,
        subject="Lok Dhrishti — Reset Your Password",
        body=f"""<h2>Password Reset Request</h2>
        <p>Hi {user.username},</p>
        <p>Click the link below to reset your password. This link expires in <b>15 minutes</b>.</p>
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
        token_type = payload.get("type")
        if not email or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.reset_token != request.token:
        raise HTTPException(status_code=400, detail="Token already used or invalid")

    if user.reset_token_expiry and datetime.utcnow() > user.reset_token_expiry:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.password = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()

    send_email(
        to_email=user.email,
        subject="Lok Dhrishti — Password Changed Successfully",
        body=f"""<h2>Password Changed</h2>
        <p>Hi {user.username}, your password was reset successfully.</p>
        <p>If you did not do this, please contact us immediately.</p>
        <br><p>— Team Lok Dhrishti</p>"""
    )

    return {"message": "Password reset successful"}
