from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Profile Extensions
    full_name = Column(String, nullable=True) # Allowed null for initial rapid signup
    role = Column(String, default="student") # "student" or "admin"
    base_country = Column(String, nullable=True) # Country tracking
    
    # Differentiate between normal and college students
    is_college_student = Column(Boolean, default=False)
    college_name = Column(String, nullable=True)
    
    # Profile & settings basic tracking
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False) # For college students 

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    otps = relationship("OTP", back_populates="user", cascade="all, delete-orphan")
    job_profiles = relationship("JobProfile", back_populates="user", cascade="all, delete-orphan")
    journals = relationship("ExperienceJournal", back_populates="user", cascade="all, delete-orphan")
