from fastapi import APIRouter, File, UploadFile, HTTPException

from app.internal.ocr_service_gemini import extract_transcript_ocr
from app.internal.ocr_service_ollama import extract_transcript_with_groq
from app.schemas import RecommendationRequest

router = APIRouter(prefix="/ocr", tags=["OCR"])

# @router.post("/extract-data", response_model=RecommendationRequest)
# async def extract_data_endpoint(file: UploadFile = File(...)):
#     if not file:
#         raise HTTPException(status_code=400, detail="Please upload a file")
#
#     ocr_result = await extract_transcript_ocr(file)
#     return ocr_result

@router.post("/extract-data", response_model=RecommendationRequest)
async def extract_data_endpoint(file: UploadFile = File(...)):
    """
    รับไฟล์รูปภาพทรานสคริปต์ (JPEG/PNG) หรือ PDF (1 หน้าหรือหลายหน้า)
    ส่งให้ Groq AI (Llama 4 Vision) ประมวลผลและแปลงกลับมาเป็น JSON
    """
    if not file:
        raise HTTPException(status_code=400, detail="กรุณาแนบไฟล์ที่ต้องการตรวจสอบ")

    # เช็คนามสกุลไฟล์เบื้องต้นก่อนส่งเข้า Service
    valid_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail="รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG) หรือ PDF เท่านั้น"
        )

    # โยนเข้า Service ให้จัดการแยกแยะและดึงข้อมูล
    result = await extract_transcript_with_groq(file)

    return result