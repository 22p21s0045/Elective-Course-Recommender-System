from fastapi import APIRouter, File, UploadFile, HTTPException, Request

from app.internal.ocr_service_gemini import extract_transcript_ocr
from app.schemas import RecommendationRequest

router = APIRouter(prefix="/ocr", tags=["OCR"])

@router.post("/extract-data", response_model=RecommendationRequest)
async def extract_data_endpoint(request: Request, file: UploadFile = File(...)):
    form_data =await request.form()
    uploaded_files = form_data.getlist("file")
    if len(uploaded_files) > 1:
        raise HTTPException(
            status_code=400,
            detail="Please only upload one file",
        )

    if not file:
        raise HTTPException(status_code=400, detail="Please upload a transcript file")

    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only Image(JPEG, PNG) and PDF files are allowed")

    ocr_result = await extract_transcript_ocr(file)
    return ocr_result