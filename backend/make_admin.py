import os
os.environ['DATABASE_URL'] = 'postgresql://lok_dhrishti_db_user:NzJyZ5FAYrNJBSoYTN1dBGuXiC6q4sGz@dpg-d6qko515pdvs73bcciqg-a/lok_dhrishti_db'

from database import SessionLocal
from models import User
from routes.auth import hash_password

db = SessionLocal()

user = db.query(User).filter(User.email == 'admin@lokdhrishti.com').first()

if user:
    user.role = 'admin'
    user.password = hash_password('admin123')
    db.commit()
    print(f'Updated! Email: {user.email}, Role: {user.role}')
else:
    admin = User(
        username='admin',
        email='admin@lokdhrishti.com',
        password=hash_password('admin123'),
        role='admin'
    )
    db.add(admin)
    db.commit()
    print('Admin created!')

db.close()