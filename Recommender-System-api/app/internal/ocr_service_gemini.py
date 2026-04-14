import os

from click import prompt
from fastapi import UploadFile, HTTPException
from google import genai
from google.genai import types, client

from app.schemas import RecommendationRequest
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def extract_transcript_ocr(file: UploadFile) -> RecommendationRequest:
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read file: {str(e)}")

    prompt = """
    Analyze university transcript images and extract data according to the following rules:
    1. student_id: 11-digit student ID (e.g., 651305000xx).
    2. raw_grades: A list of all courses appearing on the transcript:
        - course_code: Use the 'COURSE NO.' (remove any hyphens) followed by the 'English COURSE TITLES'.
            - Example: "INT101 PROGRAMMING FUNDAMENTALS"
        - grade_letter: The grade received (A, B+, B, C+, C, D+, D, F, S).
    Special Requirements:
    - Support 2-column transcript layouts.
    - If a COURSE TITLE spans multiple lines, merge them into a single complete name.
    - Include only courses that have a visible grade.
    - If an "A+" grade is found, convert it to "A".
    """

    try:
        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            # model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(
                    data=file_bytes,
                    mime_type=file.content_type,
                ),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RecommendationRequest,
                temperature=0.1
            ),
        )

        result = RecommendationRequest.model_validate_json(response.text)

        if not result.raw_grades:
            raise HTTPException(status_code=400, detail="No courses found")

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cannot read file: {str(e)}")