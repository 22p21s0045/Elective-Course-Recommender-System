from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app import models, schemas


def update_opening_course(request: schemas.OpeningCourseUpdateReq, db: Session):
    opening = db.query(models.OpeningElectiveCourses).filter(models.OpeningElectiveCourses.id == request.id).first()
    if not opening:
        raise HTTPException(status_code=404, detail="Not Found Opening Course with this ID")

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


def delete_opening_course(request: schemas.OpeningCourseDeleteReq, db: Session) -> dict:
    opening = db.query(models.OpeningElectiveCourses).filter(models.OpeningElectiveCourses.id == request.id).first()
    if not opening:
        raise HTTPException(status_code=404, detail="Not Found Opening Course with this ID")
    if not opening.is_active:
        raise HTTPException(status_code=400, detail="This course has already been deleted.")

    opening.is_active = False
    db.commit()

    return {"status": "success", "message": "This Course has been deleted"}
