from fastapi import FastAPI, HTTPException, Depends, Security, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import uvicorn
import ticker_analysis
import logging
from datetime import datetime, timezone
from uuid import uuid4
import json
import os
import sqlite3
from typing import Dict, Optional, List
from queue import Queue, Empty
import threading
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
import math
from jose import jwt, JWTError
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite dev server
        "http://localhost:3001",    # Node.js server
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

# Security
security = HTTPBearer()

class SearchRequest(BaseModel):
    # Accepts a payload with a "text" field (and optionally "client_id")
    query: str = Field(..., alias="text")
    client_id: Optional[str] = None

# Job management
jobs: Dict[str, 'SearchJob'] = {}
job_queue = Queue()
MAX_WORKERS = 4  # Reduced from 300 for better resource management
executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)
active_workers = 0
worker_lock = threading.Lock()

# WebSocket connections
websocket_connections: Dict[str, List[WebSocket]] = {}

# WebSocket authentication
async def authenticate_websocket(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if user_id is None:
            return None
        return payload
    except JWTError:
        return None

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@dataclass
class JobStatus:
    id: str
    status: str
    position: int = 0
    worker_id: Optional[str] = None
    progress: float = 0.0
    error_message: Optional[str] = None  # Added to track error messages

class SearchJob:
    def __init__(self, search_text: str, user_id: str):
        self.id = str(uuid4())
        self.search_text = search_text
        self.user_id = user_id
        self.status = JobStatus(id=self.id, status="queued")
        self.result = None
        self.created_at = datetime.now(timezone.utc)
        self.completed_at = None
        self._save_to_db()

    def _save_to_db(self):
        db_path = os.path.join(os.path.dirname(__file__), '../data/users.db')
        try:
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                INSERT OR REPLACE INTO jobs (
                    id, user_id, search_text, status, position, worker_id, 
                    progress, result, created_at, completed_at, error_message
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    self.id, self.user_id, self.search_text, self.status.status,
                    self.status.position, self.status.worker_id, self.status.progress,
                    json.dumps(self.result) if self.result else None,
                    self.created_at.isoformat(), 
                    self.completed_at.isoformat() if self.completed_at else None,
                    self.status.error_message
                ))
        except Exception as e:
            logger.error(f"Database error while saving job {self.id}: {str(e)}")
            raise

    async def update_status(self, status, progress=None, error_message=None):
        """Update job status and notify clients"""
        self.status.status = status
        if progress is not None:
            self.status.progress = progress
        if error_message is not None:
            self.status.error_message = error_message
        
        self._save_to_db()
        
        # Send WebSocket update
        try:
            await send_job_update(self)
        except Exception as e:
            logger.error(f"Error sending WebSocket update: {str(e)}")

    def process_job(self):
        """Process the job in a worker thread"""
        global active_workers
        try:
            with worker_lock:
                active_workers += 1
                self.status.status = "running"
                self.status.position = 0
                self.status.worker_id = f"worker-{threading.get_ident()}"
                self._save_to_db()
                
                # Send WebSocket update for job started
                asyncio.run(send_job_update(self))

            # Update progress as the job runs
            self.status.progress = 0.5
            self._save_to_db()
            
            # Send WebSocket update for progress
            asyncio.run(send_job_update(self))

            # Process the job
            tickers, predictions = ticker_analysis.get_latest_analysis()
            
            self.result = {
                "tickers": tickers,
                "predictions": [float(p) for p in predictions]
            }
            
            self.status.status = "completed"
            self.status.progress = 1.0
            self.completed_at = datetime.now(timezone.utc)
            self._save_to_db()
            
            # Send WebSocket update for job completed
            asyncio.run(send_job_update(self))

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Job {self.id} failed: {error_msg}")
            self.status.status = "failed"
            self.status.error_message = error_msg
            self.status.progress = 0.0
            self._save_to_db()
            
            # Send WebSocket update for job failed
            asyncio.run(send_job_update(self))
        finally:
            with worker_lock:
                active_workers -= 1

def process_queue():
    """Background thread to process jobs from queue"""
    while True:
        try:
            # Get job with timeout to prevent busy waiting
            job = job_queue.get(timeout=1.0)
            
            # Check if we can process more jobs
            with worker_lock:
                current_workers = active_workers

            if current_workers < MAX_WORKERS:
                executor.submit(job.process_job)
            else:
                # If too many workers, wait and put job back in queue
                logger.info(f"Max workers reached ({MAX_WORKERS}), requeueing job {job.id}")
                job_queue.put(job)
                threading.Event().wait(1.0)  # Sleep to prevent tight loop
                
        except Empty:
            # No jobs available, just continue
            continue
        except Exception as e:
            logger.error(f"Error in queue processor: {str(e)}")
            threading.Event().wait(1.0)  # Sleep on error to prevent tight loop

# Start queue processor thread
queue_processor = threading.Thread(target=process_queue, daemon=True)
queue_processor.start()

@app.get("/data-api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/data-api/analyze")
async def analyze():
    try:
        tickers, predictions = ticker_analysis.get_latest_analysis()
        
        # Create a list of zipped tickers and predictions
        zipped = list(zip(tickers, predictions))

        # Sort tickers and predictions while handling non-finite values:
        sorted_zipped = sorted(zipped, key=lambda x: x[1] if math.isfinite(x[1]) else -float('inf'), reverse=True)

        if sorted_zipped:
            tickers, predictions = zip(*sorted_zipped)
        else:
            tickers, predictions = [], []

        # Replace non-finite predictions with None so that JSON encoding works smoothly
        safe_predictions = [p if math.isfinite(p) else None for p in predictions]

        print(tickers[:3], safe_predictions[:3])
        return {"tickers": tickers, "predictions": safe_predictions}
    except Exception as e:
        logger.error(f"Error in analyze: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data-api/jobs")
async def get_jobs(current_user: dict = Depends(get_current_user)):
    try:
        # Return all jobs
        job_list = []
        for job_id, job in jobs.items():
            job_list.append({
                "id": job.id,
                "text": job.search_text,
                "status": job.status.status,
                "progress": job.status.progress,
                "created_at": job.created_at.isoformat(),
                "user_id": job.user_id,
                "error_message": job.status.error_message
            })
        return job_list
    except Exception as e:
        logger.error(f"Error in get_jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data-api/jobs/{job_id}")
async def get_job_status(job_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if job_id not in jobs:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = jobs[job_id]
        
        # Return job status
        return {
            "id": job.id,
            "text": job.search_text,
            "status": job.status.status,
            "progress": job.status.progress,
            "created_at": job.created_at.isoformat(),
            "user_id": job.user_id,
            "error_message": job.status.error_message
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_job_status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/data-api/search")
async def search(request: SearchRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Create a new job
        job_id = str(uuid4())
        user_id = current_user.get("id")
        
        # Create and store the job
        job = SearchJob(request.query, user_id)
        job.id = job_id
        jobs[job_id] = job
        
        # Start processing the job
        job.process_job()
        
        return {"job_id": job_id}
    except Exception as e:
        logger.error(f"Error in search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Add logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

@app.websocket("/data-api/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    # Get token from query parameters
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return
    
    # Authenticate the token
    user = await authenticate_websocket(token)
    if not user:
        await websocket.close(code=1008, reason="Invalid authentication token")
        return
    
    # Accept the connection
    await websocket.accept()
    
    # Store the connection
    if client_id not in websocket_connections:
        websocket_connections[client_id] = []
    websocket_connections[client_id].append(websocket)
    
    try:
        # Send initial message
        await websocket.send_json({
            "type": "connection_established",
            "client_id": client_id,
            "user_id": user.get("id"),
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep the connection alive
        while True:
            # Wait for messages (this keeps the connection open)
            data = await websocket.receive_text()
            # Process any incoming messages if needed
            await websocket.send_json({
                "type": "message_received",
                "data": data,
                "timestamp": datetime.now().isoformat()
            })
    except WebSocketDisconnect:
        # Remove the connection when disconnected
        if client_id in websocket_connections:
            websocket_connections[client_id].remove(websocket)
            if not websocket_connections[client_id]:
                del websocket_connections[client_id]

# Function to send job updates to WebSocket clients
async def send_job_update(job):
    """Send job updates to connected WebSocket clients"""
    update = {
        "type": "job_update",
        "job_id": job.id,
        "status": job.status.status,
        "progress": job.status.progress,
        "worker_id": job.status.worker_id,
        "search_text": job.search_text,
        "timestamp": datetime.now().isoformat()
    }
    
    # Send to all connected clients
    for client_id, connections in websocket_connections.items():
        for connection in connections:
            try:
                await connection.send_json(update)
            except Exception as e:
                logger.error(f"Error sending WebSocket update: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="0.0.0.0",  # Changed from "127.0.0.1" to allow external connections
        port=8000,
        reload=True  # Enable auto-reload during development
    ) 