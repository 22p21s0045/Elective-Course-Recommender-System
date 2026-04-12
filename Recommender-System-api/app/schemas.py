from pydantic import BaseModel

class Grade(BaseModel):
    student_id: str
    course_code: str
    rating: float

    class Config:
        from_attributes = True