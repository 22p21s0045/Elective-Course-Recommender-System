import pandas as pd
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import RecommendationRequest, HybridRecommendReq
from app.dependencies import get_db
from app.internal.recommender import train_svd_model, get_top_n_recommendations
from app.internal.data_processor import preprocess_target_student, get_master_data
from app.services import recommend_service


router = APIRouter(
    prefix="/recommend",
    tags=["Recommendation System"],
)


@router.post("/",)
async def get_course_recommendations(request: RecommendationRequest, db: Session = Depends(get_db)):
    student_id = request.student_id
    raw_grades = request.raw_grades

    target_df = preprocess_target_student(student_id, raw_grades)

    if target_df.empty:
        return {"status": "error", "message": "cannot recommend because not found INT grades > 0"}

    master_df = get_master_data(db)
    combined_df = pd.concat([master_df, target_df], ignore_index=True)

    start_time = time.time()
    trained_model = train_svd_model(combined_df)
    training_time = time.time() - start_time

    top_3_courses = get_top_n_recommendations(
        model=trained_model,
        student_id=student_id,
        combined_df=combined_df,
        n=3
    )

    return {
        "master_data": len(master_df),
        "target_student_data": len(target_df),
        "combined_data": len(combined_df),
        "training_time_seconds": round(training_time, 4),
        "total_courses_analyzed": len(combined_df['course_code'].unique()),
        "status": "success",
        "student_id": student_id,
        "recommendations": top_3_courses

    }

@router.post("/hybrid-recommend")
async def get_hybrid_recommendations(request: HybridRecommendReq, db: Session = Depends(get_db)):
    try:
        result = recommend_service.calculate_hybrid_recommendation(request, db)

        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

