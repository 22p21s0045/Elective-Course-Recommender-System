from pydantic import BaseModel, Field
from typing import List

class Grade(BaseModel):
    student_id: str
    course_code: str
    rating: float

    class Config:
        from_attributes = True


class  OCRSubject(BaseModel):
    course_code: str = Field(..., example="INT105")
    grade_letter: str = Field(..., example="A")

class RecommendationRequest(BaseModel):
    student_id: str = Field(..., example="12345")
    raw_grades: List[OCRSubject] = Field(..., min_length=1)