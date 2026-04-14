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
    is_batch = isinstance(request, list)
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


@router.post("/update", response_model=schemas.CourseResponse)
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

    return {"status": "success", "message": f"Remove {course.course_id} successfully"}
