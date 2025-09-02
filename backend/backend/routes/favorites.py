from __future__ import annotations

from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from ..db.database import SessionLocal  # ← your SessionLocal

router = APIRouter(prefix="/favorites", tags=["favorites"])

class ToggleFavoriteRequest(BaseModel):
    favorites_list_id: UUID     # company_collections.id of your "Favorites"/"Liked Companies"
    company_id: int             # companies.id (INT)
    liked: bool                 # true → favorite; false → unfavorite

class ToggleFavoriteResponse(BaseModel):
    company_id: int
    liked: bool                 # final state after operation

@router.post("/toggle", response_model=ToggleFavoriteResponse)
def toggle_favorite(req: ToggleFavoriteRequest):
    if not isinstance(req.company_id, int):
        raise HTTPException(422, "company_id must be an integer")

    db = SessionLocal()
    try:
        if req.liked:
            # INSERT; ignore if already exists
            insert_sql = text("""
                INSERT INTO company_collection_associations (collection_id, company_id)
                VALUES (:collection_id, :company_id)
                ON CONFLICT ON CONSTRAINT uq_company_collection DO NOTHING
            """)
            db.execute(insert_sql, {
                "collection_id": str(req.favorites_list_id),
                "company_id": req.company_id
            })
            db.commit()
            return ToggleFavoriteResponse(company_id=req.company_id, liked=True)
        else:
            # DELETE; ok if it didn't exist
            delete_sql = text("""
                DELETE FROM company_collection_associations
                WHERE collection_id = :collection_id AND company_id = :company_id
            """)
            db.execute(delete_sql, {
                "collection_id": str(req.favorites_list_id),
                "company_id": req.company_id
            })
            db.commit()
            return ToggleFavoriteResponse(company_id=req.company_id, liked=False)
    finally:
        db.close()
