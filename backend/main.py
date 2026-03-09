from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv

# We will implement the agent in a separate file
from agent import get_salomao_response

load_dotenv()

app = FastAPI(title="Salomão AI API", version="6.8")

# Configure CORS for the frontend to connect
from fastapi.staticfiles import StaticFiles

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure downloads directory exists
downloads_dir = os.path.join(os.path.dirname(__file__), "..", "downloads")
os.makedirs(downloads_dir, exist_ok=True)

# Serve the downloads directory statically
app.mount("/downloads", StaticFiles(directory=downloads_dir), name="downloads")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []

@app.get("/")
def read_root():
    return {"status": "Salomão Backend (v6.8) is running."}

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if not os.getenv("GROQ_API_KEY") or os.getenv("GROQ_API_KEY") == "your_key_here":
         raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured in backend/.env")
    
    try:
        # Pass the current message and history to our LangChain agent
        response_text = get_salomao_response(req.message, req.history)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
