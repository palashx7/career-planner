from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Job Profile Schemas
class JobProfileCreate(BaseModel):
    role: str
    country: str

class JobProfileResponse(JobProfileCreate):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Market Requirements Schemas
class MarketRequirementResponse(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str]

    class Config:
        from_attributes = True

class ResumeRewriteRequest(BaseModel):
    bullet_point: str
    strengths: List[str]

class ResumeGenerateRequest(BaseModel):
    base_resume_text: str = ""

# Interview Schemas
class ChatMessage(BaseModel):
    role: str # "user" or "model"
    text: str

class InterviewChatRequest(BaseModel):
    history: List[ChatMessage]
    newMessage: str

# Experience Journal Schemas
class JournalCreate(BaseModel):
    title: str
    notes: str
    requirement_id: Optional[int] = None

class JournalResponse(BaseModel):
    id: int
    title: str
    notes: str
    requirement_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Self Assessment Schemas
class AssessmentItem(BaseModel):
    requirement_id: int
    rating: int # 0-5
    reason: str

class SelfAssessmentCreate(BaseModel):
    assessments: List[AssessmentItem]

# Dashboard & Progress Schemas
class ProgressTaskResponse(BaseModel):
    id: int
    title: str
    description: str
    month_target: int
    week_target: Optional[int]
    task_type: str
    is_completed: bool

    class Config:
        from_attributes = True

class DashboardSummaryResponse(BaseModel):
    active_profile: Optional[JobProfileResponse]
    progress_percentage: float # Calculated as completed tasks / total tasks
    total_requirements_analyzed: int
    strengths_identified: int # Assessments >= 4
    gaps_identified: int # Assessments <= 2
    upcoming_tasks: List[ProgressTaskResponse] # Tasks for current month/week
