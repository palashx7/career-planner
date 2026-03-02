from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

class JobProfile(Base):
    """
    Represents a user's chosen career path and target location.
    """
    __tablename__ = "job_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    role = Column(String, nullable=False)
    country = Column(String, nullable=False)
    
    is_active = Column(Boolean, default=True) # If they switch careers, old profiles become inactive
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="job_profiles")
    market_requirements = relationship("MarketRequirement", back_populates="job_profile", cascade="all, delete-orphan")
    assessments = relationship("SelfAssessment", back_populates="job_profile", cascade="all, delete-orphan")
    tasks = relationship("ProgressTask", back_populates="job_profile", cascade="all, delete-orphan")
    journals = relationship("ExperienceJournal", back_populates="job_profile", cascade="all, delete-orphan")


class MarketRequirement(Base):
    """
    Consolidated findings from market analysis for a specific role/country.
    """
    __tablename__ = "market_requirements"

    id = Column(Integer, primary_key=True, index=True)
    job_profile_id = Column(Integer, ForeignKey("job_profiles.id"), nullable=False, index=True)
    
    name = Column(String, nullable=False) # e.g. "Python", "React", "Communication"
    category = Column(String, nullable=False) # "technical", "soft_skill", "responsibility"
    description = Column(Text, nullable=True) # Why this is needed based on market data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    job_profile = relationship("JobProfile", back_populates="market_requirements")
    assessments = relationship("SelfAssessment", back_populates="market_requirement", cascade="all, delete-orphan")
    journals = relationship("ExperienceJournal", back_populates="market_requirement", cascade="all, delete-orphan")


class SelfAssessment(Base):
    """
    The user's self-rating and justification for a specific market requirement.
    """
    __tablename__ = "self_assessments"

    id = Column(Integer, primary_key=True, index=True)
    job_profile_id = Column(Integer, ForeignKey("job_profiles.id"), nullable=False)
    requirement_id = Column(Integer, ForeignKey("market_requirements.id"), nullable=False)
    
    rating = Column(Integer, nullable=False) # 0 to 5
    reason = Column(Text, nullable=False) # Mandatory justification
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    job_profile = relationship("JobProfile", back_populates="assessments")
    market_requirement = relationship("MarketRequirement", back_populates="assessments")


class ProgressTask(Base):
    """
    Auto-generated actionable tasks forming the 6-month plan.
    """
    __tablename__ = "progress_tasks"

    id = Column(Integer, primary_key=True, index=True)
    job_profile_id = Column(Integer, ForeignKey("job_profiles.id"), nullable=False, index=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    month_target = Column(Integer, nullable=False) # 1 to 6
    week_target = Column(Integer, nullable=True) # Optional week breakdown
    
    task_type = Column(String, default="learning") # "learning", "project", "certification"
    is_completed = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    job_profile = relationship("JobProfile", back_populates="tasks")

class ExperienceJournal(Base):
    """
    User's personal notes mapping their daily tasks to specific market requirements.
    """
    __tablename__ = "experience_journals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_profile_id = Column(Integer, ForeignKey("job_profiles.id"), nullable=False, index=True)
    
    # Optional link to a specific market skill this note proves
    requirement_id = Column(Integer, ForeignKey("market_requirements.id"), nullable=True)
    
    title = Column(String, nullable=False)
    notes = Column(Text, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="journals")
    job_profile = relationship("JobProfile", back_populates="journals")
    market_requirement = relationship("MarketRequirement", back_populates="journals")
