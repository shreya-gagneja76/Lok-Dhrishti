from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum
import os, shutil, uuid

from database import get_db
from models import Complaint, User
from routes.auth import get_current_user, require_admin, send_email

router = APIRouter(tags=["Complaints"])

# ================= UPLOAD FOLDER =================
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ================= STATUS ENUM =================

class ComplaintStatus(str, Enum):
    Pending    = "Pending"
    InProgress = "In Progress"
    Resolved   = "Resolved"
    Rejected   = "Rejected"

# ================= SCHEMAS =================

class ComplaintUpdate(BaseModel):
    status: ComplaintStatus

class ComplaintResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    location: str
    latitude: Optional[float]
    longitude: Optional[float]
    media_url: Optional[str]
    user_email: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ================= CREATE COMPLAINT (with image/video + map) =================

@router.post("/complaints", response_model=ComplaintResponse)
async def create_complaint(
    title:       str  = Form(...),
    description: str  = Form(...),
    category:    str  = Form(...),
    location:    str  = Form(...),
    latitude:    Optional[float] = Form(None),
    longitude:   Optional[float] = Form(None),
    media:       Optional[UploadFile] = File(None),
    db:          Session = Depends(get_db),
    current_user: User   = Depends(get_current_user)
):
    media_url = None

    # Save uploaded file if provided
    if media and media.filename:
        ext = os.path.splitext(media.filename)[1].lower()
        allowed = {".jpg", ".jpeg", ".png", ".gif", ".mp4", ".mov", ".avi", ".webm"}
        if ext not in allowed:
            raise HTTPException(status_code=400, detail="File type not allowed. Use image or video files.")

        filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(media.file, f)
        media_url = f"/uploads/{filename}"

    new_complaint = Complaint(
        title=title,
        description=description,
        category=category,
        location=location,
        latitude=latitude,
        longitude=longitude,
        media_url=media_url,
        user_email=current_user.email,
        status=ComplaintStatus.Pending
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # Notify citizen
    send_email(
        to_email=current_user.email,
        subject="Lok Dhrishti — Complaint Submitted Successfully",
        body=f"""<h2>Complaint Received!</h2>
        <p>Hi {current_user.username},</p>
        <p>Your complaint <b>#{new_complaint.id}: {title}</b> has been submitted successfully.</p>
        <p><b>Category:</b> {category}<br>
        <b>Location:</b> {location}<br>
        <b>Status:</b> Pending</p>
        <p>We will notify you when there is an update.</p>
        <br><p>— Team Lok Dhrishti</p>"""
    )

    return new_complaint

# ================= GET COMPLAINTS =================

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return db.query(Complaint).filter(
        Complaint.user_email == current_user.email
    ).order_by(Complaint.created_at.desc()).all()

# ================= ADMIN UPDATE STATUS =================

@router.put("/admin/complaints/{complaint_id}")
def update_complaint_status(
    complaint_id: int,
    update_data: ComplaintUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = update_data.status
    db.commit()

    # Notify citizen about status change
    citizen = db.query(User).filter(User.email == complaint.user_email).first()
    if citizen:
        status_colors = {
            "Pending":     "#6b7280",
            "In Progress": "#f59e0b",
            "Resolved":    "#10b981",
            "Rejected":    "#ef4444",
        }
        color = status_colors.get(update_data.status, "#6b7280")
        send_email(
            to_email=citizen.email,
            subject=f"Lok Dhrishti — Complaint #{complaint_id} Status Updated",
            body=f"""<h2>Complaint Status Update</h2>
            <p>Hi {citizen.username},</p>
            <p>Your complaint <b>#{complaint_id}: {complaint.title}</b> has been updated.</p>
            <p><b>Previous Status:</b> {old_status}<br>
            <b>New Status:</b> <span style="color:{color};font-weight:bold">{update_data.status}</span></p>
            {"<p>Great news — your complaint has been resolved!</p>" if update_data.status == "Resolved" else ""}
            <br><p>— Team Lok Dhrishti</p>"""
        )

    return {"message": f"Complaint status updated to {update_data.status}"}

# ================= DELETE COMPLAINT (admin) =================

@router.delete("/admin/complaints/{complaint_id}")
def delete_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Delete media file if exists
    if complaint.media_url:
        file_path = complaint.media_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(complaint)
    db.commit()
    return {"message": "Complaint deleted"}
