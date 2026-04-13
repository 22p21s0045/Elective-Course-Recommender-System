import json
import httpx
import re
from fastapi import UploadFile, HTTPException

from app.schemas import OCRSubject, RecommendationRequest
from app.config import settings


async def extract_transcript_ocr(file: UploadFile) -> RecommendationRequest:
    api_key = settings.typhoon_ocr_api_key

    url = "https://api.opentyphoon.ai/v1/ocr"

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read file: {str(e)}")

    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

    data = {
        'model': 'typhoon-ocr',
        'task_type': 'default',
        'max_tokens': '16384',
        'temperature': '0.1',
        'top_p': '0.6',
        'repetition_penalty': '1.2'
    }

    files = {
        'file': (file.filename, file_bytes, file.content_type)
    }

    headers = {
        'Authorization': f'Bearer {api_key}'
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            response = await client.post(url, data=data, files=files, headers=headers)
            response.raise_for_status()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Timeout occurred")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Typhoon API Error: {e.response.text}")

    result = response.json()

    extracted_texts = []
    for page_result in result.get('results', []):
        if page_result.get('success') and page_result.get('message'):
            content = page_result['message']['choices'][0]['message']['content']
            try:
                parsed_content = json.loads(content)
                text = parsed_content.get('natural_text', content)
            except json.JSONDecodeError:
                text = content
            extracted_texts.append(text)

    full_text = '\n'.join(extracted_texts)

    clean_text = re.sub(r'<[^>]+>', ' ', full_text)

    # Student ID NO
    student_id_pattern = re.search(r'STUDENT ID NO\.?\s*(\d{11})', clean_text, re.IGNORECASE)
    extracted_student_id = student_id_pattern.group(1) if student_id_pattern else "UNKNOWN"

    # Grades
    valid_grades = {'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'S'}
    extracted_subjects = []
    pattern = re.compile(r'([a-zA-Z]{3}\s?-?\s?\d{3,5})\s+(.+?)(?:\s+\d\s+|\s+)([A-DFS][+]?)\b')
    matches = pattern.findall(clean_text)
    seen_courses = set()

    for course_code, course_title, grade in matches:
        course_code_clean = course_code.replace(" ", "").replace("-", "").upper()
        course_title_clean = course_title.strip()
        grade = grade.upper()

        if grade == 'A+':
            grade = 'A'

        if grade in valid_grades and course_code_clean not in seen_courses:
            combined_course_name = f"{course_code_clean} {course_title_clean}"
            extracted_subjects.append(
                OCRSubject(course_code=combined_course_name, grade_letter=grade)
            )
            seen_courses.add(course_code_clean)

    if not extracted_subjects or extracted_student_id == "UNKNOWN":
        print(f"--- Debug: Cleaned Text ---\n{clean_text}\n-------------------")
        raise HTTPException(status_code=400,
                            detail="Please upload a clear transcript image with recognizable course codes and grades (e.g., INT105 A)")

    return RecommendationRequest(
        student_id=extracted_student_id,
        raw_grades=extracted_subjects
    )
