from sqlalchemy.orm import Session
from app.models.core import JobProfile, SelfAssessment, MarketRequirement, ProgressTask
from app.schemas.core import SelfAssessmentCreate
from app.utils.ai_client import generate_custom_plan

def save_assessments(db: Session, job_profile: JobProfile, assessment_data: SelfAssessmentCreate):
    # Clear old assessments for this profile if re-taking
    db.query(SelfAssessment).filter(SelfAssessment.job_profile_id == job_profile.id).delete()

    for item in assessment_data.assessments:
        assessment_row = SelfAssessment(
            job_profile_id=job_profile.id,
            requirement_id=item.requirement_id,
            rating=item.rating,
            reason=item.reason
        )
        db.add(assessment_row)
        
    db.commit()
    
    return db.query(SelfAssessment).filter(SelfAssessment.job_profile_id == job_profile.id).all()

def get_user_strengths(db: Session, job_profile: JobProfile):
    """Returns MarketRequirements where the user's assessment rating is >= 4"""
    assessments = db.query(SelfAssessment).filter(SelfAssessment.job_profile_id == job_profile.id, SelfAssessment.rating >= 4).all()
    strengths = []
    for a in assessments:
        req = db.query(MarketRequirement).filter(MarketRequirement.id == a.requirement_id).first()
        if req:
            strengths.append(req)
    return strengths

def get_user_gaps(db: Session, job_profile: JobProfile):
    """Returns MarketRequirements where the user's assessment rating is <= 3"""
    assessments = db.query(SelfAssessment).filter(SelfAssessment.job_profile_id == job_profile.id, SelfAssessment.rating <= 3).all()
    gaps = []
    for a in assessments:
        req = db.query(MarketRequirement).filter(MarketRequirement.id == a.requirement_id).first()
        if req:
            gaps.append(req)
    return gaps

def generate_plan(db: Session, job_profile: JobProfile):
    """
    Feeds specific low-score user strengths and gaps into the custom LLM coach.
    """
    
    # Check if a plan already exists, if so return it
    existing_tasks = db.query(ProgressTask).filter(ProgressTask.job_profile_id == job_profile.id).all()
    if existing_tasks:
        return existing_tasks
        
    assessments = db.query(SelfAssessment).filter(SelfAssessment.job_profile_id == job_profile.id).all()
    
    # Structure data for AI prompt
    gaps_data = []
    strengths_names = []
    
    for assessment in assessments:
         req = db.query(MarketRequirement).filter(MarketRequirement.id == assessment.requirement_id).first()
         if req:
             if assessment.rating <= 3:
                 # It's a gap
                 gaps_data.append({
                     "skill_or_requirement": req.name,
                     "category": req.category,
                     "user_rating_out_of_5": assessment.rating,
                     "user_justification": assessment.reason
                 })
             else:
                 # It's a strength
                 strengths_names.append(req.name)
                 
    strengths_str = ", ".join(strengths_names) if strengths_names else "None listed"
    
    # Call Gemini!
    ai_tasks = generate_custom_plan(gaps_data, strengths_str, job_profile.role)
    
    tasks_to_insert = []
    for t in ai_tasks:
         task_row = ProgressTask(
             job_profile_id=job_profile.id,
             title=t.get("title", "Unnamed Task"),
             description=t.get("description", ""),
             month_target=t.get("month_target", 1),
             week_target=t.get("week_target", 0),
             task_type=t.get("task_type", "learning")
         )
         tasks_to_insert.append(task_row)
         
    # Fallback if AI fails completely
    if not tasks_to_insert:
            t = ProgressTask(
                job_profile_id=job_profile.id,
                title=f"Advanced Application & Review",
                description=f"You have no major gaps! Focus on polishing projects and mock interviews.",
                month_target=1,
                task_type="project"
            )
            tasks_to_insert.append(t)
            
    db.add_all(tasks_to_insert)
    db.commit()
    
    return db.query(ProgressTask).filter(ProgressTask.job_profile_id == job_profile.id).order_by(ProgressTask.month_target.asc()).all()
