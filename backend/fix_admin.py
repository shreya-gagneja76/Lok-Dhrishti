import os
os.environ['DATABASE_URL'] = 'postgresql://lok_dhrishti_db_user:NzJyZ5FAYrNJBSoYTN1dBGuXiC6q4sGz@dpg-d6qko515pdvs73bcciqg-a.singapore-postgres.render.com/lok_dhrishti_db'

from database import SessionLocal
from models import User

db = SessionLocal()
user = db.query(User).filter(User.email == 'admin@lokdhrishti.com').first()
if user:
    user.role = 'admin'
    db.commit()
    print('Done! Role updated to:', user.role)
else:
    print('User not found!')
db.close()