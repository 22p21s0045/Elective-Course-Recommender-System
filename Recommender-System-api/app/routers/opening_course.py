from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Union

from app import models, schemas
from app.dependencies import get_db

router = APIRouter(prefix="/opening-course", tags=["Admin CRUD Opening Course"])

# @router.post("/create", response_model=Union[schemas.OpeningCourseResponse, List[schemas.OpeningCourseResponse]])
# async def create_opening(
#         request: Union[schemas.OpeningCourseCreateReq, List[schemas.OpeningCourseCreateReq]],
#         db: Session = Depends(get_db)
# ):
#     is_batch = isinstance(request, list)
#     requests = request if is_batch else [request]
#     created_openings = []
#
#     try:
#         for req in requests:
#             # เช็คก่อนว่า course_master_id นี้มีอยู่จริงไหม
#             master = db.query(models.CourseMaster).filter(models.CourseMaster.id == req.course_master_id).first()
#             if not master:
#                 db.rollback()
#                 raise HTTPException(status_code=404, detail=f"ไม่พบวิชาหลักรหัสอ้างอิง {req.course_master_id}")
#
#             new_opening = models.OpeningElectiveCourse(**req.model_dump())
#             db.add(new_opening)
#             created_openings.append(new_opening)
#
#         db.commit()
#
#         for op in created_openings:
#             db.refresh(op)
#
#         return created_openings if is_batch else created_openings[0]
#
#     except IntegrityError:
#         # ดักจับ Error ที่เกิดจาก Unique Constraint (เปิดซ้ำในเทอมเดียวกัน)
#         db.rollback()
#         raise HTTPException(
#             status_code=400,
#             detail="ไม่สามารถบันทึกได้ เนื่องจากมีการเปิดสอนวิชานี้ใน ปีการศึกษา และ เทอม นี้ไปแล้ว"
#         )


# @router.post("/read", response_model=List[schemas.OpeningCourseResponse])
# async def read_openings(
#         request: schemas.OpeningCourseReadReq,
#         db: Session = Depends(get_db)
# ):
#     query = db.query(models.OpeningElectiveCourse)
#
#     if request.id:
#         query = query.filter(models.OpeningElectiveCourse.id == request.id)
#     if request.course_master_id:
#         query = query.filter(models.OpeningElectiveCourse.course_master_id == request.course_master_id)
#     if request.academic_year:
#         query = query.filter(models.OpeningElectiveCourse.academic_year == request.academic_year)
#     if request.semester:
#         query = query.filter(models.OpeningElectiveCourse.semester == request.semester)
#
#     # กรองเฉพาะ active/inactive (ค่า default คือกรองเฉพาะ is_active=True)
#     if request.is_active is not None:
#         query = query.filter(models.OpeningElectiveCourse.is_active == request.is_active)
#
#     return query.all()


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