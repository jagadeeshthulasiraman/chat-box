from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from dotenv import load_dotenv
import os
import shutil
import uuid

# =========================
# Load environment variables
# =========================
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# =========================
# FastAPI App
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change later to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# In-memory stores
users_db = {}
projects_db = {}

# =========================
# Models
# =========================
class User(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Project(BaseModel):
    id: Optional[str] = None
    name: str
    files: List[str] = []

class ChatMessage(BaseModel):
    project_id: str
    message: str
    reset: bool = False

# =========================
# Utils
# =========================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="❌ Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None or email not in users_db:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return users_db[email]

# =========================
# Root (Health Check)
# =========================
@app.get("/", include_in_schema=False)
async def root():
    return {"msg": "✅ Chat Box Backend is running on Render"}

# =========================
# Auth
# =========================
@app.post("/register")
def register(user: User):
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    users_db[user.email] = {"email": user.email, "password": user.password}
    return {"msg": "User registered successfully"}

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_db.get(form_data.username)
    if not user or user["password"] != form_data.password:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

# =========================
# Projects
# =========================
@app.get("/projects", response_model=List[Project])
def get_projects(current_user: dict = Depends(get_current_user)):
    return list(projects_db.values())

@app.post("/projects", response_model=Project)
def create_project(project: Project, current_user: dict = Depends(get_current_user)):
    project.id = str(uuid.uuid4())
    projects_db[project.id] = project
    return project

@app.delete("/projects/{project_id}")
def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    del projects_db[project_id]
    return {"msg": "Project deleted"}

# =========================
# File Upload
# =========================
@app.post("/projects/{project_id}/upload")
def upload_file(
    project_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    projects_db[project_id].files.append(filename)
    return {"filename": filename, "msg": "File uploaded successfully"}

@app.delete("/projects/{project_id}/files/{file_index}")
def delete_file(project_id: str, file_index: int, current_user: dict = Depends(get_current_user)):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        removed = projects_db[project_id].files.pop(file_index)
        return {"msg": f"Removed {removed}"}
    except IndexError:
        raise HTTPException(status_code=404, detail="File not found")

# =========================
# Chat (Echo Demo)
# =========================
@app.post("/chat")
def chat(chat: ChatMessage, current_user: dict = Depends(get_current_user)):
    if chat.project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")

    response = f"🤖 Echo: {chat.message}"

    return {
        "history": [
            {"role": "user", "content": chat.message},
            {"role": "assistant", "content": response},
        ]
    }
