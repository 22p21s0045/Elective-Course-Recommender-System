from fastapi import FastAPI, APIRouter
from app import schemas
from app.internal.data_processor import preprocess_target_student

router = APIRouter(
    prefix="/recommend",
    tags=["Recommendation System"],
)

@router.post("/")
async def get_course_recommendations(request: schemas.RecommendationRequest):

    target_df = preprocess_target_student(request.student_id, request.raw_grades)

    if target_df.empty:
        return {"message": "cannot recommend because not found INT grades > 0"}

    return {
        "message": "Step 2 Completed: Data Preprocessing Successful",
        "records_after_filter": len(target_df),
        "dataframe_preview": target_df.to_dict(orient="records")
    }
