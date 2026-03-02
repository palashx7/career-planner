from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any
from datetime import timedelta

from app.config import settings

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.schemas.auth import Token, OTPRequest, OTPVerify
from app.services import auth as auth_service
from app.models.user import User
from app.routes.workflow import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)) -> Any:
    # Check if user already exists
    if auth_service.get_user_by_email(db, email=user.email):
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    # Create the db user
    new_user = auth_service.create_user(db=db, user=user)
    
    # Send verification code immediately if college student
    if new_user.is_college_student:
        auth_service.create_and_send_otp(db, new_user)
        
    return new_user

@router.post("/admin-register", response_model=UserResponse)
def register_admin(user: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Dedicated endpoint to register a college administrator.
    Forces the role to 'admin' regardless of payload.
    """
    if auth_service.get_user_by_email(db, email=user.email):
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    # Force admin role
    user.role = "admin"
    
    # Create the db admin
    new_admin = auth_service.create_user(db=db, user=user)
    
    # Optional: We bypass OTP for admin registration right now, 
    # assuming they are created securely.
    
    return new_admin

# --- Authentication Endpoints ---

@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    try:
        user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Inject role and email into scopes/claims
    access_token = auth_service.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/admin-login", response_model=Token)
def login_admin_only(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Separate endpoint dedicated to logging in Admin users.
    If a normal student attempts to login here, it rejects them immediately.
    """
    try:
        user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if user.role != "admin":
         raise HTTPException(status_code=403, detail="Access forbidden: You do not have administrator privileges.")
         
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = auth_service.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/request-otp")
def request_otp(otp_request: OTPRequest, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, otp_request.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.is_verified:
        raise HTTPException(status_code=400, detail="User already verified")

    auth_service.create_and_send_otp(db, user)
    return {"msg": "OTP sent successfully. Please check your email."}

@router.post("/verify-otp")
def verify_user_otp(otp_verify: OTPVerify, db: Session = Depends(get_db)):
    # Verify and set is_verified to True
    auth_service.verify_otp(db, otp_verify.email, otp_verify.code)
    
    # Return JWT immediately on successful verification
    user = auth_service.get_user_by_email(db, otp_verify.email)
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id)}
    )
    
    return {
        "msg": "Email verified successfully.",
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.put("/me", response_model=UserResponse)
def update_user_profile(
    update_data: UserUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Updates basic profile fields for the logged in user."""
    
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
        
    if update_data.is_college_student is not None:
        current_user.is_college_student = update_data.is_college_student
        
    if update_data.college_name is not None:
        current_user.college_name = update_data.college_name
        
    db.commit()
    db.refresh(current_user)
    
    return current_user
