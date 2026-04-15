from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field
from typing import List, Optional
import uuid


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


# ==================== Table Course Master ====================
class CourseBase(BaseModel):
    course_id: str
    course_name_th: str
    course_name_en: str
    description: Optional[str] = None
    is_elective: bool = True
    topics: Optional[List[str]] = []
    credits: Optional[str] = None


class CourseReadReq(BaseModel):
    id: Optional[UUID] = None
    keyword: Optional[str] = None
    academic_year: Optional[int] = None
    semester: Optional[int] = None


class CourseUpdateReq(BaseModel):
    id: UUID
    course_id: Optional[str] = None
    course_name_th: Optional[str] = None
    course_name_en: Optional[str] = None
    description: Optional[str] = None
    is_elective: bool = True
    topics: Optional[List[str]] = []
    credits: Optional[int]


class CourseDeleteReq(BaseModel):
    id: UUID


class CourseAndOpeningCreateReq(CourseBase):
    # --- Table Opening Elective Courses ---
    academic_year: int
    semester: int
    lecturer_name: Optional[str] = None
    capacity: Optional[int]


# ==================== Table Opening Elective Courses ====================
class OpeningCourseBase(BaseModel):
    course_master_id: UUID
    academic_year: int
    semester: int
    lecturer_name: Optional[str] = None
    is_active: bool = True
    capacity: Optional[int]


class OpeningCourseUpdateReq(BaseModel):
    id: UUID
    academic_year: Optional[int] = None
    semester: Optional[int] = None
    lecturer_name: Optional[str] = None
    is_active: Optional[bool] = None


class OpeningCourseDeleteReq(BaseModel):
    id: UUID


# ============== Responses ==============
class OpeningCourseResponse(OpeningCourseBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CourseWithOpeningResponse(BaseModel):
    # course_master fields
    id: uuid.UUID
    course_id: str
    course_name_th: str
    course_name_en: str
    description: Optional[str] = None
    is_elective: bool
    topics: Optional[List[str]] = None
    credits: str
    created_at: datetime
    updated_at: datetime
    has_embedding: bool

    # opening_elective_courses fields
    academic_year: int
    semester: int
    lecturer_name: str
    capacity: int
    opening_course_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True


class CourseResponse(CourseBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    has_embedding: bool

    class Config:
        from_attributes = True
