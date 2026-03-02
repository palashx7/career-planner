from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.utils.logger import logger
from app.schemas.core import (
    JobProfileCreate, JobProfileResponse,
    MarketRequirementResponse, SelfAssessmentCreate,
    ProgressTaskResponse, ResumeRewriteRequest, ResumeGenerateRequest,
    InterviewChatRequest, JournalCreate, JournalResponse
)
from app.services import market as market_service
from app.services import planner as planner_service
from app.utils.extractors import extract_text_from_file
from app.utils.ai_client import evaluate_resume_skills
from app.models.core import MarketRequirement, ExperienceJournal
from app.services.auth import get_user_by_email # need auth dependency setup
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from app.config import settings

router = APIRouter(prefix="/workflow", tags=["workflow"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Dependency for protecting routes
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == user_email).first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/role", response_model=JobProfileResponse)
def select_role(profile_data: JobProfileCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """User selects target role and country."""
    profile = market_service.create_or_update_job_profile(
        db, current_user.id, profile_data.role, profile_data.country
    )
    return profile

@router.get("/market", response_model=List[MarketRequirementResponse])
def get_market_analysis(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches or generates market requirements for the active profile."""
    profile = market_service.get_active_job_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="No active job profile found. Select a role first.")
        
    requirements = market_service.generate_mock_market_analysis(db, profile)
    return requirements

@router.post("/assessment")
def submit_self_assessment(assessment_data: SelfAssessmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """User submits 0-5 ratings against the market data."""
    profile = market_service.get_active_job_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="No active job profile found.")
        
    planner_service.save_assessments(db, profile, assessment_data)
    return {"msg": "Self assessments saved successfully."}

@router.post("/plan", response_model=List[ProgressTaskResponse])
def generate_6_month_plan(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Analyzes the gap between market reqs and self assessments to generate tasks."""
    profile = market_service.get_active_job_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="No active job profile found.")
        
    tasks = planner_service.generate_plan(db, profile)
    return tasks

@router.post("/resume-extract")
async def extract_and_grade_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Parses a PDF/Docx resume and auto-grades the user against current market requirements."""
    profile = market_service.get_active_job_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="No active job profile found.")
        
    # Extract
    content = await file.read()
    try:
        resume_text = extract_text_from_file(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Gather Requirements
    reqs = db.query(MarketRequirement).filter(MarketRequirement.job_profile_id == profile.id).all()
    if not reqs:
         raise HTTPException(status_code=400, detail="No market data exists yet. Trigger /market first.")
         
    reqs_data = [{"id": r.id, "name": r.name, "description": r.description} for r in reqs]
    
    # AI Assessment
    grades = evaluate_resume_skills(resume_text, reqs_data)
    
    return {
        "msg": "Successfully evaluated Resume.",
        "evaluations": grades
    }

@router.get("/resume/strengths", response_model=List[MarketRequirementResponse])
def get_verified_strengths(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches user strengths (Ratings >= 4) from their active job profile"""
    profile = market_service.get_active_job_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="No active job profile found.")
        
    strengths = planner_service.get_user_strengths(db, profile)
    return strengths

@router.post("/resume/rewrite")
def rewrite_resume_bullet(data: ResumeRewriteRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Receives a basic bullet point and an array of strengths keywords to weave into an ATS-friendly rewrite."""
    if not data.bullet_point:
         raise HTTPException(status_code=400, detail="Bullet point cannot be empty.")
    
    from app.utils.ai_client import optimize_resume_bullet
    
    optimized = optimize_resume_bullet(data.bullet_point, data.strengths)
    return {"optimized_bullet": optimized}

@router.post("/resume/generate-full")
async def generate_resume_endpoint(
    file: Optional[UploadFile] = File(None), 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Kicks off an async background task to auto-generate an entire resume mapping experience to the active market constraints. Optionally parses an uploaded base resume file."""
    profile = market_service.get_active_job_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="No active job profile found.")
        
    strengths_models = planner_service.get_user_strengths(db, profile)
    strengths = [s.name for s in strengths_models]
    
    from app.utils.ai_client import generate_full_resume
    
    # Safe fallback if name is null
    user_name = current_user.full_name if current_user.full_name else "Candidate"
    
    base_text = ""
    if file:
        content = await file.read()
        try:
           base_text = extract_text_from_file(content, file.filename)
        except Exception as e:
           raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    
    try:
        logger.info("Starting synchronous resume generation...", user_id=current_user.id, role=profile.role)
        resume_json = generate_full_resume(
            role=profile.role,
            user_name=user_name,
            strengths=strengths,
            base_text=base_text
        )
        logger.info("Generation complete", user_id=current_user.id)
        return resume_json
    except Exception as e:
        logger.error("Resume generation completely failed", error=str(e), user_id=current_user.id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate resume.")


@router.post("/interview/chat")
def mock_interview_chat(data: InterviewChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Handles the back-and-forth mock interview, focusing on the user's identified gaps."""
    profile = market_service.get_active_job_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="No active job profile found.")
        
    # Get Gaps (Ratings <= 3)
    gaps_models = planner_service.get_user_gaps(db, profile)
    gaps = [g.name for g in gaps_models]
    
    from app.utils.ai_client import generate_interview_response
    
    # Convert Pydantic history objects to standard dicts for the AI client
    history_dicts = [{"role": msg.role, "text": msg.text} for msg in data.history]
    
    ai_response = generate_interview_response(
        role=profile.role,
        gaps=gaps,
        history=history_dicts,
        new_message=data.newMessage
    )
    
    return {"reply": ai_response}


@router.get("/journal", response_model=List[JournalResponse])
def get_journals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches all journal entries for the current active job profile."""
    profile = market_service.get_active_job_profile(db, current_user.id)
    if not profile:
        return []

    journals = db.query(ExperienceJournal).filter(ExperienceJournal.job_profile_id == profile.id).order_by(ExperienceJournal.created_at.desc()).all()
    return journals


@router.post("/journal", response_model=JournalResponse)
def create_journal(data: JournalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Creates a new journal entry linked to the active profile and optionally a market requirement."""
    profile = market_service.get_active_job_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="No active job profile found.")

    new_journal = ExperienceJournal(
        user_id=current_user.id,
        job_profile_id=profile.id,
        title=data.title,
        notes=data.notes,
        requirement_id=data.requirement_id
    )
    
    db.add(new_journal)
    db.commit()
    db.refresh(new_journal)
    
    return new_journal

