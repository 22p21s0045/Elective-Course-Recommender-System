import base64
import fitz
from fastapi import UploadFile, HTTPException
from groq import Groq
from app.schemas import RecommendationRequest
from app.config import settings

client = Groq(
    api_key=settings.GROQ_API_KEY,
)

async def extract_transcript_with_groq(file: UploadFile) -> RecommendationRequest:
    image_data_list = []

    try:
        file_bytes = await file.read()

        # ตรวจสอบประเภทไฟล์
        if file.content_type == "application/pdf":
            # กรณีเป็น PDF: แปลงแต่ละหน้าเป็นรูปภาพ
            pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                # เพิ่มความละเอียดภาพ (2 เท่า) เพื่อให้ AI อ่านตัวอักษรเล็กๆ ได้แม่นขึ้น
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img_bytes = pix.tobytes("png")
                base64_img = base64.b64encode(img_bytes).decode('utf-8')
                image_data_list.append(f"data:image/png;base64,{base64_img}")
            pdf_document.close()
        elif file.content_type and file.content_type.startswith("image/"):
            # กรณีเป็นรูปภาพทั่วไป
            base64_img = base64.b64encode(file_bytes).decode('utf-8')
            image_data_list.append(f"data:{file.content_type};base64,{base64_img}")
        else:
            raise HTTPException(status_code=400, detail="รองรับเฉพาะไฟล์รูปภาพ (JPEG/PNG) หรือ PDF เท่านั้น")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read file: {str(e)}")

    prompt = """
        You are an expert data extraction assistant specializing in educational documents.
        Analyze the provided university transcript image(s) and extract the data STRICTLY into the following JSON format:
        {
          "student_id": "11-digit student ID (e.g., 651305000xx). If not found, output 'UNKNOWN'",
          "raw_grades": [
            {
              "course_code": "Course Code (remove any hyphens) followed by the English Course Title (e.g., 'INT101 PROGRAMMING FUNDAMENTALS')",
              "grade_letter": "The exact grade received (A, B+, B, C+, C, D+, D, F, S)"
            }
          ]
        }
        STRICT RULES:
        1. Layout: Seamlessly handle 2-column transcript layouts without mixing text from different columns.
        2. Multi-line Titles: If a COURSE TITLE spans multiple lines, merge it into a single continuous string with a single space.
        3. Filtering: ONLY extract courses that have a clearly visible grade. Skip any headers, credits, or courses without grades.
        4. Grade Conversion: If the grade "A+" is detected, you MUST convert it to "A".
        5. Formatting: OUTPUT JSON ONLY. Do not include any explanations, greetings, or markdown code blocks (e.g., no ```json).
        """

    content = [{"type": "text", "text": prompt}]
    for img_url in image_data_list:
        content.append({
            "type": "image_url",
            "image_url": {"url": img_url}
        })

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": content
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        json_str = response.choices[0].message.content
        result_obj = RecommendationRequest.model_validate_json(json_str)

        return result_obj

    except Exception as e:
        print(f"Groq API Error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI อ่านภาพ/PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")