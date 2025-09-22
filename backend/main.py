from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from dotenv import load_dotenv
import os, shutil, PyPDF2, requests, traceback

# ==============================
# Load environment variables
# ==============================
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("❌ OPENROUTER_API_KEY is missing. Please add it to .env")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# ==============================
# FastAPI App Setup
# ==============================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ==============================
# In-Memory Storage
# ==============================
users_db = {}
projects_db = {}
project_counter = 1

# ==============================
# Schemas
# ==============================
class RegisterRequest(BaseModel):
    email: str
    password: str

class ProjectRequest(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class PromptRequest(BaseModel):
    title: str
    content: str

class ChatRequest(BaseModel):
    project_id: int
    message: str
    reset: Optional[bool] = False

# ==============================
# Auth Helpers
# ==============================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = decode_token(token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return user

# ==============================
# OpenRouter Helper
# ==============================
def call_openrouter(messages):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",  # required by OpenRouter
        "X-Title": "Chat Box",                   # required by OpenRouter
    }
    payload = {
        "model": "google/gemini-pro-1.5",  # ✅ Gemini 1.5 Pro
        "messages": messages,
        "max_tokens": 1000,                # ✅ safe cap
    }

    res = requests.post(OPENROUTER_API_URL, headers=headers, json=payload)

    if res.status_code != 200:
        raise Exception(f"OpenRouter error: {res.status_code} - {res.text}")

    data = res.json()
    return data["choices"][0]["message"]["content"]

# ==============================
# Routes
# ==============================
@app.post("/register")
def register(req: RegisterRequest):
    if req.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    users_db[req.email] = {"password": req.password}
    projects_db[req.email] = []
    return {"msg": "User registered"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_db.get(form_data.username)
    if not user or user["password"] != form_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(
        {"sub": form_data.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer"}

@app.post("/projects")
def create_project(req: ProjectRequest, current_user: str = Depends(get_current_user)):
    global project_counter
    project = {
        "id": project_counter,
        "name": req.name,
        "description": req.description,
        "prompts": [],
        "chats": [],
        "files": []
    }
    projects_db[current_user].append(project)
    project_counter += 1
    return project

@app.get("/projects")
def list_projects(current_user: str = Depends(get_current_user)):
    return {"projects": projects_db.get(current_user, [])}

@app.post("/chat")
def chat(req: ChatRequest, current_user: str = Depends(get_current_user)):
    if current_user not in projects_db:
        raise HTTPException(status_code=404, detail="User not found")

    for p in projects_db[current_user]:
        if p["id"] == req.project_id:
            if req.reset:
                p["chats"] = []

            if not req.message:
                raise HTTPException(status_code=400, detail="Message cannot be empty")

            p["chats"].append({"role": "user", "content": req.message})

            messages = [{"role": "system", "content": "You are a helpful assistant."}]
            messages.extend(p["chats"])

            try:
                bot_response = call_openrouter(messages)
            except Exception as e:
                print("OpenRouter error:", traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"OpenRouter error: {str(e)}")

            p["chats"].append({"role": "assistant", "content": bot_response})

            return {
                "response": bot_response,
                "history": p["chats"],
                "reset_applied": req.reset,
            }

    raise HTTPException(status_code=404, detail="Project not found")

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, current_user: str = Depends(get_current_user)):
    projects = projects_db.get(current_user, [])
    for p in projects:
        if p["id"] == project_id:
            projects.remove(p)
            return {"msg": "Project deleted"}
    raise HTTPException(status_code=404, detail="Project not found")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/projects/{project_id}/upload")
async def upload_file(project_id: int, file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    for p in projects_db[current_user]:
        if p["id"] == project_id:
            file_path = os.path.join(UPLOAD_DIR, f"{current_user}_{project_id}_{file.filename}")
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            file_text = ""
            if file.filename.endswith(".pdf"):
                with open(file_path, "rb") as pdf_file:
                    reader = PyPDF2.PdfReader(pdf_file)
                    for page in reader.pages:
                        file_text += page.extract_text() or ""

            p["files"].append({"filename": file.filename, "content": file_text})
            return {"msg": "File uploaded", "filename": file.filename}
    raise HTTPException(status_code=404, detail="Project not found")

@app.delete("/projects/{project_id}/files/{file_index}")
def delete_file(project_id: int, file_index: int, current_user: str = Depends(get_current_user)):
    for p in projects_db.get(current_user, []):
        if p["id"] == project_id:
            if 0 <= file_index < len(p.get("files", [])):
                removed = p["files"].pop(file_index)
                return {"msg": f"File '{removed['filename']}' deleted"}
            raise HTTPException(status_code=400, detail="Invalid file index")
    raise HTTPException(status_code=404, detail="Project not found")

@app.get("/ping")
def ping():
    try:
        res = call_openrouter([{"role": "user", "content": "Say pong"}])
        return {"msg": res}
    except Exception as e:
        return {"error": str(e)}
