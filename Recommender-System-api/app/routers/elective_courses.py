from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Union

from app import schemas
from app.dependencies import get_db
from app.internal.ml_service import generate_and_update_embedding
from app.services.course_service import (
    create_or_update_course,
    format_course_response,
    parse_description,
    read_courses,
    update_course,
    delete_course,
    read_topics
)

router = APIRouter(prefix="/elective-courses", tags=["Admin CRUD Elective Courses"])


@router.post("/create", status_code=status.HTTP_201_CREATED,
             response_model=Union[schemas.CourseWithOpeningResponse, List[schemas.CourseWithOpeningResponse]])
async def create_course(
        request: Union[schemas.CourseAndOpeningCreateReq, List[schemas.CourseAndOpeningCreateReq]],
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
):
    is_batch = isinstance(request, list)
    requests = request if is_batch else [request]
    processed_courses = []

    try:
        for req in requests:
            course, new_opening, needs_embedding = create_or_update_course(req, db)
            processed_courses.append((course, needs_embedding, req, new_opening))

        db.flush()

        final_courses = []
        for course, needs_embedding, req, new_opening in processed_courses:
            desc_th, desc_en = parse_description(course.description)
            response_data = format_course_response(course, new_opening, desc_th, desc_en)
            response_data["opening_course_id"] = new_opening.id
            final_courses.append(schemas.CourseWithOpeningResponse(**response_data))

        db.commit()
        for course, needs_embedding, req, _ in processed_courses:
            if needs_embedding and course.description:
                background_tasks.add_task(
                    generate_and_update_embedding,
                    course.id,
                    course.description,
                )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

    return final_courses if is_batch else final_courses[0]


@router.post("/", response_model=List[schemas.CourseWithOpeningResponse])
async def read_course(request: schemas.CourseReadReq,
                      db: Session = Depends(get_db)):
    response_data = read_courses(request, db)
    return [schemas.CourseWithOpeningResponse(**data) for data in response_data]


@router.patch("/update", response_model=schemas.CourseResponse)
async def update_course_endpoint(
        request: schemas.CourseUpdateReq,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    course, description_changed = update_course(request, db)

    if description_changed and course.description:
        background_tasks.add_task(generate_and_update_embedding, course.id, course.description)

    course.has_embedding = course.embedding_vector is not None
    return course


@router.post("/delete")
async def delete_course_endpoint(
        request: schemas.CourseDeleteReq,
        db: Session = Depends(get_db)
):
    return delete_course(request, db)


@router.post("/topics")
async def read_topics_endpoint(db: Session = Depends(get_db)):
    return read_topics(db)
