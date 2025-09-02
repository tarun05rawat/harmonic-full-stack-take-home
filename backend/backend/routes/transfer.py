from __future__ import annotations

import time
from typing import Dict, List, Literal, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from sqlalchemy import text


from ..db.database import SessionLocal

router = APIRouter(prefix="/transfer", tags=["transfer"])

# ----- API models -----
Mode = Literal["ids", "all"]

class Selection(BaseModel):
    mode: Mode
    ids: Optional[List[int]] = None  # company IDs are integers

class TransferRequest(BaseModel):
    source_list_id: UUID            # company_collections.id (UUID)
    target_list_id: UUID
    selection: Selection

class TransferResponse(BaseModel):
    job_id: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: Literal["queued", "running", "completed", "failed"]
    total_count: int
    processed_count: int
    inserted_count: int
    skipped_count: int
    failed_count: int
    error: Optional[str] = None

# ----- In-memory job store (sufficient for take-home) -----
class Job(BaseModel):
    job_id: str
    source_list_id: UUID
    target_list_id: UUID
    status: Literal["queued", "running", "completed", "failed"] = "queued"
    total_count: int = 0
    processed_count: int = 0
    inserted_count: int = 0
    skipped_count: int = 0
    failed_count: int = 0
    error: Optional[str] = None

JOBS: Dict[str, Job] = {}
BATCH_SIZE = 1000  # keeps DB pressure predictable and progress granular

# ----- Routes -----
@router.post("", response_model=TransferResponse)
def start_transfer(req: TransferRequest, bg: BackgroundTasks):
    if req.source_list_id == req.target_list_id:
        raise HTTPException(400, "Source and target lists must differ.")
    if req.selection.mode == "ids" and not req.selection.ids:
        raise HTTPException(400, "selection.ids is required when mode == 'ids'.")

    job_id = str(uuid4())
    JOBS[job_id] = Job(
        job_id=job_id,
        source_list_id=req.source_list_id,
        target_list_id=req.target_list_id,
        status="queued",
    )
    bg.add_task(_process_transfer_job, job_id, req)
    return TransferResponse(job_id=job_id)

@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    return JobStatusResponse(**job.model_dump())

# ----- Worker (runs in background) -----
def _process_transfer_job(job_id: str, req: TransferRequest):
    job = JOBS[job_id]
    job.status = "running"
    db = SessionLocal()

    # Table/constraint names from your app.database models:
    # - company_collection_associations (id PK, company_id INT, collection_id UUID, UNIQUE(company_id, collection_id) CONSTRAINT uq_company_collection)
    try:
        if req.selection.mode == "ids":
            ids: List[int] = req.selection.ids or []
            job.total_count = len(ids)

            def fetch_batch(offset: int, size: int) -> List[int]:
                return ids[offset : offset + size]

        else:  # "all" -> stream all company_ids from the source collection
            total_sql = text("""
                SELECT COUNT(*) 
                FROM company_collection_associations
                WHERE collection_id = :src
            """)
            job.total_count = int(db.execute(total_sql, {"src": str(req.source_list_id)}).scalar_one())

            def fetch_batch(offset: int, size: int) -> List[int]:
                rows = db.execute(
                    text("""
                        SELECT company_id
                        FROM company_collection_associations
                        WHERE collection_id = :src
                        OFFSET :off LIMIT :lim
                    """),
                    {"src": str(req.source_list_id), "off": offset, "lim": size},
                ).fetchall()
                return [int(r[0]) for r in rows]

        # Batched, idempotent INSERT into the target collection
        offset = 0
        while job.processed_count < job.total_count:
            batch = fetch_batch(offset, BATCH_SIZE)
            if not batch:
                break

            # Use named unique constraint for conflict handling
            insert_sql = text("""
                INSERT INTO company_collection_associations (collection_id, company_id)
                VALUES (:collection_id, :company_id)
                ON CONFLICT ON CONSTRAINT uq_company_collection DO NOTHING
            """)

            params = [{"collection_id": str(req.target_list_id), "company_id": cid} for cid in batch]
            result = db.execute(insert_sql, params)
            db.commit()

            inserted = getattr(result, "rowcount", None)
            if inserted is None or inserted < 0:
                inserted = 0  # conservative; progress still accurate via processed_count

            job.inserted_count += inserted
            job.processed_count += len(batch)
            job.skipped_count = job.processed_count - job.inserted_count
            offset += len(batch)

            # Simulate throttled DB/backpressure, surface visible progress
            time.sleep(0.05)

        job.status = "completed"
    except Exception as e:
        db.rollback()
        job.status = "failed"
        job.error = str(e)
    finally:
        db.close()
