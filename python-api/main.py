from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import ticker_analysis
import logging
from datetime import datetime, timezone
from uuid import uuid4
import json
import os
import sqlite3
from typing import Dict, Optional
from queue import Queue, Empty
import threading
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
import math

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

            # Update progress as the job runs
            self.status.progress = 0.5
            self._save_to_db()

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

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Job {self.id} failed: {error_msg}")
            self.status.status = "failed"
            self.status.error_message = error_msg
            self.status.progress = 0.0
            self._save_to_db()
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

@app.get("/health")
async def health_check():
    logger.info("Health check received")
    return {"status": "healthy", "message": "Python API is running"}

@app.get("/analyze")
async def analyze():
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

@app.get("/jobs")
async def get_jobs():
    """Get all jobs"""
    try:
        db_path = os.path.join(os.path.dirname(__file__), '../data/users.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT id, search_text, status, position, worker_id, progress, 
               result, created_at, completed_at, error_message
        FROM jobs 
        ORDER BY created_at DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        return [{
            "job_id": row[0],
            "search_text": row[1],
            "status": row[2],
            "position": row[3],
            "worker_id": row[4],
            "progress": row[5],
            "result": json.loads(row[6]) if row[6] else None,
            "created_at": row[7],
            "completed_at": row[8],
            "error_message": row[9]
        } for row in rows]
    except Exception as e:
        logger.error(f"Error fetching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get status of specific job"""
    try:
        db_path = os.path.join(os.path.dirname(__file__), '../data/users.db')
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
            SELECT id, search_text, status, position, worker_id, progress, 
                   result, created_at, completed_at, error_message
            FROM jobs 
            WHERE id = ?
            ''', (job_id,))
            
            row = cursor.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="Job not found")
                
            return {
                "job_id": row[0],
                "search_text": row[1],
                "status": row[2],
                "position": row[3],
                "worker_id": row[4],
                "progress": row[5],
                "result": json.loads(row[6]) if row[6] else None,
                "created_at": row[7],
                "completed_at": row[8],
                "error_message": row[9]
            }
    except Exception as e:
        logger.error(f"Error fetching job status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search(request: SearchRequest):
    try:
        logger.info(f"Search request received: {request.query}")
        
        # Create new job
        job = SearchJob(request.query, user_id="default")  # You can add proper user management later
        jobs[job.id] = job
        
        # Add to queue
        job_queue.put(job)
        
        return {
            "job_id": job.id,
            "status": "queued",
            "message": "Search job created"
        }
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Add logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="0.0.0.0",  # Changed from "127.0.0.1" to allow external connections
        port=8000,
        reload=True  # Enable auto-reload during development
    ) 