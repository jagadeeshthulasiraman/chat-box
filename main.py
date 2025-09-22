from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
import shutil
from dotenv import load_dotenv

# Load env vars
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # update with frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Fake DBs
users_db: Dict[str, dict] = {}
projects_db: Dict[int, dict] = {}
project_counter = 1

# Models
class User(BaseModel):
    email: str
    password: str

class Project(BaseModel):
    id: int
    name: str
    owner: str
    files: List[str] = []
    chat: List[dict] = []

class Token(BaseModel):
    access_token: str
    token_type: str

# JWT helpers
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None or email not in users_db:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return users_db[email]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# -------- AUTH --------
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
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": user["email"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer"}

# -------- PROJECTS --------
@app.get("/projects", response_model=List[Project])
def list_projects(current_user: dict = Depends(get_current_user)):
    return [p for p in projects_db.values() if p["owner"] == current_user["email"]]

@app.post("/projects", response_model=Project)
def create_project(name: dict, current_user: dict = Depends(get_current_user)):
    global project_counter
    project_id = project_counter
    project_counter += 1
    projects_db[project_id] = {
        "id": project_id,
        "name": name.get("name"),
        "owner": current_user["email"],
        "files": [],
        "chat": [],
    }
    return projects_db[project_id]

# -------- FILE UPLOAD --------
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload/{project_id}")
def upload_file(project_id: int, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if project_id not in projects_db or projects_db[project_id]["owner"] != current_user["email"]:
        raise HTTPException(status_code=404, detail="Project not found")

    project_path = os.path.join(UPLOAD_DIR, str(project_id))
    os.makedirs(project_path, exist_ok=True)

    file_path = os.path.join(project_path, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    projects_db[project_id]["files"].append(file.filename)
    return {"msg": "File uploaded successfully"}

@app.delete("/delete/{project_id}/{filename}")
def delete_file(project_id: int, filename: str, current_user: dict = Depends(get_current_user)):
    if project_id not in projects_db or projects_db[project_id]["owner"] != current_user["email"]:
        raise HTTPException(status_code=404, detail="Project not found")

    project_path = os.path.join(UPLOAD_DIR, str(project_id), filename)
    if os.path.exists(project_path):
        os.remove(project_path)
        projects_db[project_id]["files"].remove(filename)
        return {"msg": "File deleted successfully"}
    raise HTTPException(status_code=404, detail="File not found")

# -------- CHAT --------
class ChatRequest(BaseModel):
    project_id: int
    message: str

@app.post("/chat")
def chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    if req.project_id not in projects_db or projects_db[req.project_id]["owner"] != current_user["email"]:
        raise HTTPException(status_code=404, detail="Project not found")

    history = projects_db[req.project_id]["chat"]
    history.append({"role": "user", "content": req.message})
    # Dummy bot reply
    reply = f"Echo: {req.message}"
    history.append({"role": "bot", "content": reply})

    return {"history": history}
