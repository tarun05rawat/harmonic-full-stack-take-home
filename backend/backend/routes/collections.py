import uuid

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.db import database
from backend.routes.companies import (
    CompanyBatchOutput,
    fetch_companies_with_liked,
)

router = APIRouter(
    prefix="/collections",
    tags=["collections"],
)


class CompanyCollectionMetadata(BaseModel):
    id: uuid.UUID
    collection_name: str
    total: int  # Add company count


class CompanyCollectionOutput(CompanyBatchOutput, CompanyCollectionMetadata):
    pass


class CreateCollectionRequest(BaseModel):
    collection_name: str


class CreateCollectionResponse(BaseModel):
    id: uuid.UUID
    collection_name: str
    message: str


class RemoveCompaniesRequest(BaseModel):
    company_ids: list[int]


class RemoveCompaniesResponse(BaseModel):
    collection_id: uuid.UUID
    removed_count: int
    message: str


@router.get("", response_model=list[CompanyCollectionMetadata])
def get_all_collection_metadata(
    db: Session = Depends(database.get_db),
):
    collections = db.query(database.CompanyCollection).all()

    result = []
    for collection in collections:
        # Count companies in this collection
        company_count = (
            db.query(database.CompanyCollectionAssociation)
            .filter(database.CompanyCollectionAssociation.collection_id == collection.id)
            .count()
        )
        
        result.append(CompanyCollectionMetadata(
            id=collection.id,
            collection_name=collection.collection_name,
            total=company_count,
        ))
    
    return result


@router.post("", response_model=CreateCollectionResponse)
def create_collection(
    request: CreateCollectionRequest,
    db: Session = Depends(database.get_db),
):
    # Check if collection name already exists
    existing_collection = (
        db.query(database.CompanyCollection)
        .filter(database.CompanyCollection.collection_name == request.collection_name)
        .first()
    )
    
    if existing_collection:
        raise HTTPException(400, f"Collection '{request.collection_name}' already exists")
    
    # Create new collection
    new_collection = database.CompanyCollection(
        collection_name=request.collection_name
    )
    db.add(new_collection)
    db.commit()
    db.refresh(new_collection)
    
    return CreateCollectionResponse(
        id=new_collection.id,
        collection_name=new_collection.collection_name,
        message=f"Collection '{request.collection_name}' created successfully"
    )


@router.get("/{collection_id}", response_model=CompanyCollectionOutput)
def get_company_collection_by_id(
    collection_id: uuid.UUID,
    offset: int = Query(
        0, description="The number of items to skip from the beginning"
    ),
    limit: int = Query(10, description="The number of items to fetch"),
    db: Session = Depends(database.get_db),
):
    query = (
        db.query(database.CompanyCollectionAssociation, database.Company)
        .join(database.Company)
        .filter(database.CompanyCollectionAssociation.collection_id == collection_id)
    )

    total_count = query.with_entities(func.count()).scalar()

    results = query.offset(offset).limit(limit).all()
    companies = fetch_companies_with_liked(db, [company.id for _, company in results])

    return CompanyCollectionOutput(
        id=collection_id,
        collection_name=db.query(database.CompanyCollection)
        .get(collection_id)
        .collection_name,
        companies=companies,
        total=total_count,
    )


@router.delete("/{collection_id}/companies", response_model=RemoveCompaniesResponse)
def remove_companies_from_collection(
    collection_id: uuid.UUID,
    request: RemoveCompaniesRequest,
    db: Session = Depends(database.get_db),
):
    # Verify collection exists
    collection = db.query(database.CompanyCollection).get(collection_id)
    if not collection:
        raise HTTPException(404, f"Collection with id {collection_id} not found")
    
    # Remove companies from collection
    removed_count = 0
    for company_id in request.company_ids:
        result = (
            db.query(database.CompanyCollectionAssociation)
            .filter(
                database.CompanyCollectionAssociation.collection_id == collection_id,
                database.CompanyCollectionAssociation.company_id == company_id
            )
            .delete()
        )
        removed_count += result
    
    db.commit()
    
    return RemoveCompaniesResponse(
        collection_id=collection_id,
        removed_count=removed_count,
        message=f"Removed {removed_count} companies from '{collection.collection_name}'"
    )