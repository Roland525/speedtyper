from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List
from datetime import datetime

class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    created_at: datetime

class LoginIn(BaseModel):
    username: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ResultIn(BaseModel):
    mode_seconds: int
    language: str = Field(min_length=2, max_length=2)
    wpm: float = Field(ge=0)
    accuracy: float = Field(ge=0, le=100)
    errors: int = Field(ge=0)
    total_chars: int = Field(ge=0)
    correct_chars: int = Field(ge=0)

class ResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    mode_seconds: int
    language: str
    wpm: float
    accuracy: float
    errors: int
    total_chars: int
    correct_chars: int
    created_at: datetime

class LeaderboardRow(BaseModel):
    username: str
    wpm: float
    accuracy: float
    created_at: datetime

class LeaderboardOut(BaseModel):
    mode_seconds: int
    language: str
    top: List[LeaderboardRow]
