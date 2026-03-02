from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.core import JobProfile, MarketRequirement, SelfAssessment, ProgressTask
from app.schemas.core import DashboardSummaryResponse

from app.routes.workflow import get_current_user # reuse auth dependency

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Aggregates all user progress for their active job profile to render the dashboard layout.
    """
    profile = db.query(JobProfile).filter(JobProfile.user_id == current_user.id, JobProfile.is_active == True).first()
    
    if not profile:
         return DashboardSummaryResponse(
             active_profile=None,
             progress_percentage=0.0,
             total_requirements_analyzed=0,
             strengths_identified=0,
             gaps_identified=0,
             upcoming_tasks=[]
         )
         
    # Generate aggregations
    metrics = {
        "active_profile": profile,
        "total_requirements_analyzed": db.query(MarketRequirement).filter(MarketRequirement.job_profile_id == profile.id).count(),
        "strengths_identified": db.query(SelfAssessment).filter(SelfAssessment.job_profile_id == profile.id, SelfAssessment.rating >= 4).count(),
        "gaps_identified": db.query(SelfAssessment).filter(SelfAssessment.job_profile_id == profile.id, SelfAssessment.rating <= 2).count()
    }
    
    # Calculate progress %
    all_tasks = db.query(ProgressTask).filter(ProgressTask.job_profile_id == profile.id).all()
    total_tasks = len(all_tasks)
    completed_tasks = len([t for t in all_tasks if t.is_completed])
    
    metrics["progress_percentage"] = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
    
    # Return incomplete tasks as upcoming
    metrics["upcoming_tasks"] = [t for t in all_tasks if not t.is_completed]
    
    return DashboardSummaryResponse(**metrics)
    
@router.put("/tasks/{task_id}/complete")
def mark_task_complete(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
     task = db.query(ProgressTask).join(JobProfile).filter(
         ProgressTask.id == task_id,
         JobProfile.user_id == current_user.id
     ).first()
     
     if not task:
         raise HTTPException(status_code=404, detail="Task not found or doesn't belong to you")
         
     task.is_completed = True
     # Could add datetime completed_at here
     db.commit()
     return {"msg": "Task marked as complete."}
