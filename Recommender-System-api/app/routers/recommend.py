import pandas as pd
import time

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from app import schemas
from app.dependencies import get_db
from app.internal.recommender import train_svd_model, get_top_n_recommendations
from app.internal.data_processor import preprocess_target_student, get_master_data
from app.internal.ocr_service import extract_transcript_ocr
from app.schemas import RecommendationRequest


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
    combined_df = pd.concat([master_df, target_df], ignore_index=True)

    start_time = time.time()
    trained_model = train_svd_model(combined_df)
    training_time = time.time() - start_time

    top_3_courses = get_top_n_recommendations(
        model=trained_model,
        student_id=request.student_id,
        combined_df=combined_df,
        n=3
    )

    return {
        "status": "success",
        "master_data": len(master_df),
        "target_student_data": len(target_df),
        "combined_data": len(combined_df),
        "student_id": request.student_id,
        "training_time_seconds": round(training_time, 4),
        "total_courses_analyzed": len(combined_df['course_code'].unique()),
        "recommendations": top_3_courses
    }


@router.post("/extract-data", response_model=RecommendationRequest)
async def extract_transcript_endpoint(file: UploadFile = File(...)):
    ocr_result = await extract_transcript_ocr(file)
    return ocr_result
