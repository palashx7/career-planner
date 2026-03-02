import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models.core import *
from app.models.user import *

def recreate():
    print("Generating any missing tables via SQLAlchemy metadata mapping...")
    Base.metadata.create_all(bind=engine)
    print("Operation complete!")

if __name__ == "__main__":
    recreate()
