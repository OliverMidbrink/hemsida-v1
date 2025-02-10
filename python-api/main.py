from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from uuid import uuid4
from datetime import datetime
import asyncio
from typing import Dict, Optional
import json

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# Store running jobs
jobs: Dict[str, 'SearchJob'] = {}

class SearchJob:
    def __init__(self, search_text: str, client_id: str):
        self.id = str(uuid4())
        self.search_text = search_text
        self.client_id = client_id
        self.status = "pending"
        self.result = None
        self.created_at = datetime.now()
        self.completed_at: Optional[datetime] = None
        
    async def run(self):
        """Simulate a long-running search operation"""
        self.status = "running"
        await self.notify_client()
        
        # Simulate work with delay
        await asyncio.sleep(5)  # Simulate 5 seconds of work
        
        # Generate result (your vector generation logic)
        seed = sum(ord(c) for c in self.search_text)
        np.random.seed(seed)
        self.result = {
            "vector": np.random.randn(50).tolist(),
            "search_text": self.search_text
        }
        
        self.status = "completed"
        self.completed_at = datetime.now()
        await self.notify_client()
        
    async def notify_client(self):
        """Send job status update to client"""
        if self.client_id in active_connections:
            message = {
                "type": "job_update",
                "job_id": self.id,
                "status": self.status,
                "result": self.result,
                "created_at": self.created_at.isoformat(),
                "completed_at": self.completed_at.isoformat() if self.completed_at else None
            }
            await active_connections[self.client_id].send_json(message)

class SearchRequest(BaseModel):
    search_text: str
    client_id: str

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    active_connections[client_id] = websocket
    try:
        while True:
            # Keep connection alive and handle any client messages
            data = await websocket.receive_text()
            # You could handle client messages here if needed
    except:
        if client_id in active_connections:
            del active_connections[client_id]

@app.post("/search")
async def create_search(request: SearchRequest):
    # Create and start new search job
    job = SearchJob(request.search_text, request.client_id)
    jobs[job.id] = job
    
    # Start job in background
    asyncio.create_task(job.run())
    
    return {
        "job_id": job.id,
        "status": "pending",
        "message": "Search job created"
    }

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    return {
        "job_id": job.id,
        "status": job.status,
        "result": job.result,
        "created_at": job.created_at.isoformat(),
        "completed_at": job.completed_at.isoformat() if job.completed_at else None
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 