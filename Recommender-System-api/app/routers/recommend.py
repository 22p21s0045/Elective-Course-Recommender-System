from fastapi import FastAPI, APIRouter
from app import schemas

router = APIRouter(
    prefix="/recommend",
    tags=["Recommendation System"],
)

@router.post("/")
async def get_course_recommendations(request: schemas.RecommendationRequest):

    total_subject = len(request.raw_grades)

    return {
        "student_id": request.student_id,
        "total_subject": total_subject,
        "data_recived": request.raw_grades,
    }
