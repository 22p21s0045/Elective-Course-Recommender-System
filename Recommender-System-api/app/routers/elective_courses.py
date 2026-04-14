from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Union

from app import models, schemas
from app.dependencies import get_db
from app.internal.ml_service import generate_and_update_embedding

router = APIRouter(prefix="/elective-courses", tags=["Admin CRUD Elective Courses"])


@router.post("/create", response_model=Union[schemas.CourseResponse, List[schemas.CourseResponse]])
async def create_course(
        request: Union[schemas.CourseCreateReq, List[schemas.CourseCreateReq]],
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
):
    is_batch =isinstance(request, list)
    requests = request if is_batch else [request]

    created_courses = []
    for req in requests:
        existing = db.query(models.CourseMaster).filter(
            models.CourseMaster.course_id == req.course_id,
            models.CourseMaster.course_name_en == req.course_name_en
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Course {req.course_id}: {req.course_name_en} already exists."
            )


    for req in requests:
        new_course = models.CourseMaster(**req.model_dump())
        db.add(new_course)
        created_courses.append(new_course)

    db.commit()

    for course in created_courses:
        db.refresh(course)
        if course.description:
            background_tasks.add_task(
                generate_and_update_embedding,
                course.id,
                course.description,
            )
        course.has_embedding = False

    if is_batch:
        return created_courses
    else:
        return created_courses[0]




