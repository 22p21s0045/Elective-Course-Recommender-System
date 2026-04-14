from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app import models, schemas
from app.dependencies import get_db
from app.internal.ml_service import generate_and_update_embedding

router = APIRouter(prefix="/elective-courses", tags=["Admin CRUD Elective Courses"])


@router.post("/create", response_model=schemas.CourseResponse)
async def create_course(
        request: schemas.CourseCreateReq,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
):
    existing = db.query(models.CourseMaster).filter(
        models.CourseMaster.course_id == request.course_id,
        models.CourseMaster.course_name_en == request.course_name_en
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Course {request.course_id}: {request.course_name_en} already exists."
        )

    new_course = models.CourseMaster(**request.model_dump())
    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    if new_course.description:
        background_tasks.add_task(
            generate_and_update_embedding,
            new_course.id,
            new_course.description,
            db
        )

    new_course.has_embedding = False
    return new_course




