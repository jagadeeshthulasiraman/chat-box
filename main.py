from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import requests
import os
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

# ---- In-memory storage ----
users = {}
projects = {}
chats = {}
sessions = {}

# ---- Models ----
class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ProjectRequest(BaseModel):
    name: str

class ChatRequest(BaseModel):
    project_id: int
    message: str

# ---- Auth ----
@app.get("/ping")
def ping():
    return {"status": "ok"}

@app.post("/register")
def register(req: RegisterRequest):
    if req.email in users:
        raise HTTPException(status_code=400, detail="User already exists")
    users[req.email] = req.password
    return {"message": "User registered"}

@app.post("/login")
def login(req: LoginRequest):
    if users.get(req.email) != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = f"token-{req.email}"
    sessions[token] = req.email
    return {"access_token": token}

def get_current_user(token: str):
    if token not in sessions:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return sessions[token]

# ---- Projects ----
@app.get("/projects")
def list_projects(token: str):
    user = get_current_user(token)
    return projects.get(user, [])

@app.post("/projects")
def create_project(req: ProjectRequest, token: str):
    user = get_current_user(token)
    user_projects = projects.setdefault(user, [])
    project_id = len(user_projects) + 1
    project = {"id": project_id, "name": req.name}
    user_projects.append(project)
    chats[(user, project_id)] = []
    return project

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, token: str):
    user = get_current_user(token)
    projects[user] = [p for p in projects.get(user, []) if p["id"] != project_id]
    chats.pop((user, project_id), None)
    return {"message": "Deleted"}

# ---- Chat ----
@app.post("/chat")
def chat(req: ChatRequest, token: str):
    user = get_current_user(token)
    history = chats.get((user, req.project_id), [])
    history.append({"role": "user", "content": req.message})

    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set")

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "google/gemini-pro-1.5",
                "messages": history,
                "max_tokens": 1000,
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        history.append({"role": "assistant", "content": reply})
        chats[(user, req.project_id)] = history
        return {"history": history}
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="AI response timed out")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"OpenRouter error: {str(e)}")
