from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class DocumentUpload(BaseModel):
    filename: str
    content: str

class DocumentOut(BaseModel):
    id: int
    filename: str
    content: str
    uploaded_at: datetime
    owner_id: int
    class Config:
        from_attributes = True

class ChatOut(BaseModel):
    id: int
    document_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class QuestionRequest(BaseModel):
    question: str
    document_id: int

class AnswerResponse(BaseModel):
    answer: str 