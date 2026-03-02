import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import jwt, JWTError

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import settings
from app.models.user import User
from app.models.otp import OTP
from app.schemas.user import UserCreate
from app.services.email import send_otp_email

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    # Bcrypt 4.0+ strict length cutoff fix (passwords > 72 bytes crash bcrypt)
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password.encode('utf-8')[:72].decode('utf-8', 'ignore')
        
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        return False

def get_password_hash(password):
    if len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72].decode('utf-8', 'ignore')
    return pwd_context.hash(password)

# JWT Token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if user.is_college_student and not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your OTP.")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        base_country=user.base_country,
        role=user.role,
        is_college_student=user.is_college_student,
        college_name=user.college_name,
        is_verified=False if user.is_college_student else True # Normal users match baseline requirements without verification
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# OTP Logic
def generate_otp_code(length=6):
    return ''.join(random.choices(string.digits, k=length))

def create_and_send_otp(db: Session, user: User):
    # Expire old OTPs
    db.query(OTP).filter(OTP.user_id == user.id, OTP.is_used == False).update({"is_used": True})
    db.commit()

    code = generate_otp_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    
    # Needs naive datetime for older sqlalchemy/sqlite setups, but timezone aware for proper postgres
    otp = OTP(user_id=user.id, code=code, expires_at=expires_at)
    db.add(otp)
    db.commit()
    
    # Send Email
    success = send_otp_email(user.email, code)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP email.")
    
    return True

def verify_otp(db: Session, email: str, code: str):
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    otp = db.query(OTP).filter(
        OTP.user_id == user.id,
        OTP.code == code,
        OTP.is_used == False
    ).order_by(OTP.created_at.desc()).first()

    if not otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="InvalidOTP")
    
    if otp.expires_at < datetime.now(timezone.utc):
        otp.is_used = True
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP Expired")

    # Success
    otp.is_used = True
    user.is_verified = True
    db.commit()
    return True
