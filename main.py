from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import requests as http_requests
import os
import shutil
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ---- In-memory storage ----
users = {}
projects = {}
chats = {}
files_db = {}

# ---- Models ----
class RegisterRequest(BaseModel):
    email: str
    password: str

class ProjectRequest(BaseModel):
    name: str

class ChatRequest(BaseModel):
    project_id: int
    message: str

# ---- Health ----
@app.get("/ping")
def ping():
    return {"status": "ok"}

# ---- Auth ----
@app.post("/register")
def register(req: RegisterRequest):
    if req.email in users:
        raise HTTPException(status_code=400, detail="User already exists")
    users[req.email] = req.password
    return {"message": "User registered"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    email = form_data.username
    if users.get(email) != form_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = email
    return {"access_token": token, "token_type": "bearer"}

# ---- Projects ----
@app.get("/projects")
def list_projects(token: str = Depends(oauth2_scheme)):
    return projects.get(token, [])

@app.post("/projects")
def create_project(req: ProjectRequest, token: str = Depends(oauth2_scheme)):
    user_projects = projects.setdefault(token, [])
    project_id = len(user_projects) + 1
    project = {"id": project_id, "name": req.name, "files": []}
    user_projects.append(project)
    chats[(token, project_id)] = []
    files_db[(token, project_id)] = []
    return project

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, token: str = Depends(oauth2_scheme)):
    projects[token] = [p for p in projects.get(token, []) if p["id"] != project_id]
    chats.pop((token, project_id), None)
    files_db.pop((token, project_id), None)
    return {"message": "Deleted"}

# ---- File Upload ----
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/projects/{project_id}/upload")
def upload_file(project_id: int, file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    project_path = os.path.join(UPLOAD_DIR, token.replace("@", "_"), str(project_id))
    os.makedirs(project_path, exist_ok=True)
    file_path = os.path.join(project_path, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    file_list = files_db.setdefault((token, project_id), [])
    file_list.append(file.filename)
    return {"message": "File uploaded", "filename": file.filename}

@app.delete("/projects/{project_id}/files/{file_index}")
def delete_file(project_id: int, file_index: int, token: str = Depends(oauth2_scheme)):
    file_list = files_db.get((token, project_id), [])
    if file_index >= len(file_list):
        raise HTTPException(status_code=404, detail="File not found")
    filename = file_list.pop(file_index)
    file_path = os.path.join(UPLOAD_DIR, token.replace("@", "_"), str(project_id), filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    return {"message": "File deleted"}

# ---- Chat ----
@app.post("/chat")
def chat(req: ChatRequest, token: str = Depends(oauth2_scheme)):
    history = chats.get((token, req.project_id), [])
    history.append({"role": "user", "content": req.message})

    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set")

    try:
        response = http_requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "mistralai/mistral-7b-instruct:free",
                "messages": history,
                "max_tokens": 1000,
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        history.append({"role": "assistant", "content": reply})
        chats[(token, req.project_id)] = history
        return {"history": history}
    except http_requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="AI response timed out")
    except http_requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"OpenRouter error: {str(e)}")
