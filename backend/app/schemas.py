from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    class Config:
        orm_mode = True

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    class Config:
        orm_mode = True

class PromptCreate(BaseModel):
    title: Optional[str] = None
    content: str

class PromptOut(BaseModel):
    id: int
    title: Optional[str]
    content: str
    class Config:
        orm_mode = True

class ChatRequest(BaseModel):
    project_id: int
    message: str
