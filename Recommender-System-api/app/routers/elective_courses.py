import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Union

from app import models, schemas
from app.dependencies import get_db
from app.internal.ml_service import generate_and_update_embedding

router = APIRouter(prefix="/elective-courses", tags=["Admin CRUD Elective Courses"])


@router.post("/create")
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
            existing_course = db.query(models.CourseMaster).filter(
                models.CourseMaster.course_id == req.course_id
            ).first()

            needs_embedding = False
            if existing_course:
                course_uuid = existing_course.id
                update_data = req.model_dump(
                    include={"course_name_th", "course_name_en", "description", "is_elective", "topics", "credits"},
                    exclude_unset=True
                )

                needs_embedding = (
                        "description" in update_data and
                        update_data["description"] != existing_course.description and
                        update_data["description"]
                )

                for key, value in update_data.items():
                    setattr(existing_course, key, value)

                course = existing_course
            else:
                course_uuid = uuid.uuid4()
                course_data = req.model_dump(
                    include={"course_id", "course_name_th", "course_name_en", "description", "is_elective", "topics",
                             "credits"}
                )

                course = models.CourseMaster(id=course_uuid, **course_data)
                db.add(course)
                needs_embedding = bool(course.description)

            existing_opening = db.query(models.OpeningElectiveCourses).filter(
                models.OpeningElectiveCourses.course_master_id == course_uuid,
                models.OpeningElectiveCourses.academic_year == req.academic_year,
                models.OpeningElectiveCourses.semester == req.semester
            ).first()

            if existing_opening:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail=f"Course {req.course_id}: {req.course_name_en} was open in {req.semester}/{req.academic_year} already."
                )

            opening_data = req.model_dump(include={"academic_year", "semester", "lecturer_name", "capacity"})
            new_opening = models.OpeningElectiveCourses(course_master_id=course_uuid,**opening_data)
            db.add(new_opening)
            processed_courses.append((course, needs_embedding, req))

        db.commit()

        for course, needs_embedding, req in processed_courses:
            db.refresh(course)
            if needs_embedding and course.description:
                background_tasks.add_task(
                    generate_and_update_embedding,
                    course.id,
                    course.description,
                )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

    final_courses = []
    for course, needs_embedding, req in processed_courses:
        course_response = {
            "id": course.id,
            "course_id": course.course_id,
            "course_name_th": course.course_name_th,
            "course_name_en": course.course_name_en,
            "description": course.description,
            "is_elective": course.is_elective,
            "topics": course.topics,
            "credits": course.credits,
            "created_at": course.created_at,
            "updated_at": course.updated_at,
            "has_embedding": course.embedding_vector is not None,
            "academic_year": req.academic_year,
            "semester": req.semester,
            "lecturer_name": req.lecturer_name,
            "capacity": req.capacity,
        }
        final_courses.append(course_response)

    return final_courses if is_batch else final_courses[0]


@router.post("/", response_model=List[schemas.CourseResponse])
async def read_course(request: schemas.CourseReadReq,
                      db: Session = Depends(get_db)):
    query = db.query(models.CourseMaster)

    if request.academic_year or request.semester:
        query = query.join(
            models.OpeningElectiveCourses,
            models.CourseMaster.id == models.OpeningElectiveCourses.course_master_id
        )

        if request.academic_year:
            query = query.filter(models.OpeningElectiveCourses.academic_year == request.academic_year)
        if request.semester:
            query = query.filter(models.OpeningElectiveCourses.semester == request.semester)
        query = query.filter(models.OpeningElectiveCourses.is_active == True)

    if request.id:
        query = query.filter(models.CourseMaster.id == request.id)
    if request.keyword:
        search = f"%{request.keyword}%"
        query = query.filter(
            (models.CourseMaster.course_id.ilike(search)) |
            (models.CourseMaster.course_name_en.ilike(search)) |
            (models.CourseMaster.course_name_th.ilike(search))
        )
    courses = query.all()

    if not courses:
        raise HTTPException(
            status_code=404,
            detail="Not Found Courses with these criteria"
        )

    for c in courses:
        c.has_embedding = c.embedding_vector is not None
    return courses


@router.patch("/update", response_model=schemas.CourseResponse)
async def update_course(
        request: schemas.CourseUpdateReq,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    course = db.query(models.CourseMaster).filter(models.CourseMaster.id == request.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Not Found Course with this ID")

    update_data = request.model_dump(exclude_unset=True, exclude={"id"})

    description_changed = ("description" in update_data) and (update_data["description"] != course.description)

    for key, value in update_data.items():
        setattr(course, key, value)

    db.commit()
    db.refresh(course)

    if description_changed and course.description:
        background_tasks.add_task(generate_and_update_embedding, course.id, course.description)

    course.has_embedding = course.embedding_vector is not None
    return course


@router.post("/delete")
async def delete_course(
        request: schemas.CourseDeleteReq,
        db: Session = Depends(get_db)
):
    course = db.query(models.CourseMaster).filter(models.CourseMaster.id == request.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Not Found Course with this ID")

    db.delete(course)
    db.commit()

    return {"status": "success", "message": f"Remove {course.course_id}: {course.course_name_en} successfully"}
