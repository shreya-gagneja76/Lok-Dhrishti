from database import SessionLocal
from models import User
from routes.auth import hash_password

db = SessionLocal()

# Check if admin already exists
existing = db.query(User).filter(User.email == "admin@lokdhrishti.com").first()

if existing:
    # Update role to admin
    existing.role = "admin"
    existing.password = hash_password("admin123")
    db.commit()
    print(f"Updated existing user to admin! Role is now: {existing.role}")
else:
    admin = User(
        username="admin",
        email="admin@lokdhrishti.com",
        password=hash_password("admin123"),
        role="admin"
    )
    db.add(admin)
    db.commit()
    print("Admin created!")

# Verify
user = db.query(User).filter(User.email == "admin@lokdhrishti.com").first()
print(f"Verified — Email: {user.email}, Role: {user.role}")
db.close()