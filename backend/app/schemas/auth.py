from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username must be 3-50 characters")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class UserLogin(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="The refresh token to use for getting a new access token")


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[uuid.UUID] = None


class UserResponse(BaseModel):
    user_id: uuid.UUID
    username: str
    email: str
    default_work_environment: str
    focus_times: list
    timezone: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    default_work_environment: Optional[str] = None
    focus_times: Optional[list] = None
    timezone: Optional[str] = None 