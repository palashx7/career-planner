from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict

from app.database import get_db
from app.models.user import User
from app.models.core import JobProfile, ProgressTask
from app.routes.workflow import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/students", response_model=List[Dict])
def get_college_students(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns all students associated with the Admin's configured college.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access forbidden: Admins only.")
        
    # Assuming the admin's `college_name` matches the students they want to see
    if not current_user.college_name:
         raise HTTPException(status_code=400, detail="Admin account does not have a designated college.")
         
    # Fetch all students for this college
    students = db.query(User).filter(
        User.is_college_student == True,
        User.college_name == current_user.college_name,
        User.role == "student"
    ).all()
    
    result = []
    for student in students:
        # Calculate progress
        profile = db.query(JobProfile).filter(JobProfile.user_id == student.id, JobProfile.is_active == True).first()
        progress_percentage = 0.0
        
        if profile:
             all_tasks = db.query(ProgressTask).filter(ProgressTask.job_profile_id == profile.id).all()
             total_tasks = len(all_tasks)
             completed_tasks = len([t for t in all_tasks if t.is_completed])
             progress_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
             
        result.append({
            "id": student.id,
            "full_name": student.full_name or "Onboarding Incomplete",
            "email": student.email,
            "target_role": profile.role if profile else "No role selected",
            "progress_percentage": round(progress_percentage, 1)
        })
        
    return result
