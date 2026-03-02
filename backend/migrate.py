import sys
import os

# Put backend dir in sys path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from sqlalchemy import text

def run_migration():
    db = SessionLocal()
    try:
        print("Running manual migration on users table...")
        
        # Add full_name
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR;"))
            print("Added full_name column.")
        except Exception as e:
            print("full_name column might already exist.")
            db.rollback()

        # Add role
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'student';"))
            print("Added role column.")
        except Exception as e:
            print("role column might already exist.")
            db.rollback()

        # Add base_country
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN base_country VARCHAR;"))
            print("Added base_country column.")
        except Exception as e:
            print("base_country column might already exist.")
            db.rollback()

        db.commit()
        print("Migration complete!")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
