from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field
from typing import List, Optional


class Grade(BaseModel):
    student_id: str
    course_code: str
    rating: float

    class Config:
        from_attributes = True


class OCRSubject(BaseModel):
    course_code: str = Field(..., example="INT105")
    grade_letter: str = Field(..., example="A")


class RecommendationRequest(BaseModel):
    student_id: str = Field(..., example="12345")
    raw_grades: List[OCRSubject] = Field(..., min_length=1)


class CourseBase(BaseModel):
    course_id: str
    course_name_th: str
    course_name_en: str
    description: Optional[str] = None
    is_elective: bool = False
    topics: Optional[List[str]] = []


class CourseCreateReq(CourseBase):
    pass


class CourseReadReq(BaseModel):
    id: Optional[UUID] = None
    keyword: Optional[str] = None


class CourseUpdateReq(BaseModel):
    id: UUID
    course_id: Optional[str] = None
    course_name_th: Optional[str] = None
    course_name_en: Optional[str] = None
    description: Optional[str] = None
    is_elective: Optional[bool] = None
    topics: Optional[List[str]] = []


class CourseDeleteReq(BaseModel):
    id: UUID


class CourseResponse(CourseBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    has_embedding: bool

    class Config:
        from_attributes = True
