from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.database import engine
from app import models, schemas

models.Base.metadata.create_all(bind=engine)

router = APIRouter()

@router.get("/testdb", response_model=List[schemas.Grade])
async def test_db(db: Session = Depends(get_db)):
    grades = db.query(models.StudentGrade).all()
    return grades