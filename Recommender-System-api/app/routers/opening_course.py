from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Union

from app import models, schemas
from app.dependencies import get_db

router = APIRouter(prefix="/opening-course", tags=["Admin CRUD Opening Course"])

@router.patch("/update", response_model=schemas.OpeningCourseResponse)
async def update_opening(
        request: schemas.OpeningCourseUpdateReq,
        db: Session = Depends(get_db)
):
    opening = db.query(models.OpeningElectiveCourses).filter(models.OpeningElectiveCourses.id == request.id).first()
    if not opening:
        raise HTTPException(status_code=404, detail="Not Found Opening Course with this ID้")

    update_data = request.model_dump(exclude_unset=True, exclude={"id"})

    try:
        for key, value in update_data.items():
            setattr(opening, key, value)

        db.commit()
        db.refresh(opening)
        return opening

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Semester and Academic Year already exists")


@router.post("/delete")
async def delete_opening(
        request: schemas.OpeningCourseDeleteReq,
        db: Session = Depends(get_db)
):
    opening = db.query(models.OpeningElectiveCourses).filter(models.OpeningElectiveCourses.id == request.id).first()
    if not opening:
        raise HTTPException(status_code=404, detail="Not Found Opening Course with this ID")
    if not opening.is_active:
        raise HTTPException(status_code=400, detail="This course has already been deleted.")

    opening.is_active = False
    db.commit()

    return {"status": "success", "message": "This Course has been deleted"}