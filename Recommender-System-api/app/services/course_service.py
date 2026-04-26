import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app import models, schemas


def merge_descriptions(th: Optional[str], en: Optional[str]) -> Optional[str]:
    parts = []
    if th:
        parts.append(f"[TH] {th}")
    if en:
        parts.append(f"[EN] {en}")

    return " ".join(parts) if parts else None


def parse_description(description: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    desc_th = None
    desc_en = None

    if description:
        text = description
        if "[TH]" in text and "[EN]" in text:
            th_part, en_part = text.split("[EN]")
            desc_th = th_part.replace("[TH]", "").strip()
            desc_en = en_part.strip()
        elif "[TH]" in text:
            desc_th = text.replace("[TH]", "").strip()
        elif "[EN]" in text:
            desc_en = text.replace("[EN]", "").strip()

    return desc_th, desc_en


def create_or_update_course(
        req: schemas.CourseAndOpeningCreateReq,
        db: Session
) -> Tuple[models.CourseMaster, models.OpeningElectiveCourses, bool]:
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
            new_description = merge_descriptions(req.description_th, req.description_en)
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
        description = merge_descriptions(req.description_th, req.description_en)
        course_data = req.model_dump(
            include={"course_id", "course_name_th", "course_name_en", "is_elective", "topics", "credits"}
        )
        course_data["description"] = description

        course = models.CourseMaster(id=course_uuid, **course_data)
        db.add(course)
        needs_embedding = bool(course.description)

    # Check for duplicate opening
    existing_opening = db.query(models.OpeningElectiveCourses).filter(
        models.OpeningElectiveCourses.course_master_id == course_uuid,
        models.OpeningElectiveCourses.academic_year == req.academic_year,
        models.OpeningElectiveCourses.semester == req.semester,
    ).first()

    if existing_opening:
        if existing_opening.is_active:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Course '{req.course_id}: {req.course_name_en}' was open in {req.semester}/{req.academic_year} already."
            )
        else:
            # Reactivate and update inactive opening
            existing_opening.is_active = True
            existing_opening.lecturer_name = req.lecturer_name
            existing_opening.capacity = req.capacity
            new_opening = existing_opening
    else:
        opening_data = req.model_dump(include={"academic_year", "semester", "lecturer_name", "capacity"})
        new_opening = models.OpeningElectiveCourses(course_master_id=course_uuid, **opening_data)
        db.add(new_opening)

    return course, new_opening, needs_embedding


def format_course_response(
        course: models.CourseMaster,
        opening: models.OpeningElectiveCourses,
        description_th: Optional[str] = None,
        description_en: Optional[str] = None
) -> dict:
    return {
        **course.__dict__,
        "description_th": description_th,
        "description_en": description_en,
        "has_embedding": course.embedding_vector is not None,
        "academic_year": opening.academic_year,
        "semester": opening.semester,
        "lecturer_name": opening.lecturer_name,
        "capacity": opening.capacity,
        "opening_course_id": opening.id
    }


def read_courses(request: schemas.CourseReadReq, db: Session) -> List[dict]:
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
        desc_th, desc_en = parse_description(course.description)
        response_dict = format_course_response(course, opening, desc_th, desc_en)
        response_data.append(response_dict)

    return response_data


def update_course(
        request: schemas.CourseUpdateReq,
        db: Session
) -> Tuple[models.CourseMaster, bool]:
    course = db.query(models.CourseMaster).filter(models.CourseMaster.id == request.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Not Found Course with this ID")

    update_data = request.model_dump(exclude_unset=True, exclude={"id"})

    if request.description_th is not None or request.description_en is not None:
        new_description = merge_descriptions(request.description_th, request.description_en)
        if new_description != course.description:
            update_data["description"] = new_description

    description_changed = ("description" in update_data) and (update_data["description"] != course.description)

    for key, value in update_data.items():
        setattr(course, key, value)

    db.commit()
    db.refresh(course)

    return course, description_changed


def delete_course(request: schemas.CourseDeleteReq, db: Session) -> dict:
    course = db.query(models.CourseMaster).filter(models.CourseMaster.id == request.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Not Found Course with this ID")

    db.delete(course)
    db.commit()

    return {"status": "success", "message": f"Remove '{course.course_id}: {course.course_name_en}' successfully"}


def read_topics(db: Session) -> dict:
    courses_topics = db.query(models.CourseMaster, models.OpeningElectiveCourses).join(
        models.OpeningElectiveCourses,
        models.CourseMaster.id == models.OpeningElectiveCourses.course_master_id
    ).filter(models.OpeningElectiveCourses.is_active == True).all()

    all_topics = set()
    for course, opening in courses_topics:
        if course.topics:
            all_topics.update(course.topics)

    return {"topics": list(all_topics)}
