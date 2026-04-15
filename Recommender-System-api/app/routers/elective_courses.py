import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Union, Optional

from app import models, schemas
from app.dependencies import get_db
from app.internal.ml_service import generate_and_update_embedding

router = APIRouter(prefix="/elective-courses", tags=["Admin CRUD Elective Courses"])

def helper_merge_descriptions(th: Optional[str], en: Optional[str]) -> Optional[str]:
    parts = []
    if th:
        parts.append(f"[TH] {th}")
    if en:
        parts.append(f"[EN] {en}")

    return " ".join(parts) if parts else None

@router.post("/create",
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
            existing_course = db.query(models.CourseMaster).filter(
                models.CourseMaster.course_id == req.course_id
            ).first()

            needs_embedding = False
            if existing_course:
                course_uuid = existing_course.id
                update_data = req.model_dump(
                    include={"course_name_th", "course_name_en", "is_elective", "topics", "credits"},
                    exclude_unset=True
                )

                if req.description_th is not None or req.description_en is not None:
                    new_description = helper_merge_descriptions(req.description_th, req.description_en)
                    if new_description != existing_course.description:
                        update_data["description"] = new_description

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
                description = helper_merge_descriptions(req.description_th, req.description_en)
                course_data = req.model_dump(
                    include={"course_id", "course_name_th", "course_name_en", "is_elective", "topics", "credits"}
                )
                course_data["description"] = description

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
                    detail=f"Course '{req.course_id}: {req.course_name_en}' was open in {req.semester}/{req.academic_year} already."
                )

            opening_data = req.model_dump(include={"academic_year", "semester", "lecturer_name", "capacity"})
            new_opening = models.OpeningElectiveCourses(course_master_id=course_uuid, **opening_data)
            db.add(new_opening)
            processed_courses.append((course, needs_embedding, req, new_opening))

        db.flush()

        final_courses = []
        for course, needs_embedding, req, new_opening in processed_courses:
            response_data = {
                **course.__dict__,
                "description_th": req.description_th,
                "description_en": req.description_en,
                "has_embedding": course.embedding_vector is not None,
                "academic_year": req.academic_year,
                "semester": req.semester,
                "lecturer_name": req.lecturer_name,
                "capacity": req.capacity,
                "opening_course_id": new_opening.id

            }

            final_courses.append(schemas.CourseWithOpeningResponse(**response_data))

        db.commit()
        for course, needs_embedding, req, _ in processed_courses:
            # db.refresh(course)
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
    query = db.query(models.CourseMaster, models.OpeningElectiveCourses).join(
        models.OpeningElectiveCourses,
        models.CourseMaster.id == models.OpeningElectiveCourses.course_master_id
    )
    query = query.filter(models.OpeningElectiveCourses.is_active == True)

    if request.academic_year:
        query = query.filter(models.OpeningElectiveCourses.academic_year == request.academic_year)
    if request.semester:
        query = query.filter(models.OpeningElectiveCourses.semester == request.semester)
    if request.id:
        query = query.filter(models.CourseMaster.id == request.id)
    if request.keyword:
        search = f"%{request.keyword}%"
        query = query.filter(
            (models.CourseMaster.course_id.ilike(search)) |
            (models.CourseMaster.course_name_en.ilike(search)) |
            (models.CourseMaster.course_name_th.ilike(search))
        )
    results = query.all()

    if not results:
        raise HTTPException(
            status_code=404,
            detail="Not Found Courses with these criteria"
        )

    response_data = []
    for course, opening in results:
        desc_th = None
        desc_en = None

        if course.description:
            text = course.description
            if "[TH]" in text and "[EN]" in text:
                th_part, en_part = text.split("[EN]")
                desc_th = th_part.replace("[TH]", "").strip()
                desc_en = en_part.strip()
            elif "[TH]" in text:
                desc_th = text.replace("[TH]", "").strip()
            elif "[EN]" in text:
                desc_en = text.replace("[EN]", "").strip()

        response_dict = {
            **course.__dict__,
            "description_th": desc_th,
            "description_en": desc_en,
            "has_embedding": course.embedding_vector is not None,
            "academic_year": opening.academic_year,
            "semester": opening.semester,
            "lecturer_name": opening.lecturer_name,
            "capacity": opening.capacity,
            "opening_course_id": opening.id
        }
        response_data.append(response_dict)

    return response_data


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

    if request.description_th is not None or request.description_en is not None:
        new_description = helper_merge_descriptions(request.description_th, request.description_en)
        if new_description != course.description:
            update_data["description"] = new_description

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

    return {"status": "success", "message": f"Remove '{course.course_id}: {course.course_name_en}' successfully"}
