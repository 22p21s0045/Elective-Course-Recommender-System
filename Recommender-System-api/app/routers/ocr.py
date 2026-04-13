from fastapi import APIRouter, File, UploadFile, HTTPException

from app.internal.ocr_service_gemini import extract_transcript_ocr
from app.schemas import RecommendationRequest

router = APIRouter(prefix="/ocr", tags=["OCR"])

@router.post("/extract-data", response_model=RecommendationRequest)
async def extract_data_endpoint(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="Please upload a file")

    ocr_result = await extract_transcript_ocr(file)
    return ocr_result