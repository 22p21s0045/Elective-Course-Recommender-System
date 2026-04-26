from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.dependencies import get_db
from app.services.opening_course_service import update_opening_course, delete_opening_course

router = APIRouter(prefix="/opening-course", tags=["Admin CRUD Opening Course"])


@router.patch("/update", response_model=schemas.OpeningCourseResponse)
async def update_opening(
        request: schemas.OpeningCourseUpdateReq,
        db: Session = Depends(get_db)
):
    return update_opening_course(request, db)


@router.post("/delete")
async def delete_opening(
        request: schemas.OpeningCourseDeleteReq,
        db: Session = Depends(get_db)
):
    return delete_opening_course(request, db)
