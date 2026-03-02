from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    base_country: Optional[str] = None
    is_college_student: bool = False
    college_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str = "student" # Add role to create payload (for testing admin setup)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_college_student: Optional[bool] = None
    college_name: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
