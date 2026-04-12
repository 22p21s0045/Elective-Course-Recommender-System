from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.internal.data_processor import preprocess_target_student, get_master_data
from app.dependencies import get_db

router = APIRouter(
    prefix="/recommend",
    tags=["Recommendation System"],
)


@router.post("/")
async def get_course_recommendations(request: schemas.RecommendationRequest, db: Session = Depends(get_db)):
    target_df = preprocess_target_student(request.student_id, request.raw_grades)

    if target_df.empty:
        return {"message": "cannot recommend because not found INT grades > 0"}

    master_df = get_master_data(db)

    return {
        "message": "Completed: Master Data is ready to use",
        "target_student_records": len(target_df),
        "master_data_records": len(master_df),
        "master_data_preview": master_df.head(5).to_dict(orient="records")
    }
