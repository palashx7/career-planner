import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

from app.database import SessionLocal
from app.models.core import MarketRequirement

def main():
    db = SessionLocal()
    # Delete all dummy 
    rows = db.query(MarketRequirement).all()
    count = len(rows)
    db.query(MarketRequirement).delete()
    db.commit()
    print(f"Deleted {count} old requirement rows.")

if __name__ == "__main__":
    main()
